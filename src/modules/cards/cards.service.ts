import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCardDto, UpdateCardDto, CardQueryDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { generateCardSlug } from '../../common/utils/slug.util';
import {
  getPaginationParams,
  createPaginatedResult,
} from '../../common/utils/pagination.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async create(user: CurrentUserPayload, dto: CreateCardDto) {
    // Check card limit
    await this.checkCardLimit(user);

    // Check locked fields if user is employee
    if (user.employeeOfId) {
      await this.validateLockedFields(user, dto);
    }

    // Generate slug
    let slug = generateCardSlug(dto.firstName, dto.lastName);
    let slugExists = await this.prisma.card.findUnique({ where: { slug } });
    let attempts = 0;

    while (slugExists && attempts < 5) {
      slug = generateCardSlug(dto.firstName, dto.lastName);
      slugExists = await this.prisma.card.findUnique({ where: { slug } });
      attempts++;
    }

    // Create card with related data
    const card = await this.prisma.card.create({
      data: {
        slug,
        firstName: dto.firstName,
        lastName: dto.lastName,
        jobTitle: dto.jobTitle,
        bio: dto.bio,
        profilePhoto: dto.profilePhoto,
        coverImage: dto.coverImage,
        addressStreet: dto.addressStreet,
        addressCity: dto.addressCity,
        addressState: dto.addressState,
        addressZipCode: dto.addressZipCode,
        addressCountry: dto.addressCountry,
        primaryColor: dto.primaryColor,
        backgroundColor: dto.backgroundColor,
        fontFamily: dto.fontFamily,
        userId: user.id,
        companyId: user.companyId || user.employeeOfId,
        phones: dto.phones ? {
          create: dto.phones.map((phone, index) => ({
            type: phone.type,
            number: phone.number,
            label: phone.label,
            order: phone.order ?? index,
          })),
        } : undefined,
        emails: dto.emails ? {
          create: dto.emails.map((email, index) => ({
            type: email.type,
            email: email.email,
            label: email.label,
            order: email.order ?? index,
          })),
        } : undefined,
        socialLinks: dto.socialLinks ? {
          create: dto.socialLinks.map((link, index) => ({
            platform: link.platform,
            url: link.url,
            displayName: link.displayName,
            order: link.order ?? index,
          })),
        } : undefined,
        customLinks: dto.customLinks ? {
          create: dto.customLinks.map((link, index) => ({
            title: link.title,
            url: link.url,
            icon: link.icon,
            order: link.order ?? index,
          })),
        } : undefined,
        history: {
          create: {
            changedBy: user.id,
            changeType: 'CREATE',
            changes: { created: true },
          },
        },
      },
      include: {
        phones: { orderBy: { order: 'asc' } },
        emails: { orderBy: { order: 'asc' } },
        socialLinks: { orderBy: { order: 'asc' } },
        customLinks: { orderBy: { order: 'asc' } },
      },
    });

    return card;
  }

  async findAll(user: CurrentUserPayload, query: CardQueryDto) {
    const { skip, take } = getPaginationParams(query);

    const where: Prisma.CardWhereInput = {
      userId: user.id,
    };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        skip,
        take,
        include: {
          phones: { orderBy: { order: 'asc' } },
          emails: { orderBy: { order: 'asc' } },
          _count: {
            select: {
              analytics: true,
              shareEvents: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.card.count({ where }),
    ]);

    return createPaginatedResult(cards, total, query);
  }

  async findOne(user: CurrentUserPayload, id: string) {
    const card = await this.prisma.card.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        phones: { orderBy: { order: 'asc' } },
        emails: { orderBy: { order: 'asc' } },
        socialLinks: { orderBy: { order: 'asc' } },
        customLinks: { orderBy: { order: 'asc' } },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdateCardDto) {
    const existingCard = await this.prisma.card.findFirst({
      where: { id, userId: user.id },
      include: {
        phones: true,
        emails: true,
        socialLinks: true,
        customLinks: true,
      },
    });

    if (!existingCard) {
      throw new NotFoundException('Card not found');
    }

    // Check locked fields if user is employee
    if (user.employeeOfId) {
      await this.validateLockedFields(user, dto);
    }

    // Build changes for history
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const updateData: Prisma.CardUpdateInput = {};

    // Simple field updates
    const fields = [
      'firstName', 'lastName', 'jobTitle', 'bio', 'profilePhoto', 'coverImage',
      'addressStreet', 'addressCity', 'addressState', 'addressZipCode', 'addressCountry',
      'primaryColor', 'backgroundColor', 'fontFamily',
    ] as const;

    for (const field of fields) {
      if (dto[field] !== undefined && dto[field] !== existingCard[field]) {
        changes[field] = { old: existingCard[field], new: dto[field] };
        updateData[field] = dto[field];
      }
    }

    // Update card
    const card = await this.prisma.$transaction(async (tx) => {
      // Delete existing related records if new ones provided
      if (dto.phones) {
        await tx.cardPhone.deleteMany({ where: { cardId: id } });
      }
      if (dto.emails) {
        await tx.cardEmail.deleteMany({ where: { cardId: id } });
      }
      if (dto.socialLinks) {
        await tx.cardSocialLink.deleteMany({ where: { cardId: id } });
      }
      if (dto.customLinks) {
        await tx.cardCustomLink.deleteMany({ where: { cardId: id } });
      }

      // Update card
      const updated = await tx.card.update({
        where: { id },
        data: {
          ...updateData,
          phones: dto.phones ? {
            create: dto.phones.map((phone, index) => ({
              type: phone.type,
              number: phone.number,
              label: phone.label,
              order: phone.order ?? index,
            })),
          } : undefined,
          emails: dto.emails ? {
            create: dto.emails.map((email, index) => ({
              type: email.type,
              email: email.email,
              label: email.label,
              order: email.order ?? index,
            })),
          } : undefined,
          socialLinks: dto.socialLinks ? {
            create: dto.socialLinks.map((link, index) => ({
              platform: link.platform,
              url: link.url,
              displayName: link.displayName,
              order: link.order ?? index,
            })),
          } : undefined,
          customLinks: dto.customLinks ? {
            create: dto.customLinks.map((link, index) => ({
              title: link.title,
              url: link.url,
              icon: link.icon,
              order: link.order ?? index,
            })),
          } : undefined,
        },
        include: {
          phones: { orderBy: { order: 'asc' } },
          emails: { orderBy: { order: 'asc' } },
          socialLinks: { orderBy: { order: 'asc' } },
          customLinks: { orderBy: { order: 'asc' } },
        },
      });

      // Create history entry
      if (Object.keys(changes).length > 0) {
        await tx.cardHistory.create({
          data: {
            cardId: id,
            changedBy: user.id,
            changeType: 'UPDATE',
            changes,
          },
        });
      }

      return updated;
    });

    return card;
  }

  async remove(user: CurrentUserPayload, id: string) {
    const card = await this.prisma.card.findFirst({
      where: { id, userId: user.id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.prisma.card.delete({ where: { id } });

    return { message: 'Card deleted successfully' };
  }

  async updateStatus(user: CurrentUserPayload, id: string, isActive: boolean) {
    const card = await this.prisma.card.findFirst({
      where: { id, userId: user.id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.prisma.card.update({
      where: { id },
      data: { isActive },
    });

    return { message: `Card ${isActive ? 'activated' : 'deactivated'} successfully` };
  }

  async getHistory(user: CurrentUserPayload, id: string) {
    const card = await this.prisma.card.findFirst({
      where: { id, userId: user.id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const history = await this.prisma.cardHistory.findMany({
      where: { cardId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return history;
  }

  async checkSlugAvailability(slug: string) {
    const exists = await this.prisma.card.findUnique({ where: { slug } });
    return { available: !exists };
  }

  private async checkCardLimit(user: CurrentUserPayload) {
    const subscription = await this.getSubscription(user);

    if (!subscription) {
      throw new ForbiddenException('No active subscription');
    }

    const maxCards = subscription.maxCardsOverride ?? subscription.plan.maxCards;

    if (maxCards === null) return; // Unlimited

    const currentCount = await this.prisma.card.count({
      where: { userId: user.id },
    });

    if (currentCount >= maxCards) {
      throw new ForbiddenException(
        `Card limit reached. Maximum cards: ${maxCards}`,
      );
    }
  }

  private async getSubscription(user: CurrentUserPayload) {
    if (user.companyId || user.employeeOfId) {
      return this.prisma.subscription.findUnique({
        where: { companyId: user.companyId || user.employeeOfId },
        include: { plan: true },
      });
    }

    return this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });
  }

  private async validateLockedFields(user: CurrentUserPayload, dto: Partial<CreateCardDto>) {
    const company = await this.prisma.company.findUnique({
      where: { id: user.employeeOfId },
      select: { lockedFields: true },
    });

    if (!company) return;

    const lockedFields = company.lockedFields;
    const providedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof typeof dto] !== undefined,
    );

    const violatedFields = providedFields.filter((field) =>
      lockedFields.includes(field),
    );

    if (violatedFields.length > 0) {
      throw new ForbiddenException(
        `Cannot modify locked fields: ${violatedFields.join(', ')}`,
      );
    }
  }
}
