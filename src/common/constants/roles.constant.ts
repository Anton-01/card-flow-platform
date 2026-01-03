import { UserRole } from '@prisma/client';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.OWNER]: 100,
  [UserRole.ADMIN]: 50,
  [UserRole.EMPLOYEE]: 10,
  [UserRole.INDIVIDUAL]: 5,
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.OWNER]: 'Super administrador del sistema con acceso completo',
  [UserRole.ADMIN]: 'Administrador de empresa con control total sobre la organización',
  [UserRole.EMPLOYEE]: 'Empleado de empresa con permisos limitados',
  [UserRole.INDIVIDUAL]: 'Usuario individual con plan básico',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: [
    'system:manage',
    'users:manage',
    'companies:manage',
    'billing:manage',
    'plans:manage',
    'audit:view',
  ],
  [UserRole.ADMIN]: [
    'company:manage',
    'employees:manage',
    'departments:manage',
    'invitations:manage',
    'cards:manage',
    'analytics:view',
    'branding:manage',
  ],
  [UserRole.EMPLOYEE]: [
    'card:own',
    'profile:manage',
    'analytics:own',
  ],
  [UserRole.INDIVIDUAL]: [
    'card:own',
    'profile:manage',
    'analytics:own',
    'subscription:own',
  ],
};
