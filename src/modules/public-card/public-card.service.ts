import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsEventType } from '@prisma/client';

@Injectable()
export class PublicCardService {
  constructor(private prisma: PrismaService) {}

  async getCardBySlug(slug: string, req: Request) {
    const card = await this.prisma.card.findUnique({
      where: { slug },
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
            primaryColor: true,
            secondaryColor: true,
            fontFamily: true,
          },
        },
      },
    });

    if (!card || !card.isActive) {
      throw new NotFoundException('Card not found');
    }

    // Track view asynchronously
    this.trackEvent(slug, AnalyticsEventType.VIEW, {}, req).catch(() => {
      // Ignore tracking errors
    });

    return card;
  }

  async trackEvent(
    slug: string,
    eventType: AnalyticsEventType,
    metadata: Record<string, unknown>,
    req: Request,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const userAgent = req.headers['user-agent'] || '';
    const deviceInfo = this.parseUserAgent(userAgent);

    await this.prisma.analyticsEvent.create({
      data: {
        type: eventType,
        cardId: card.id,
        ipAddress: req.ip || null,
        userAgent: userAgent.substring(0, 500),
        referer: req.headers.referer || null,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        metadata,
      },
    });

    return { success: true };
  }

  async generateVCard(slug: string, req: Request) {
    const card = await this.prisma.card.findUnique({
      where: { slug },
      include: {
        phones: { orderBy: { order: 'asc' } },
        emails: { orderBy: { order: 'asc' } },
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!card || !card.isActive) {
      throw new NotFoundException('Card not found');
    }

    // Track vCard download
    this.trackEvent(slug, AnalyticsEventType.VCARD_DOWNLOAD, {}, req).catch(() => {
      // Ignore tracking errors
    });

    // Generate vCard content
    const vCardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.firstName} ${card.lastName}`,
      `N:${card.lastName};${card.firstName};;;`,
    ];

    if (card.jobTitle) {
      vCardLines.push(`TITLE:${card.jobTitle}`);
    }

    if (card.company?.name) {
      vCardLines.push(`ORG:${card.company.name}`);
    }

    for (const phone of card.phones) {
      const typeMap: Record<string, string> = {
        MOBILE: 'CELL',
        WORK: 'WORK',
        HOME: 'HOME',
        FAX: 'FAX',
        OTHER: 'OTHER',
      };
      vCardLines.push(`TEL;TYPE=${typeMap[phone.type] || 'CELL'}:${phone.number}`);
    }

    for (const email of card.emails) {
      const typeMap: Record<string, string> = {
        WORK: 'WORK',
        PERSONAL: 'HOME',
        OTHER: 'OTHER',
      };
      vCardLines.push(`EMAIL;TYPE=${typeMap[email.type] || 'WORK'}:${email.email}`);
    }

    if (card.addressStreet || card.addressCity) {
      const address = [
        '',
        '',
        card.addressStreet || '',
        card.addressCity || '',
        card.addressState || '',
        card.addressZipCode || '',
        card.addressCountry || '',
      ].join(';');
      vCardLines.push(`ADR;TYPE=WORK:${address}`);
    }

    if (card.profilePhoto) {
      vCardLines.push(`PHOTO;VALUE=uri:${card.profilePhoto}`);
    }

    vCardLines.push('END:VCARD');

    return {
      content: vCardLines.join('\r\n'),
      filename: `${card.firstName}-${card.lastName}.vcf`,
      contentType: 'text/vcard',
    };
  }

  private parseUserAgent(userAgent: string): {
    deviceType: string;
    browser: string;
    os: string;
  } {
    const ua = userAgent.toLowerCase();

    // Device type
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
      deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Browser
    let browser = 'unknown';
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('edg')) browser = 'Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

    // OS
    let os = 'unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

    return { deviceType, browser, os };
  }
}
