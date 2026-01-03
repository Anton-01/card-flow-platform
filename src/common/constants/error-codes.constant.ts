export enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'AUTH_001',
  EMAIL_NOT_VERIFIED = 'AUTH_002',
  INVALID_2FA_CODE = 'AUTH_003',
  TOKEN_EXPIRED = 'AUTH_004',
  ACCOUNT_DISABLED = 'AUTH_005',
  SESSION_EXPIRED = 'AUTH_006',

  // Users
  USER_NOT_FOUND = 'USER_001',
  EMAIL_ALREADY_EXISTS = 'USER_002',
  INVALID_PASSWORD = 'USER_003',
  USER_DELETED = 'USER_004',

  // Cards
  CARD_NOT_FOUND = 'CARD_001',
  SLUG_ALREADY_EXISTS = 'CARD_002',
  CARD_LIMIT_REACHED = 'CARD_003',
  FIELD_LOCKED = 'CARD_004',
  CARD_INACTIVE = 'CARD_005',

  // Company
  COMPANY_NOT_FOUND = 'COMPANY_001',
  NOT_COMPANY_ADMIN = 'COMPANY_002',
  COMPANY_INACTIVE = 'COMPANY_003',
  EMPLOYEE_LIMIT_REACHED = 'COMPANY_004',

  // Departments
  DEPARTMENT_NOT_FOUND = 'DEPT_001',
  DEPARTMENT_NAME_EXISTS = 'DEPT_002',

  // Billing
  SUBSCRIPTION_REQUIRED = 'BILLING_001',
  PAYMENT_FAILED = 'BILLING_002',
  SUBSCRIPTION_EXPIRED = 'BILLING_003',
  INVALID_PLAN = 'BILLING_004',
  PAYMENT_METHOD_REQUIRED = 'BILLING_005',

  // Invitations
  INVITATION_EXPIRED = 'INV_001',
  INVITATION_ALREADY_ACCEPTED = 'INV_002',
  INVITATION_NOT_FOUND = 'INV_003',
  INVITATION_CANCELLED = 'INV_004',

  // Uploads
  FILE_TOO_LARGE = 'UPLOAD_001',
  INVALID_FILE_TYPE = 'UPLOAD_002',
  UPLOAD_FAILED = 'UPLOAD_003',

  // General
  VALIDATION_ERROR = 'GEN_001',
  FORBIDDEN = 'GEN_002',
  NOT_FOUND = 'GEN_003',
  RATE_LIMIT_EXCEEDED = 'GEN_004',
  INTERNAL_ERROR = 'GEN_005',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'Email o contraseña incorrectos',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Por favor verifica tu email antes de continuar',
  [ErrorCode.INVALID_2FA_CODE]: 'Código de verificación inválido o expirado',
  [ErrorCode.TOKEN_EXPIRED]: 'El token ha expirado',
  [ErrorCode.ACCOUNT_DISABLED]: 'Tu cuenta ha sido desactivada',
  [ErrorCode.SESSION_EXPIRED]: 'Tu sesión ha expirado',
  [ErrorCode.USER_NOT_FOUND]: 'Usuario no encontrado',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Este email ya está registrado',
  [ErrorCode.INVALID_PASSWORD]: 'La contraseña actual es incorrecta',
  [ErrorCode.USER_DELETED]: 'Esta cuenta ha sido eliminada',
  [ErrorCode.CARD_NOT_FOUND]: 'Tarjeta no encontrada',
  [ErrorCode.SLUG_ALREADY_EXISTS]: 'Este slug ya está en uso',
  [ErrorCode.CARD_LIMIT_REACHED]: 'Has alcanzado el límite de tarjetas de tu plan',
  [ErrorCode.FIELD_LOCKED]: 'Este campo está bloqueado por la configuración de empresa',
  [ErrorCode.CARD_INACTIVE]: 'Esta tarjeta está desactivada',
  [ErrorCode.COMPANY_NOT_FOUND]: 'Empresa no encontrada',
  [ErrorCode.NOT_COMPANY_ADMIN]: 'No tienes permisos de administrador',
  [ErrorCode.COMPANY_INACTIVE]: 'Esta empresa está desactivada',
  [ErrorCode.EMPLOYEE_LIMIT_REACHED]: 'Has alcanzado el límite de empleados de tu plan',
  [ErrorCode.DEPARTMENT_NOT_FOUND]: 'Departamento no encontrado',
  [ErrorCode.DEPARTMENT_NAME_EXISTS]: 'Ya existe un departamento con este nombre',
  [ErrorCode.SUBSCRIPTION_REQUIRED]: 'Se requiere una suscripción activa',
  [ErrorCode.PAYMENT_FAILED]: 'El pago no pudo ser procesado',
  [ErrorCode.SUBSCRIPTION_EXPIRED]: 'Tu suscripción ha expirado',
  [ErrorCode.INVALID_PLAN]: 'Plan inválido',
  [ErrorCode.PAYMENT_METHOD_REQUIRED]: 'Se requiere un método de pago',
  [ErrorCode.INVITATION_EXPIRED]: 'Esta invitación ha expirado',
  [ErrorCode.INVITATION_ALREADY_ACCEPTED]: 'Esta invitación ya fue aceptada',
  [ErrorCode.INVITATION_NOT_FOUND]: 'Invitación no encontrada',
  [ErrorCode.INVITATION_CANCELLED]: 'Esta invitación fue cancelada',
  [ErrorCode.FILE_TOO_LARGE]: 'El archivo es demasiado grande',
  [ErrorCode.INVALID_FILE_TYPE]: 'Tipo de archivo no permitido',
  [ErrorCode.UPLOAD_FAILED]: 'Error al subir el archivo',
  [ErrorCode.VALIDATION_ERROR]: 'Error de validación',
  [ErrorCode.FORBIDDEN]: 'No tienes permiso para realizar esta acción',
  [ErrorCode.NOT_FOUND]: 'Recurso no encontrado',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Demasiadas solicitudes. Intenta de nuevo más tarde',
  [ErrorCode.INTERNAL_ERROR]: 'Error interno del servidor',
};
