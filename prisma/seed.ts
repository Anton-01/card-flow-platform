import { PrismaClient, PlanType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Plans
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { type: PlanType.BASIC },
      update: {},
      create: {
        name: 'Basic',
        type: PlanType.BASIC,
        description: 'Perfecto para individuos que inician su presencia digital',
        priceMonthly: 0,
        priceYearly: 0,
        maxCards: 1,
        maxEmployees: null,
        customDomain: false,
        advancedAnalytics: false,
        prioritySupport: false,
        isActive: true,
      },
    }),
    prisma.plan.upsert({
      where: { type: PlanType.PRO },
      update: {},
      create: {
        name: 'Pro',
        type: PlanType.PRO,
        description: 'Ideal para profesionales y pequeños equipos',
        priceMonthly: 9.99,
        priceYearly: 99.99,
        maxCards: 5,
        maxEmployees: 10,
        customDomain: false,
        advancedAnalytics: true,
        prioritySupport: false,
        isActive: true,
      },
    }),
    prisma.plan.upsert({
      where: { type: PlanType.ENTERPRISE },
      update: {},
      create: {
        name: 'Enterprise',
        type: PlanType.ENTERPRISE,
        description: 'Solución completa para empresas y corporativos',
        priceMonthly: 49.99,
        priceYearly: 499.99,
        maxCards: null, // Unlimited
        maxEmployees: null, // Unlimited
        customDomain: true,
        advancedAnalytics: true,
        prioritySupport: true,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Plans created:', plans.map(p => p.name).join(', '));

  // Create System Owner
  const ownerPassword = await bcrypt.hash('CardFlow2024!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'admin@cardflow.com' },
    update: {},
    create: {
      email: 'admin@cardflow.com',
      passwordHash: ownerPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.OWNER,
      isEmailVerified: true,
      isActive: true,
      timezone: 'America/Mexico_City',
      language: 'es',
    },
  });

  console.log('✅ System owner created:', owner.email);

  // Create default system configurations
  const configs = await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'app.maintenance_mode' },
      update: {},
      create: {
        key: 'app.maintenance_mode',
        value: { enabled: false, message: '' },
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'app.registration_enabled' },
      update: {},
      create: {
        key: 'app.registration_enabled',
        value: { enabled: true },
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'email.templates' },
      update: {},
      create: {
        key: 'email.templates',
        value: {
          welcome: { subject: '¡Bienvenido a CardFlow!' },
          verification: { subject: 'Verifica tu email - CardFlow' },
          passwordReset: { subject: 'Restablecer contraseña - CardFlow' },
          invitation: { subject: 'Has sido invitado a unirte - CardFlow' },
          twoFactor: { subject: 'Tu código de verificación - CardFlow' },
        },
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'trial.duration_days' },
      update: {},
      create: {
        key: 'trial.duration_days',
        value: { days: 14 },
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'upload.max_file_size' },
      update: {},
      create: {
        key: 'upload.max_file_size',
        value: {
          profilePhoto: 5 * 1024 * 1024, // 5MB
          coverImage: 10 * 1024 * 1024,   // 10MB
          logo: 2 * 1024 * 1024,          // 2MB
        },
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'social.platforms' },
      update: {},
      create: {
        key: 'social.platforms',
        value: {
          platforms: [
            { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', urlPattern: 'https://linkedin.com/in/' },
            { id: 'twitter', name: 'Twitter/X', icon: 'twitter', urlPattern: 'https://twitter.com/' },
            { id: 'instagram', name: 'Instagram', icon: 'instagram', urlPattern: 'https://instagram.com/' },
            { id: 'facebook', name: 'Facebook', icon: 'facebook', urlPattern: 'https://facebook.com/' },
            { id: 'tiktok', name: 'TikTok', icon: 'tiktok', urlPattern: 'https://tiktok.com/@' },
            { id: 'github', name: 'GitHub', icon: 'github', urlPattern: 'https://github.com/' },
            { id: 'youtube', name: 'YouTube', icon: 'youtube', urlPattern: 'https://youtube.com/' },
            { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', urlPattern: 'https://wa.me/' },
            { id: 'telegram', name: 'Telegram', icon: 'telegram', urlPattern: 'https://t.me/' },
            { id: 'website', name: 'Website', icon: 'globe', urlPattern: '' },
          ],
        },
      },
    }),
  ]);

  console.log('✅ System configurations created:', configs.length);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
