import slugify from 'slugify';
import { nanoid } from 'nanoid';

export function generateSlug(text: string): string {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  // Add a short unique identifier
  const uniqueId = nanoid(6);

  return `${baseSlug}-${uniqueId}`;
}

export function generateCompanySlug(companyName: string): string {
  return slugify(companyName, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateCardSlug(firstName: string, lastName: string): string {
  const baseName = `${firstName}-${lastName}`;
  return generateSlug(baseName);
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 100;
}
