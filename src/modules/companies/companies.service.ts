import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole, PlanType } from '@prisma/client';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateBrandingDto,
  UpdateLockedFieldsDto,
  LOCKABLE_CARD_FIELDS,
} from './dto';
import { generateCompanySlug } from '../../common/utils/slug.util';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { TRIAL_DURATION_DAYS } from '../../common/constants/plans.constant';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async createCompany(userId: string, dto: CreateCompanyDto) {
    // Check if user already has a company
    const existingCompany = await this.prisma.company.findFirst({
      where: {
        admin: { id: userId },
      },
    });

    if (existingCompany) {
      throw new BadRequestException('User already has a company');
    }

    // Generate slug
    let slug = generateCompanySlug(dto.name);
    let slugExists = await this.prisma.company.findUnique({ where: { slug } });
    let attempts = 0;

    while (slugExists && attempts < 5) {
      slug = `${generateCompanySlug(dto.name)}-${Date.now().toString(36)}`;
      slugExists = await this.prisma.company.findUnique({ where: { slug } });
      attempts++;
    }

    // Get Pro plan for companies
    const proPlan = await this.prisma.plan.findUnique({
      where: { type: PlanType.PRO },
    });

    if (!proPlan) {
      throw new BadRequestException('Pro plan not found');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);

    // Create company with transaction
    const company = await this.prisma.$transaction(async (tx) => {
      // Create company
      const newCompany = await tx.company.create({
        data: {
          name: dto.name,
          slug,
          industry: dto.industry,
          website: dto.website,
          description: dto.description,
          subscription: {
            create: {
              planId: proPlan.id,
              status: 'TRIAL',
              trialEndsAt,
            },
          },
        },
      });

      // Update user to be admin
      await tx.user.update({
        where: { id: userId },
        data: {
          companyId: newCompany.id,
          role: UserRole.ADMIN,
        },
      });

      // Delete user's individual subscription if exists
      await tx.subscription.deleteMany({
        where: { userId },
      });

      return newCompany;
    });

    return company;
  }

  async getCurrentCompany(user: CurrentUserPayload) {
    const companyId = user.companyId || user.employeeOfId;

    if (!companyId) {
      throw new NotFoundException('No company associated with user');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            employees: true,
            cards: true,
            departments: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async updateCompany(user: CurrentUserPayload, dto: UpdateCompanyDto) {
    this.ensureCompanyAdmin(user);

    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: dto.name,
        industry: dto.industry,
        website: dto.website,
        description: dto.description,
      },
    });

    return company;
  }

  async updateBranding(user: CurrentUserPayload, dto: UpdateBrandingDto) {
    this.ensureCompanyAdmin(user);

    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: {
        logo: dto.logo,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        fontFamily: dto.fontFamily,
        coverImage: dto.coverImage,
      },
    });

    return company;
  }

  async getLockedFields(user: CurrentUserPayload) {
    const companyId = user.companyId || user.employeeOfId;

    if (!companyId) {
      return { lockedFields: [] };
    }

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { lockedFields: true },
    });

    return { lockedFields: company?.lockedFields || [] };
  }

  async updateLockedFields(user: CurrentUserPayload, dto: UpdateLockedFieldsDto) {
    this.ensureCompanyAdmin(user);

    // Validate field names
    const invalidFields = dto.lockedFields.filter(
      (field) => !LOCKABLE_CARD_FIELDS.includes(field as typeof LOCKABLE_CARD_FIELDS[number]),
    );

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Invalid field names: ${invalidFields.join(', ')}`,
      );
    }

    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: { lockedFields: dto.lockedFields },
    });

    return { lockedFields: company.lockedFields };
  }

  async updateTemplate(user: CurrentUserPayload, templateConfig: Record<string, unknown>) {
    this.ensureCompanyAdmin(user);

    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: { templateConfig },
    });

    return { templateConfig: company.templateConfig };
  }

  async getMembers(user: CurrentUserPayload) {
    this.ensureCompanyAdmin(user);

    const members = await this.prisma.user.findMany({
      where: {
        OR: [
          { companyId: user.companyId },
          { employeeOfId: user.companyId },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return members;
  }

  async removeMember(user: CurrentUserPayload, memberId: string) {
    this.ensureCompanyAdmin(user);

    // Cannot remove yourself
    if (memberId === user.id) {
      throw new BadRequestException('Cannot remove yourself from the company');
    }

    const member = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        employeeOfId: user.companyId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Remove from company
    await this.prisma.user.update({
      where: { id: memberId },
      data: {
        employeeOfId: null,
        departmentId: null,
        role: UserRole.INDIVIDUAL,
      },
    });

    return { message: 'Member removed from company' };
  }

  async updateMemberDepartment(
    user: CurrentUserPayload,
    memberId: string,
    departmentId: string | null,
  ) {
    this.ensureCompanyAdmin(user);

    const member = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        employeeOfId: user.companyId,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (departmentId) {
      const department = await this.prisma.department.findFirst({
        where: {
          id: departmentId,
          companyId: user.companyId,
        },
      });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    await this.prisma.user.update({
      where: { id: memberId },
      data: { departmentId },
    });

    return { message: 'Member department updated' };
  }

  private ensureCompanyAdmin(user: CurrentUserPayload): void {
    if (!user.companyId) {
      throw new ForbiddenException('User is not a company admin');
    }
  }
}
