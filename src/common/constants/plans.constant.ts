import { PlanType } from '@prisma/client';

export const PLAN_FEATURES = {
  [PlanType.BASIC]: {
    maxCards: 1,
    maxEmployees: null,
    customDomain: false,
    advancedAnalytics: false,
    prioritySupport: false,
    features: [
      'Una tarjeta digital',
      'Información básica de contacto',
      'Código QR',
      'Compartir por enlace',
      'Estadísticas básicas',
    ],
  },
  [PlanType.PRO]: {
    maxCards: 5,
    maxEmployees: 10,
    customDomain: false,
    advancedAnalytics: true,
    prioritySupport: false,
    features: [
      'Hasta 5 tarjetas digitales',
      'Hasta 10 empleados',
      'Personalización de marca',
      'Estadísticas avanzadas',
      'Exportación de datos',
      'Múltiples métodos de compartir',
      'Historial de cambios',
    ],
  },
  [PlanType.ENTERPRISE]: {
    maxCards: null, // Unlimited
    maxEmployees: null, // Unlimited
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    features: [
      'Tarjetas ilimitadas',
      'Empleados ilimitados',
      'Dominio personalizado',
      'API access',
      'Branding completo',
      'Campos bloqueados',
      'Soporte prioritario',
      'Manager de cuenta dedicado',
      'SSO/SAML (próximamente)',
    ],
  },
};

export const TRIAL_DURATION_DAYS = 14;
