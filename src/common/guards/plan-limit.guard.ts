import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

export const PLAN_LIMIT_KEY = 'planLimit';
export type PlanLimitType = 'cards' | 'employees';

export const PlanLimit = (type: PlanLimitType) => {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(PLAN_LIMIT_KEY, type, descriptor.value as object);
    return descriptor;
  };
};

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(PrismaService) private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<PlanLimitType>(
      PLAN_LIMIT_KEY,
      context.getHandler(),
    );

    if (!limitType) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user: CurrentUserPayload }>();

    if (!user) {
      return true;
    }

    const subscription = await this.getSubscription(user);

    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    const plan = subscription.plan;
    const currentCount = await this.getCurrentCount(user, limitType);

    let limit: number | null;
    let overrideLimit: number | null = null;

    if (limitType === 'cards') {
      limit = plan.maxCards;
      overrideLimit = subscription.maxCardsOverride;
    } else {
      limit = plan.maxEmployees;
      overrideLimit = subscription.maxEmployeesOverride;
    }

    const effectiveLimit = overrideLimit ?? limit;

    if (effectiveLimit !== null && currentCount >= effectiveLimit) {
      throw new ForbiddenException(
        `Plan limit reached. Maximum ${limitType}: ${effectiveLimit}`,
      );
    }

    return true;
  }

  private async getSubscription(user: CurrentUserPayload) {
    if (user.companyId || user.employeeOfId) {
      const companyId = user.companyId || user.employeeOfId;
      return this.prisma.subscription.findUnique({
        where: { companyId },
        include: { plan: true },
      });
    }

    return this.prisma.subscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });
  }

  private async getCurrentCount(
    user: CurrentUserPayload,
    type: PlanLimitType,
  ): Promise<number> {
    if (type === 'cards') {
      if (user.companyId || user.employeeOfId) {
        return this.prisma.card.count({
          where: { companyId: user.companyId || user.employeeOfId },
        });
      }
      return this.prisma.card.count({
        where: { userId: user.id },
      });
    }

    if (type === 'employees') {
      const companyId = user.companyId || user.employeeOfId;
      if (!companyId) return 0;

      return this.prisma.user.count({
        where: { employeeOfId: companyId },
      });
    }

    return 0;
  }
}
