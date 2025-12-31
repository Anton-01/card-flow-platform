import xss from 'xss';

const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

export function sanitizeHtml(input: string): string {
  return xss(input, xssOptions);
}

export function sanitizeObject<T extends object>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as object);
    }
  }

  return sanitized;
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}
