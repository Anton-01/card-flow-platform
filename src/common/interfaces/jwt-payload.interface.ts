export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  companyId?: string;
  employeeOfId?: string;
  departmentId?: string;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string; // User ID
  sessionId: string;
  iat?: number;
  exp?: number;
}
