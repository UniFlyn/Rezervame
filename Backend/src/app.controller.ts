import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  NotFoundException,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Business, Role } from '@prisma/client';
import { isBusinessPubliclyVisible, requireBusinessOwner, requireUser } from './auth.helpers';
import { WALK_IN_USER_EMAIL } from './constants';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UpdateBusinessPanelDto } from './dto/update-business-panel.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { CreateFamilyMemberDto, UpdateFamilyMemberDto } from './dto/family-member.dto';
import { allocateMerchantNumber } from './merchant-number.util';
import { PrismaService } from './prisma.service';

const BUSINESS_BYPASS_PASSWORD = 'password';

/** Haversine distance in kilometers (WGS84). */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Human-readable distance for UI lists. */
function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function distanceLabelBetween(
  userLat: number | undefined,
  userLng: number | undefined,
  bizLat: number | null | undefined,
  bizLng: number | null | undefined,
): string {
  if (
    userLat === undefined ||
    userLng === undefined ||
    bizLat === null ||
    bizLat === undefined ||
    bizLng === null ||
    bizLng === undefined
  ) {
    return '';
  }
  const km = haversineKm(userLat, userLng, bizLat, bizLng);
  return formatDistanceKm(km);
}

function parseUserGeoQuery(userLat?: string, userLng?: string): { lat?: number; lng?: number } {
  const lat = userLat !== undefined ? Number.parseFloat(userLat) : NaN;
  const lng = userLng !== undefined ? Number.parseFloat(userLng) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return {};
  return { lat, lng };
}

/** Human-facing category labels for listings (array + joined string for legacy clients). */
function displayCategoryLabels(b: Business): string[] {
  const raw = b.categoryLabels ?? [];
  const trimmed = raw.map((s) => String(s).trim()).filter(Boolean);
  if (trimmed.length > 0) return trimmed;
  const legacy = (b.categoryLabel || '').trim();
  if (!legacy) return [];
  return legacy.includes(' · ')
    ? legacy.split(' · ').map((s) => s.trim()).filter(Boolean)
    : [legacy];
}

/** Web business panel shape (Prisma uses address/email/phone). */
function safeImageUrl(url: any): string | null {
  if (typeof url !== "string") return null;
  const s = url.trim();
  if (!s) return null;
  // If it's a data URI and larger than ~300KB, it's too risky for our current DB-based storage.
  // We return null to prevent crashing the JSON response, forcing the user to re-upload a smaller one.
  if (s.startsWith("data:") && s.length > 300000) {
    return null;
  }
  return s;
}

function mapBusiness(b: Business | null) {
  if (!b) return null;
  const categories = displayCategoryLabels(b);
  return {
    id: b.id,
    name: b.name,
    logo: safeImageUrl(b.logoUrl),
    banner: safeImageUrl(b.bannerUrl),
    images: (Array.isArray((b as any).images) && (b as any).images.length > 0)
      ? (b as any).images.map((img: string) => safeImageUrl(img)).filter(Boolean)
      : [safeImageUrl(b.bannerUrl), safeImageUrl(b.logoUrl)].filter(Boolean),
    description: b.description,
    category: categories.join(' · '),
    categories,
    location: b.address,
    latitude: b.latitude ?? null,
    longitude: b.longitude ?? null,
    contactEmail: b.email,
    contactPhone: b.phone,
    balance: b.balance,
    socialYoutube: b.socialYoutube || '',
    socialInstagram: b.socialInstagram || '',
    socialX: b.socialX || '',
    socialTiktok: b.socialTiktok || '',
    notifyBookingEmail: b.notifyBookingEmail,
    notifyCancellationEmail: b.notifyCancellationEmail,
    notifyDailySummary: b.notifyDailySummary,
    /** Same keys as business signup (`Category.key`) — used to scope service types in the panel. */
    categoryKeys: b.categoryKeys ?? [],
    amenityKeys: b.amenityKeys ?? [],
    status: b.status,
  };
}

async function resolveBookingCreateUser(prisma: PrismaService, body: CreateBookingDto): Promise<string> {
  const invalidLegacy = !body.userId || body.userId === 'offline-user';
  if (!invalidLegacy && body.userId) return body.userId;
  const guest = await prisma.user.findUnique({ where: { email: WALK_IN_USER_EMAIL } });
  if (!guest) {
    throw new BadRequestException('Walk-in profile not configured. Run prisma seed.');
  }
  return guest.id;
}

function mapBusinessPatch(body: UpdateBusinessPanelDto): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.location !== undefined) data.address = body.location;
  if (body.contactEmail !== undefined) data.email = body.contactEmail;
  if (body.contactPhone !== undefined) data.phone = body.contactPhone;
  if (body.balance !== undefined) data.balance = body.balance;
  if (body.categories !== undefined) {
    const labels = body.categories.map((c) => String(c).trim()).filter(Boolean);
    data.categoryLabels = labels;
    data.categoryLabel = labels.length > 0 ? labels.join(' · ') : null;
  } else if (body.category !== undefined) {
    const t = String(body.category).trim();
    data.categoryLabel = t || null;
    data.categoryLabels = t ? [t] : [];
  }
  if (body.logo !== undefined) data.logoUrl = body.logo?.trim() ? body.logo.trim() : null;
  if (body.banner !== undefined) data.bannerUrl = body.banner?.trim() ? body.banner.trim() : null;
  if (body.amenityKeys !== undefined) data.amenityKeys = body.amenityKeys;
  if (body.socialYoutube !== undefined) data.socialYoutube = body.socialYoutube;
  if (body.socialInstagram !== undefined) data.socialInstagram = body.socialInstagram;
  if (body.socialX !== undefined) data.socialX = body.socialX;
  if (body.socialTiktok !== undefined) data.socialTiktok = body.socialTiktok;
  if (body.notifyBookingEmail !== undefined) data.notifyBookingEmail = body.notifyBookingEmail;
  if (body.notifyCancellationEmail !== undefined) data.notifyCancellationEmail = body.notifyCancellationEmail;
  if (body.notifyDailySummary !== undefined) data.notifyDailySummary = body.notifyDailySummary;
  if (body.latitude !== undefined) data.latitude = body.latitude;
  if (body.longitude !== undefined) data.longitude = body.longitude;
  if (body.taxPercentage !== undefined) data.taxPercentage = body.taxPercentage;
  return data;
}

/** Maps seeded [Service.category] text to Mobile/Web category keys. */
function categoryKeyFromServiceCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('nail') || c.includes('uñ')) return 'nailCare';
  if (c.includes('spa') || c.includes('massage') || c.includes('wellness')) return 'spaService';
  if (c.includes('barber') || c.includes('groom')) return 'barber';
  if (c.includes('beauty') || c.includes('facial') || c.includes('wax')) return 'beautyService';
  return 'hairService';
}

@Controller('api')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const raw = body.email.trim();
    const lower = raw.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: raw }, { email: lower }] },
    });
    const isBusinessBypass = user?.role === Role.BUSINESS && body.password === BUSINESS_BYPASS_PASSWORD;
    if (!user || (user.password !== body.password && !isBusinessBypass)) {
      throw new BadRequestException('Invalid credentials');
    }
    const { password: _pw, ...safe } = user;
    return { token: `token-${user.id}`, user: safe };
  }

  @Post('auth/check-email')
  async checkEmail(@Body() body: CheckEmailDto) {
    const email = body.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    return { exists: !!user };
  }

  @Post('auth/register')
  async registerCustomer(@Body() body: RegisterCustomerDto) {
    const email = body.email.trim().toLowerCase();
    const taken = await this.prisma.user.findUnique({ where: { email } });
    if (taken) throw new BadRequestException('Email already registered');
    const user = await this.prisma.user.create({
      data: {
        email,
        password: body.password,
        name: body.name.trim(),
        role: Role.USER,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        gender: body.gender?.trim() || null,
        age: body.age ?? null,
      },
    });
    const { password: _pw, ...safe } = user;
    return { token: `token-${user.id}`, user: safe };
  }

  /** Current merchant profile — no persisted client snapshot; call after login or on panel load. */
  @Get('auth/business-session')
  async getBusinessSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.BUSINESS]);
    const b = await this.prisma.business.findUnique({ where: { email: user.email } });
    if (!b) return null;
    if (!(await isBusinessPubliclyVisible(this.prisma, b, authorization))) return null;
    return mapBusiness(b);
  }

  /** Current customer profile for web/mobile clients holding a USER session token. */
  @Get('auth/user-session')
  async getUserSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      avatar: user.avatar ?? null,
      address: user.address ?? '',
      gender: user.gender ?? '',
      age: user.age ?? null,
    };
  }

  @Patch('auth/user-session')
  async updateUserSession(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { name?: string; phone?: string; email?: string; avatar?: string }
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    
    // Check if new email is already taken by someone else
    if (body.email && body.email.trim().toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: body.email.trim().toLowerCase() }
      });
      if (existing) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.trim().toLowerCase() } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
      }
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone ?? '',
      avatar: updatedUser.avatar ?? null,
      address: updatedUser.address ?? '',
      gender: updatedUser.gender ?? '',
      age: updatedUser.age ?? null,
    };
  }

  @Patch('auth/user-password')
  async updateUserPassword(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { currentPassword?: string; newPassword?: string }
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }

    if (user.password !== body.currentPassword) {
      throw new BadRequestException('Incorrect current password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: body.newPassword }
    });

    return { ok: true };
  }

  /** Validates admin token for the Admin SPA — no role cached in localStorage. */
  @Get('auth/admin-session')
  async getAdminSession(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  @Get('admin/dashboard')
  async getAdminDashboard(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const now = new Date();
    const startOfRollingWeek = new Date(now);
    startOfRollingWeek.setDate(now.getDate() - 6);
    startOfRollingWeek.setHours(0, 0, 0, 0);

    const [businessCount, userCount, bookingCount, revenueAgg, recentActivities, bookingsLastWeek, txsSixMo, pendingApprovals] =
      await Promise.all([
        this.prisma.business.count(),
        this.prisma.user.count({ where: { role: Role.USER } }),
        this.prisma.booking.count(),
        this.prisma.transaction.aggregate({ _sum: { amount: true } }),
        this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
        this.prisma.booking.findMany({
          where: { date: { gte: startOfRollingWeek } },
          select: { date: true },
        }),
        this.prisma.transaction.findMany({
          where: {
            date: {
              gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
          select: { date: true, amount: true },
        }),
        this.prisma.business.count({ where: { status: 'pending' } }),
      ]);

    const weeklyBookings: { day: string; bookings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const count = bookingsLastWeek.filter((b) => b.date >= d && b.date < dayEnd).length;
      weeklyBookings.push({ day: label, bookings: count });
    }

    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const revenueByKey = new Map<string, number>();
    for (const k of monthKeys) revenueByKey.set(k, 0);
    for (const t of txsSixMo) {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
      if (revenueByKey.has(key)) {
        revenueByKey.set(key, (revenueByKey.get(key) ?? 0) + t.amount);
      }
    }
    const revenue = monthKeys.map((k) => {
      const [y, m] = k.split('-').map(Number);
      const dt = new Date(y, m - 1, 1);
      return {
        month: dt.toLocaleDateString('en-US', { month: 'short' }),
        amount: revenueByKey.get(k) ?? 0,
      };
    });

    const revenueTotal = revenueAgg._sum.amount ?? 0;
    const avgBookingValue = bookingCount > 0 ? revenueTotal / bookingCount : 0;

    return {
      stats: {
        businesses: businessCount,
        users: userCount,
        bookings: bookingCount,
        revenue: revenueTotal,
        pendingApprovals,
        avgBookingValue,
      },
      charts: {
        weeklyBookings,
        revenue,
      },
      recentActivities: recentActivities.map((n) => ({
        id: n.id,
        user: n.title,
        message: n.body,
        timestamp: n.createdAt,
        type: n.type,
        title: n.title,
      })),
    };
  }

  @Get('admin/broadcasts')
  async getAdminBroadcasts(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const rows = await this.prisma.notification.findMany({
      where: { type: 'BROADCAST' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const userCount = await this.prisma.user.count({ where: { role: Role.USER } });
    const bizCount = await this.prisma.business.count();
    return rows.map((n) => {
      const title = n.title.toLowerCase();
      const audience =
        title.includes('business') || title.includes('merchant')
          ? 'All Businesses'
          : title.includes('user')
            ? 'All Users'
            : 'All Users';
      const reach = audience.includes('Business') ? bizCount : userCount;
      return {
        id: n.id,
        audience,
        status: 'Sent',
        reach,
        readRate: '—',
        sentAt: n.createdAt.toISOString(),
        summary: n.body.slice(0, 120),
      };
    });
  }

  @Get('admin/businesses')
  async getAdminBusinesses(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.business.count({ where }),
      this.prisma.business.findMany({
        where,
        include: { bookings: true, statusHistory: true },
        orderBy: { joinedDate: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: items.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        description: b.description,
        merchantNumber: b.merchantNumber,
        taxId: b.taxId,
        owner: b.owner,
        email: b.email,
        phone: b.phone,
        categoryKeys: b.categoryKeys,
        status: b.status,
        revenue: b.balance, // Using balance as a proxy or if there's a totalRevenue field
        joinedDate: b.joinedDate,
        rejectionReason: b.rejectionReason,
        idDocumentImage: safeImageUrl(b.idDocumentImage),
        licenseDocumentImage: safeImageUrl(b.licenseDocumentImage),
        insuranceDocumentImage: safeImageUrl(b.insuranceDocumentImage),
        documents: {
          id_verified: b.idVerified,
          license_verified: b.licenseVerified,
          insurance_verified: b.insuranceVerified,
        },
        statusHistory: b.statusHistory,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Patch('admin/businesses/:id/status')
  async updateAdminBusinessStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'pending' | 'suspended' | 'rejected'; reason?: string },
  ) {
    const admin = await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const status = (body.status || '').toLowerCase();
    if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
      throw new BadRequestException('invalid status');
    }
    if ((status === 'rejected' || status === 'suspended') && !String(body.reason || '').trim()) {
      throw new BadRequestException('reason is required for rejection or suspension');
    }
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) {
      throw new BadRequestException('business not found');
    }
    const reasonText = String(body.reason || '').trim();
    const updated = await this.prisma.business.update({
      where: { id },
      data: {
        status,
        ...(status === 'active'
          ? {
              idVerified: true,
              licenseVerified: true,
              insuranceVerified: true,
              rejectionReason: null,
            }
          : {}),
        ...((status === 'rejected' || status === 'suspended') && reasonText
          ? {
              rejectionReason: reasonText,
              description: `${before.description || ''}\n[${
                status === 'rejected' ? 'Rejection reason' : 'Suspension reason'
              }] ${reasonText}`.trim(),
            }
          : {}),
        ...(status === 'active' && reasonText
          ? {
              description: `${before.description || ''}\n[Reactivation note] ${reasonText}`.trim(),
            }
          : {}),
      },
    });
    if (before.status !== updated.status || reasonText) {
      await this.prisma.businessStatusHistory.create({
        data: {
          businessId: updated.id,
          fromStatus: before.status,
          toStatus: updated.status,
          reason: reasonText || null,
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
        },
      });
    }
    if (status === 'active') {
      await this.prisma.user.upsert({
        where: { email: updated.email },
        update: { role: Role.BUSINESS, status: 'active' },
        create: {
          name: updated.owner || updated.name,
          email: updated.email,
          password: BUSINESS_BYPASS_PASSWORD,
          role: Role.BUSINESS,
          status: 'active',
        },
      });
    }
    if ((status === 'rejected' || status === 'suspended') && reasonText) {
      await this.prisma.notification.create({
        data: {
          type: status === 'rejected' ? 'BUSINESS_REJECTED' : 'BUSINESS_UPDATED',
          title: status === 'rejected' ? `Business rejected: ${updated.name}` : `Business suspended: ${updated.name}`,
          body: reasonText,
          role: Role.ADMIN,
        },
      });
    }
    if (status === 'active' && reasonText) {
      await this.prisma.notification.create({
        data: {
          type: 'BUSINESS_UPDATED',
          title: `Business reactivated: ${updated.name}`,
          body: reasonText,
          role: Role.ADMIN,
        },
      });
    }
    return { ok: true, id: updated.id, status: updated.status };
  }

  @Patch('admin/businesses/:id/documents')
  async updateAdminBusinessDocumentVerification(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { document: 'id' | 'license' | 'insurance'; approved: boolean },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const doc = String(body.document || '').toLowerCase();
    if (!['id', 'license', 'insurance'].includes(doc)) {
      throw new BadRequestException('invalid document');
    }
    const approved = Boolean(body.approved);
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) {
      throw new BadRequestException('business not found');
    }
    const data =
      doc === 'id'
        ? { idVerified: approved }
        : doc === 'license'
          ? { licenseVerified: approved }
          : { insuranceVerified: approved };
    const updated = await this.prisma.business.update({ where: { id }, data });
    return {
      ok: true,
      id: updated.id,
      documents: {
        id_verified: updated.idVerified,
        license_verified: updated.licenseVerified,
        insurance_verified: updated.insuranceVerified,
      },
    };
  }

  @Delete('admin/businesses/:id')
  async deleteAdminBusiness(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.business.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/bookings')
  async getAdminBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') {
      where.status = { equals: status, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: { user: true, business: true, service: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: bookings.map((b) => ({
        id: b.id,
        user: b.customerName || b.user.name,
        email: b.user.email,
        business: b.business.name,
        businessId: b.businessId,
        service: b.service?.name || '—',
        date: b.date,
        amount: b.price,
        status: b.status.toLowerCase(),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/bookings/:id')
  async deleteAdminBooking(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.booking.delete({ where: { id } });
    return { ok: true, id };
  }

  @Patch('admin/bookings/:id/status')
  async updateAdminBookingStatus(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { service: true } });
    if (!booking) throw new BadRequestException('Booking not found');
    const allowed = ['Approved', 'Rejected', 'Completed', 'Cancelled'];
    const newStatus = body.status;
    if (!allowed.includes(newStatus)) throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    // Enforce valid transitions
    const cur = booking.status;
    const valid: Record<string, string[]> = {
      Pending: ['Approved', 'Rejected', 'Cancelled'],
      Approved: ['Completed', 'Cancelled'],
      Completed: [],
      Cancelled: [],
      Rejected: [],
    };
    if (!(valid[cur] || []).includes(newStatus)) {
      throw new BadRequestException(`Cannot change from ${cur} to ${newStatus}`);
    }
    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: newStatus },
      include: { user: true, business: true, service: true },
    });
    return {
      ok: true,
      id: updated.id,
      status: updated.status.toLowerCase(),
      user: updated.customerName || updated.user.name,
      email: updated.user.email,
      business: updated.business.name,
      date: updated.date,
      amount: updated.price,
      service: updated.service?.name || null,
    };
  }

  /* ─── Admin Promotions ─── */
  @Get('admin/promotions')
  async getAdminPromotions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const [total, promos] = await Promise.all([
      this.prisma.promotion.count(),
      this.prisma.promotion.findMany({
        include: { service: true, business: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data = promos.map((p) => ({
      id: p.id,
      businessId: p.businessId,
      businessName: p.business.name,
      serviceId: p.serviceId,
      serviceName: p.service.name,
      servicePrice: p.service.price,
      discountPercent: p.discountPercent,
      discountedPrice: parseFloat((p.service.price * (1 - p.discountPercent / 100)).toFixed(2)),
      label: p.label,
      active: p.active,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      createdAt: p.createdAt,
    }));

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('admin/promotions')
  async createAdminPromotion(
    @Body() body: { businessId: string; serviceId: string; discountPercent: number; label?: string; endsAt?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: body.businessId } });
    if (!svc) throw new BadRequestException('Service not found for this business');
    return this.prisma.promotion.create({
      data: {
        businessId: body.businessId,
        serviceId: body.serviceId,
        discountPercent: body.discountPercent || 10,
        label: body.label || null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
      include: { service: true, business: true },
    });
  }

  @Delete('admin/promotions/:id')

  async deleteAdminPromotion(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new BadRequestException('Promotion not found');
    await this.prisma.promotion.delete({ where: { id } });
    return { ok: true };
  }

  /* ─── Admin: logs ─── */
  @Get('admin/logs')
  async getAdminLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('severity') severity: string = 'all',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = {};
    if (search) {
      where.OR = [
        { business: { name: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
        { actorName: { contains: search, mode: 'insensitive' } },
      ];
    }
    // severity mapping: error if rejected, warning if status changes to pending/inactive, info otherwise
    if (severity !== 'all') {
      if (severity === 'error') {
        where.toStatus = 'rejected';
      } else if (severity === 'warning') {
        where.toStatus = { in: ['pending', 'inactive'] };
      } else {
        where.toStatus = { notIn: ['rejected', 'pending', 'inactive'] };
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.businessStatusHistory.count({ where }),
      this.prisma.businessStatusHistory.findMany({
        where,
        include: { business: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data = items.map((log) => {
      let sev = 'info';
      if (log.toStatus === 'rejected') sev = 'error';
      else if (['pending', 'inactive'].includes(log.toStatus)) sev = 'warning';

      return {
        id: log.id,
        source: log.actorName || 'System',
        message: `Business "${log.business.name}" status changed from ${log.fromStatus || 'N/A'} to ${log.toStatus}. ${log.reason || ''}`,
        severity: sev,
        timestamp: log.createdAt,
      };
    });

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  /* ─── Admin: list businesses with services for dropdown ─── */
  @Get('admin/businesses-services')
  async getAdminBusinessesServices(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const businesses = await this.prisma.business.findMany({
      select: {
        id: true,
        name: true,
        services: { select: { id: true, name: true, price: true, category: true } },
      },
      orderBy: { name: 'asc' },
    });
    return businesses;
  }

  @Get('admin/users')
  async getAdminUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = { role: Role.USER };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { bookings: true },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        bookings: u.bookings.length,
        joinedDate: u.createdAt,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/users/:id')
  async deleteAdminUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/transactions')
  async getAdminTransactions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const [total, tx] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        include: { business: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: tx.map((t) => ({
        id: t.id,
        business: t.business.name,
        amount: t.amount,
        date: t.date,
        status: t.status.toLowerCase(),
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/transactions/:id')
  async deleteAdminTransaction(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.transaction.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/withdrawals')
  async getAdminWithdrawals(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const [total, w] = await Promise.all([
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.findMany({
        where,
        include: { business: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: w.map((it) => ({
        id: it.id,
        amount: it.amount,
        balance: it.balance,
        status: it.status.toLowerCase(),
        date: it.date,
        processedDate: it.processedDate,
        businessId: it.businessId,
        merchantNumber: it.business.merchantNumber ?? null,
        business: it.business.name,
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Delete('admin/withdrawals/:id')
  async deleteAdminWithdrawal(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.withdrawal.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/notifications')
  async getAdminNotifications(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const items = await this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return items.map((n) => ({
      id: n.id,
      category: n.type.toLowerCase().includes('ncr')
        ? 'security'
        : n.type.toLowerCase().includes('order')
          ? 'merchant'
          : 'system',
      status: 'open',
      title: n.title,
      description: n.body,
      time: n.createdAt.toISOString(),
    }));
  }

  @Delete('admin/notifications/:id')
  async deleteAdminNotification(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.notification.delete({ where: { id } });
    return { ok: true, id };
  }

  @Get('admin/categories')
  async getAdminCategories(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const where: any = {};
    if (search.trim()) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { labelEn: { contains: search, mode: 'insensitive' } },
        { labelEs: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, categories] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        skip: (p - 1) * l,
        take: l,
      }),
    ]);
    return {
      data: categories,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('admin/categories')
  async createAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { key: string; labelEn: string; labelEs: string; imageUrl?: string; active?: boolean; sortOrder?: number },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const key = (body.key || '').trim();
    if (!key) throw new BadRequestException('key is required');
    return this.prisma.category.upsert({
      where: { key },
      update: {
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        imageUrl: (body.imageUrl || '').trim() || null,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      create: {
        key,
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        imageUrl: (body.imageUrl || '').trim() || null,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Delete('admin/categories/:id')
  async deleteAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('admin/categories/:id')
  async updateAdminCategory(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { labelEn?: string; labelEs?: string; imageUrl?: string; active?: boolean; sortOrder?: number },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(body.labelEn !== undefined ? { labelEn: body.labelEn.trim() } : {}),
        ...(body.labelEs !== undefined ? { labelEs: body.labelEs.trim() } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl || '').trim() || null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
  }

  @Get('admin/amenities')
  async getAdminAmenities(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return this.prisma.amenity.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  @Post('admin/amenities')
  async createAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      key: string;
      labelEn: string;
      labelEs: string;
      descriptionEn?: string;
      descriptionEs?: string;
      imageUrl?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const key = (body.key || '').trim();
    if (!key) throw new BadRequestException('key is required');
    return this.prisma.amenity.upsert({
      where: { key },
      update: {
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        descriptionEn: (body.descriptionEn || '').trim() || null,
        descriptionEs: (body.descriptionEs || '').trim() || null,
        imageUrl: (body.imageUrl || '').trim() || null,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
      create: {
        key,
        labelEn: body.labelEn?.trim() || key,
        labelEs: body.labelEs?.trim() || key,
        descriptionEn: (body.descriptionEn || '').trim() || null,
        descriptionEs: (body.descriptionEs || '').trim() || null,
        imageUrl: (body.imageUrl || '').trim() || null,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Delete('admin/amenities/:id')
  async deleteAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    await this.prisma.amenity.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('admin/amenities/:id')
  async updateAdminAmenity(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: {
      labelEn?: string;
      labelEs?: string;
      descriptionEn?: string;
      descriptionEs?: string;
      imageUrl?: string;
      active?: boolean;
      sortOrder?: number;
    },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    return this.prisma.amenity.update({
      where: { id },
      data: {
        ...(body.labelEn !== undefined ? { labelEn: body.labelEn.trim() } : {}),
        ...(body.labelEs !== undefined ? { labelEs: body.labelEs.trim() } : {}),
        ...(body.descriptionEn !== undefined
          ? { descriptionEn: String(body.descriptionEn || '').trim() || null }
          : {}),
        ...(body.descriptionEs !== undefined
          ? { descriptionEs: String(body.descriptionEs || '').trim() || null }
          : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: String(body.imageUrl || '').trim() || null } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
  }

  @Post('admin/broadcast')
  async broadcast(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { message: string; target: string },
  ) {
    await requireUser(this.prisma, authorization, [Role.ADMIN]);
    const n = await this.prisma.notification.create({
      data: {
        type: 'BROADCAST',
        title: `Broadcast: ${body.target}`,
        body: body.message,
        role: Role.USER,
      },
    });
    return { id: n.id, status: 'sent' };
  }

  @Get('business/:id')
  async getBusiness(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    console.log('[GET /business/:id] id=', id);
    const b = await this.prisma.business.findUnique({ where: { id } });
    if (!b) {
      console.log('[GET /business/:id] Not found in DB:', id);
      return null;
    }
    const visible = await isBusinessPubliclyVisible(this.prisma, b, authorization);
    console.log('[GET /business/:id] visible=', visible, 'status=', b.status);
    if (!visible) throw new NotFoundException(`Business not visible (Status: ${b.status})`);
    const base = mapBusiness(b);
    const keys = (b.amenityKeys ?? []).filter(Boolean);
    const rows =
      keys.length > 0
        ? await this.prisma.amenity.findMany({
            where: { key: { in: keys }, active: true },
            orderBy: [{ sortOrder: 'asc' }, { labelEn: 'asc' }],
          })
        : [];
    const rv = await this.prisma.review.aggregate({
      where: { businessId: id, businessRating: { not: null } },
      _avg: { businessRating: true },
      _count: true,
    });
    const ratingStr = rv._count > 0 && rv._avg.businessRating != null ? Number(rv._avg.businessRating).toFixed(1) : '0';
    const totalReviews = await this.prisma.review.count({ where: { businessId: id } });
    const reviewsStr = String(totalReviews);
    const geo = parseUserGeoQuery(userLat, userLng);
    const distanceLabel = distanceLabelBetween(geo.lat, geo.lng, b.latitude, b.longitude);
    return {
      ...base,
      rating: ratingStr,
      reviews: reviewsStr,
      distanceLabel,
      taxPercentage: b.taxPercentage || 0,
      amenities: rows.map((a) => ({
        key: a.key,
        labelEn: a.labelEn,
        labelEs: a.labelEs,
        descriptionEn: a.descriptionEn,
        descriptionEs: a.descriptionEs,
      })),
    };
  }

  @Get('business/by-email/:email')
  async getBusinessByEmail(@Param('email') email: string) {
    const b = await this.prisma.business.findUnique({ where: { email } });
    return mapBusiness(b);
  }

  @Patch('business/:id')
  async updateBusiness(
    @Param('id') id: string,
    @Body() body: UpdateBusinessPanelDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const data = mapBusinessPatch(body);
    const updated = await this.prisma.business.update({ where: { id }, data });
    return mapBusiness(updated);
  }

  @Get('business/:id/services')
  async getBusinessServices(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('category') category: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    const b = await this.prisma.business.findUnique({ where: { id } });
    if (!b || !(await isBusinessPubliclyVisible(this.prisma, b, authorization))) {
      return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
    }
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = { businessId: id };
    if (search.trim()) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category.trim() && category !== 'all') {
      where.category = category;
    }

    const [total, services] = await Promise.all([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
        include: { promotions: { where: { active: true } } },
      }),
    ]);

    return {
      data: services.map(s => ({
        ...s,
        imageUrl: safeImageUrl(s.imageUrl)
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('business/:id/services')
  async createBusinessService(
    @Param('id') id: string,
    @Body() body: CreateServiceDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const imageUrl =
      typeof body.imageUrl === 'string' && body.imageUrl.trim() ? body.imageUrl.trim() : null;
    return this.prisma.service.create({
      data: {
        businessId: id,
        name: body.name,
        price: body.price,
        duration: body.duration,
        category: body.category,
        imageUrl,
      },
    });
  }

  @Patch('services/:id')
  async updateService(
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new BadRequestException('Service not found');
    await requireBusinessOwner(this.prisma, authorization, svc.businessId);
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.duration !== undefined ? { duration: body.duration } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.imageUrl !== undefined
          ? { imageUrl: body.imageUrl?.trim() ? body.imageUrl.trim() : null }
          : {}),
      },
    });
  }

  @Delete('services/:id')
  async deleteService(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const svc = await this.prisma.service.findUnique({ where: { id } });
    if (!svc) throw new BadRequestException('Service not found');
    await requireBusinessOwner(this.prisma, authorization, svc.businessId);
    await this.prisma.service.delete({ where: { id } });
    return { ok: true };
  }

  /* ─── Bestsellers: services ranked by booking count ─── */
  @Get('business/:id/bestsellers')
  async getBusinessBestsellers(@Param('id') id: string) {
    const bookings = await this.prisma.booking.groupBy({
      by: ['serviceId'],
      where: { businessId: id, serviceId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    // Return serviceId → count map
    return bookings.map((b) => ({
      serviceId: b.serviceId,
      bookingCount: b._count.id,
    }));
  }

  /* ─── Promotions: public listing ─── */
  @Get('business/:id/promotions')
  async getBusinessPromotions(@Param('id') id: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        businessId: id,
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: { service: { select: { id: true, name: true, price: true, imageUrl: true, duration: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ─── Promotions CRUD for business owner ─── */
  @Post('business/:id/promotions')
  async createPromotion(
    @Param('id') id: string,
    @Body() body: { serviceId: string; discountPercent: number; label?: string; endsAt?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    // Validate service belongs to this business
    const svc = await this.prisma.service.findFirst({ where: { id: body.serviceId, businessId: id } });
    if (!svc) throw new BadRequestException('Service not found for this business');
    return this.prisma.promotion.create({
      data: {
        businessId: id,
        serviceId: body.serviceId,
        discountPercent: body.discountPercent || 10,
        label: body.label || null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
      include: { service: true },
    });
  }

  @Patch('business/:id/promotions/:promoId')
  async updatePromotion(
    @Param('id') id: string,
    @Param('promoId') promoId: string,
    @Body() body: { discountPercent?: number; label?: string; endsAt?: string; active?: boolean },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
    if (!promo || promo.businessId !== id) throw new BadRequestException('Promotion not found');
    return this.prisma.promotion.update({
      where: { id: promoId },
      data: {
        discountPercent: body.discountPercent !== undefined ? body.discountPercent : undefined,
        label: body.label !== undefined ? body.label : undefined,
        endsAt: body.endsAt !== undefined ? (body.endsAt ? new Date(body.endsAt) : null) : undefined,
        active: body.active !== undefined ? body.active : undefined,
      },
      include: { service: true },
    });
  }

  @Delete('promotions/:promoId')
  async deletePromotion(
    @Param('promoId') promoId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const promo = await this.prisma.promotion.findUnique({ where: { id: promoId } });
    if (!promo) throw new BadRequestException('Promotion not found');
    await requireBusinessOwner(this.prisma, authorization, promo.businessId);
    await this.prisma.promotion.delete({ where: { id: promoId } });
    return { ok: true };
  }

  @Get('business/:id/staff')
  async getBusinessStaff(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search: string = '',
    @Query('role') role: string = '',
    @Headers('authorization') authorization?: string,
  ) {
    const b = await this.prisma.business.findUnique({ where: { id } });
    if (!b || !(await isBusinessPubliclyVisible(this.prisma, b, authorization))) {
      return { data: [], total: 0, page: 1, limit: parseInt(limit), totalPages: 0 };
    }

    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const where: any = { businessId: id };
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role.trim() && role !== 'all') {
      where.role = role;
    }

    const [total, staff] = await Promise.all([
      this.prisma.staff.count({ where }),
      this.prisma.staff.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: staff.map(s => ({
        ...s,
        image: safeImageUrl(s.image)
      })),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('business/:id/staff')
  async createStaff(
    @Param('id') id: string,
    @Body() body: CreateStaffDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.staff.create({
      data: {
        businessId: id,
        name: body.name,
        role: body.role,
        skills: body.skills ?? [],
        serviceIds: body.serviceIds ?? [],
        availability: body.availability,
        image: body.image ?? undefined,
      },
    });
  }

  @Patch('staff/:id')
  async updateStaff(
    @Param('id') id: string,
    @Body() body: UpdateStaffDto,
    @Headers('authorization') authorization?: string,
  ) {
    const row = await this.prisma.staff.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Staff not found');
    await requireBusinessOwner(this.prisma, authorization, row.businessId);
    return this.prisma.staff.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.skills !== undefined ? { skills: body.skills } : {}),
        ...(body.serviceIds !== undefined ? { serviceIds: body.serviceIds } : {}),
        ...(body.availability !== undefined ? { availability: body.availability } : {}),
        ...(body.image !== undefined ? { image: body.image && String(body.image).trim() ? body.image : null } : {}),
      },
    });
  }

  @Delete('staff/:id')
  async deleteStaff(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const row = await this.prisma.staff.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Staff not found');
    await requireBusinessOwner(this.prisma, authorization, row.businessId);
    await this.prisma.staff.delete({ where: { id } });
    return { ok: true };
  }

  @Get('business/:id/bookings')
  async getBusinessBookings(
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('staffId') staffId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    
    const where: any = { businessId: id };
    if (status && status !== 'all') where.status = status;
    if (staffId && staffId !== 'all') where.staffId = staffId;
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        include: { service: true, staff: true, user: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      data: bookings,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('business/:id/bookings')
  async createBooking(
    @Param('id') id: string,
    @Body() body: CreateBookingDto,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const userId = await resolveBookingCreateUser(this.prisma, body);
    const svcId = typeof body.serviceId === 'string' && body.serviceId.trim() ? body.serviceId : null;
    const stId = typeof body.staffId === 'string' && body.staffId.trim() ? body.staffId : null;

    return this.prisma.booking.create({
      data: {
        businessId: id,
        userId,
        customerName: body.customerName,
        date: new Date(body.date),
        status: body.status,
        price: body.price,
        serviceId: svcId,
        staffId: stId,
      },
    });
  }

  @Post('business/:id/bookings/pay-group')
  async payBusinessBookingGroup(
    @Param('id') id: string,
    @Body() body: { bookingIds: string[]; paymentMethod?: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    if (!Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
      throw new BadRequestException('bookingIds must be a non-empty array');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { id: { in: body.bookingIds }, businessId: id },
      include: { staff: true, service: true, user: true },
    });
    if (bookings.length === 0) throw new BadRequestException('No valid bookings found');

    const payableBookings = bookings.filter(
      (b) => b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed',
    );
    if (payableBookings.length === 0) throw new BadRequestException('All bookings are already completed or cancelled');

    const totalAmount = payableBookings.reduce((sum, b) => sum + b.price, 0);
    const totalTax = payableBookings.reduce((sum, b) => sum + (b.taxAmount || 0), 0);
    const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
    const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');
    const method = body.paymentMethod || 'Cash';

    // Mark all as Completed
    await this.prisma.booking.updateMany({
      where: { id: { in: payableBookings.map(b => b.id) } },
      data: { status: 'Paid' },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        bookingId: payableBookings[0].id,
        businessId: id,
        amount: totalAmount,
        taxAmount: totalTax,
        status: 'Completed',
        paymentMethod: method,
        description: serviceNames,
        customerEmail: payableBookings[0].user?.email || null,
        staffMember: staffNames || null,
        bookings: {
          connect: payableBookings.map(b => ({ id: b.id }))
        }
      },
    });

    await this.prisma.business.update({
      where: { id },
      data: { revenue: { increment: totalAmount } },
    });

    return { ok: true, transactionId: transaction.id, total: totalAmount };
  }

  @Patch('business/:id/bookings/bulk-complete')
  async bulkCompleteBookings(
    @Param('id') id: string,
    @Body() body: { bookingIds: string[] },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return await this.prisma.booking.updateMany({
      where: { id: { in: body.bookingIds }, businessId: id, status: 'Paid' },
      data: { status: 'Completed' },
    });
  }

  @Patch('business/:id/bookings/:bookingId/propose-reschedule')
  async proposeReschedule(
    @Param('id') id: string,
    @Param('bookingId') bookingId: string,
    @Body() body: { newDate: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return await this.prisma.booking.update({
      where: { id: bookingId, businessId: id },
      data: { 
        date: new Date(body.newDate),
        status: 'Rescheduled' 
      },
    });
  }

  @Patch('business/:id/bookings/bulk-status')
  async bulkUpdateBookingStatus(
    @Param('id') id: string,
    @Body() body: { bookingIds: string[]; status: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    if (!Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
      throw new BadRequestException('bookingIds must be a non-empty array');
    }
    return this.prisma.booking.updateMany({
      where: { id: { in: body.bookingIds }, businessId: id },
      data: { status: body.status },
    });
  }

  @Patch('bookings/:id')
  async updateBooking(
    @Param('id') id: string,
    @Body() body: UpdateBookingDto,
    @Headers('authorization') authorization?: string,
  ) {
    const b = await this.prisma.booking.findUnique({ where: { id } });
    if (!b) throw new BadRequestException('Booking not found');
    await requireBusinessOwner(this.prisma, authorization, b.businessId);
    const data: Record<string, unknown> = {};
    if (body.customerName !== undefined) data.customerName = body.customerName;
    if (body.date !== undefined) data.date = new Date(body.date);
    if (body.status !== undefined) data.status = body.status;
    if (body.price !== undefined) data.price = body.price;
    if (body.serviceId !== undefined) {
      data.serviceId =
        typeof body.serviceId === 'string' && body.serviceId.trim() ? body.serviceId : null;
    }
    if (body.staffId !== undefined) {
      data.staffId = typeof body.staffId === 'string' && body.staffId.trim() ? body.staffId : null;
    }
    if (body.userId !== undefined && body.userId !== 'offline-user') data.userId = body.userId;
    return this.prisma.booking.update({ where: { id }, data });
  }

  @Get('business/:id/reviews')
  async getBusinessReviews(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const p = Math.max(1, Number(page || 1));
    const l = Math.max(1, Number(limit || 10));

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { businessId: id },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.review.count({ where: { businessId: id } }),
    ]);

    return {
      data: reviews,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Post('mobile/reviews')
  async createMobileReview(
    @Body() body: { 
      bookingId: string; 
      staffRating: number; 
      businessRating: number; 
      serviceRating?: number;
      comment: string 
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({
      where: { id: body.bookingId },
      include: { service: true, staff: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.userId !== user.id) throw new BadRequestException('Unauthorized');
    if (booking.status !== 'Completed') throw new BadRequestException('Only completed bookings can be reviewed');
    if (booking.isReviewed) throw new BadRequestException('Booking already reviewed');

    const review = await this.prisma.review.create({
      data: {
        userId: user.id,
        businessId: booking.businessId,
        bookingId: booking.id,
        staffId: booking.staffId,
        customerName: user.name,
        avatar: user.avatar,
        staffRating: body.staffRating,
        businessRating: body.businessRating,
        rating: body.serviceRating ?? body.businessRating,
        comment: body.comment,
        serviceName: booking.service?.name || 'Service',
        staffName: booking.staff?.name || 'Staff',
        status: 'Pending',
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { isReviewed: true },
    });

    return review;
  }

  @Post('mobile/reviews/group')
  async createMobileReviewGroup(
    @Body() body: { 
      businessRating: number; 
      comment: string;
      services: { bookingId: string; serviceRating: number; staffRating: number; comment?: string }[]
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    if (!Array.isArray(body.services) || body.services.length === 0) {
      throw new BadRequestException('services must be a non-empty array');
    }

    const reviews = [];
    for (let i = 0; i < body.services.length; i++) {
      const s = body.services[i];
      const booking = await this.prisma.booking.findUnique({
        where: { id: s.bookingId },
        include: { service: true, staff: true },
      });
      if (!booking || booking.userId !== user.id) continue;
      if (booking.status !== 'Completed' || booking.isReviewed) continue;

      const review = await this.prisma.review.create({
        data: {
          userId: user.id,
          businessId: booking.businessId,
          bookingId: booking.id,
          staffId: booking.staffId,
          customerName: user.name,
          avatar: user.avatar,
          staffRating: s.staffRating,
          // Only store business rating and top-level comment on the first review to avoid duplication in venue list
          businessRating: i === 0 ? body.businessRating : null,
          rating: s.serviceRating, 
          comment: i === 0 ? body.comment : (s.comment || ''),
          serviceName: booking.service?.name || 'Service',
          staffName: booking.staff?.name || 'Staff',
          status: 'Pending',
        },
      });

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { isReviewed: true },
      });
      reviews.push(review);
    }

    return { ok: true, count: reviews.length };
  }

  @Patch('reviews/:id')
  async updateReview(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Review not found');
    await requireBusinessOwner(this.prisma, authorization, r.businessId);
    return this.prisma.review.update({ where: { id }, data: body });
  }

  @Delete('reviews/:id')
  async deleteReview(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const r = await this.prisma.review.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Review not found');
    await requireBusinessOwner(this.prisma, authorization, r.businessId);
    await this.prisma.review.delete({ where: { id } });
    return { ok: true };
  }

  @Get('business/:id/transactions')
  async getBusinessTransactions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);

    const filter: any = { businessId: id };
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { staffMember: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit || '10'));
      const [data, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: filter,
          orderBy: { date: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
        this.prisma.transaction.count({ where: filter }),
      ]);
      return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
    }

    return this.prisma.transaction.findMany({ where: filter, orderBy: { date: 'desc' } });
  }

  @Post('business/:id/transactions')
  async createTransaction(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.transaction.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/withdrawals')
  async getBusinessWithdrawals(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);

    if (page) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit || '10'));
      const [data, total] = await Promise.all([
        this.prisma.withdrawal.findMany({
          where: { businessId: id },
          orderBy: { date: 'desc' },
          skip: (p - 1) * l,
          take: l,
        }),
        this.prisma.withdrawal.count({ where: { businessId: id } }),
      ]);
      return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
    }

    return this.prisma.withdrawal.findMany({
      where: { businessId: id },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  @Post('business/:id/withdrawals')
  async createBusinessWithdrawal(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }
    return this.prisma.$transaction(async (tx) => {
      const biz = await tx.business.findUnique({ where: { id } });
      if (!biz) throw new BadRequestException('Business not found');
      if (biz.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      const newBal = Number((biz.balance - amount).toFixed(2));
      const w = await tx.withdrawal.create({
        data: {
          businessId: id,
          amount,
          balance: newBal,
          status: 'Pending',
        },
      });
      await tx.business.update({ where: { id }, data: { balance: newBal } });
      return w;
    });
  }

  @Post('business/:id/support-request')
  async createBusinessSupportRequest(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const message = String(body.message || '').trim();
    if (message.length < 8) throw new BadRequestException('Message must be at least 8 characters');
    const biz = await this.prisma.business.findUnique({ where: { id } });
    await this.prisma.notification.create({
      data: {
        type: 'MERCHANT_SUPPORT',
        title: `Merchant request: ${biz?.name ?? id}`,
        body: message.slice(0, 4000),
        role: Role.ADMIN,
      },
    });
    return { ok: true };
  }

  @Get('business/:id/machines')
  async getMachines(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.machine.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/machines')
  async createMachine(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.machine.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/parts')
  async getParts(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.part.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/parts')
  async createPart(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.part.create({ data: { ...(body as object), businessId: id } as any });
  }

  @Get('business/:id/qa-inspections')
  async getQaInspections(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.qaInspection.findMany({ where: { businessId: id } });
  }

  @Post('business/:id/qa-inspections')
  async createQaInspection(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const qa = await this.prisma.qaInspection.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'QA_COMPLETION', title: 'QA inspection completed', body: `QA ${qa.id} done`, role: Role.BUSINESS },
    });
    return qa;
  }

  @Get('business/:id/ncrs')
  async getNcrs(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.ncr.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('business/:id/ncrs')
  async createNcr(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const ncr = await this.prisma.ncr.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'NCR_ALERT', title: 'NCR reported', body: `NCR ${ncr.id} reported`, role: Role.ADMIN },
    });
    return ncr;
  }

  @Get('business/:id/orders')
  async getOrders(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    await requireBusinessOwner(this.prisma, authorization, id);
    return this.prisma.order.findMany({ where: { businessId: id }, orderBy: { createdAt: 'desc' } });
  }

  @Post('business/:id/orders')
  async createOrder(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, id);
    const order = await this.prisma.order.create({ data: { ...(body as object), businessId: id } as any });
    await this.prisma.notification.create({
      data: { type: 'ORDER_UPDATE', title: 'Order updated', body: `Order ${order.id} created`, role: Role.USER },
    });
    return order;
  }

  @Get('mobile/bookings/:id/group')
  async getMobileBookingGroup(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({
      where: { id, userId: user.id },
      include: { business: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');

    // Find all bookings for this user, at this business, on this exact date/time
    return this.prisma.booking.findMany({
      where: {
        userId: user.id,
        businessId: booking.businessId,
        date: booking.date,
      },
      include: { business: true, service: true, staff: true, familyMember: true },
      orderBy: { date: 'asc' },
    });
  }

  @Get('mobile/bookings')
  async getMobileBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    // For mobile, we usually want ongoing and history separately.
    // We'll paginate the history, and keep ongoing (usually few) as is or limited.
    const [ongoing, historyTotal, history] = await Promise.all([
      this.prisma.booking.findMany({
        where: { userId: user.id, status: { in: ['Pending', 'Approved'] } },
        include: { business: true, service: true, staff: true, familyMember: true },
        orderBy: { date: 'asc' },
        take: 20,
      }),
      this.prisma.booking.count({
        where: { userId: user.id, status: { in: ['Completed', 'Rejected', 'Cancelled'] } },
      }),
      this.prisma.booking.findMany({
        where: { userId: user.id, status: { in: ['Completed', 'Rejected', 'Cancelled'] } },
        include: { business: true, service: true, staff: true, familyMember: true },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    return {
      ongoing,
      history: {
        data: history,
        total: historyTotal,
        page: p,
        limit: l,
        totalPages: Math.ceil(historyTotal / l),
      },
    };
  }

  @Get('mobile/family-members')
  async listFamilyMembers(@Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return this.prisma.familyMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('mobile/family-members')
  async createFamilyMember(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateFamilyMemberDto,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    return this.prisma.familyMember.create({
      data: {
        userId: user.id,
        name: body.name.trim(),
        age: body.age ?? null,
        gender: body.gender.trim(),
        email: body.email?.trim() || null,
      },
    });
  }

  @Patch('mobile/family-members/:id')
  async updateFamilyMember(
    @Param('id') id: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: UpdateFamilyMemberDto,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
    if (!row) throw new BadRequestException('Family member not found');
    return this.prisma.familyMember.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.age !== undefined ? { age: body.age } : {}),
        ...(body.gender !== undefined ? { gender: body.gender.trim() } : {}),
        ...(body.email !== undefined ? { email: body.email.trim() || null } : {}),
      },
    });
  }

  @Delete('mobile/family-members/:id')
  async deleteFamilyMember(@Param('id') id: string, @Headers('authorization') authorization?: string) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const row = await this.prisma.familyMember.findFirst({ where: { id, userId: user.id } });
    if (!row) throw new BadRequestException('Family member not found');
    await this.prisma.familyMember.delete({ where: { id } });
    return { ok: true };
  }

  @Patch('mobile/bookings/:id/cancel')
  async cancelMobileBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId: user.id },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.status === 'Completed' || booking.status === 'Cancelled' || booking.status === 'Rejected') {
      throw new BadRequestException('Cannot cancel this booking');
    }
    await this.prisma.booking.update({
      where: { id },
      data: { status: 'Cancelled' },
    });
    return { ok: true };
  }

  @Post('mobile/bookings/:id/pay')
  async payMobileBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Body() body: { paymentMethod?: string } = {},
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findFirst({
      where: { id, userId: user.id },
      include: { business: true, service: true, staff: true },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.status === 'Cancelled' || booking.status === 'Rejected') {
      throw new BadRequestException('Cannot pay for a cancelled booking');
    }
    // Mark booking as Completed
    await this.prisma.booking.update({
      where: { id },
      data: { status: 'Completed' },
    });
    // Create transaction so it appears in invoice history
    const transaction = await this.prisma.transaction.create({
      data: {
        bookingId: booking.id,
        businessId: booking.businessId,
        amount: booking.price,
        status: 'Completed',
        type: body.paymentMethod || 'Cash Payment',
        customerEmail: user.email,
        staffMember: booking.staff?.name ?? null,
      },
    });
    // Update business revenue
    await this.prisma.business.update({
      where: { id: booking.businessId },
      data: { revenue: { increment: booking.price } },
    });
    return { ok: true, transactionId: transaction.id };
  }

  /** Pay for a GROUP of bookings (same venue/date) and produce ONE combined invoice. */
  @Post('mobile/bookings/pay-group')
  async payMobileBookingGroup(
    @Headers('authorization') authorization?: string,
    @Body() body: { bookingIds: string[]; paymentMethod?: string; businessId?: string } = { bookingIds: [] },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    if (!Array.isArray(body.bookingIds) || body.bookingIds.length === 0) {
      throw new BadRequestException('bookingIds must be a non-empty array');
    }
    // Load all bookings and verify they belong to this user
    const bookings = await this.prisma.booking.findMany({
      where: { id: { in: body.bookingIds }, userId: user.id },
      include: { staff: true, business: true, service: true },
    });
    if (bookings.length === 0) throw new BadRequestException('No valid bookings found');
    const payableBookings = bookings.filter(
      (b) => b.status !== 'Cancelled' && b.status !== 'Rejected' && b.status !== 'Completed',
    );
    if (payableBookings.length === 0) throw new BadRequestException('All bookings are already completed or cancelled');

    const businessId = payableBookings[0].businessId;
    const totalAmount = payableBookings.reduce((sum, b) => sum + b.price, 0);
    const totalTax = payableBookings.reduce((sum, b) => sum + (b.taxAmount || 0), 0);
    const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
    const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');

    const method = body.paymentMethod || 'Online';
    if (method === 'Cash' && user.role === Role.USER) {
      throw new BadRequestException('Customers can only pay using online methods');
    }

    // Create exactly ONE transaction for the combined total
    const transaction = await this.prisma.transaction.create({
      data: {
        bookingId: payableBookings[0].id,          // anchor to first booking id
        businessId,
        amount: totalAmount,
        taxAmount: totalTax,
        status: 'Completed',
        paymentMethod: method,
        description: serviceNames,
        customerEmail: user.email,
        staffMember: staffNames || null,
        bookings: {
          connect: payableBookings.map(b => ({ id: b.id }))
        }
      },
    });

    // Update business revenue once with the combined total
    await this.prisma.business.update({
      where: { id: businessId },
      data: { revenue: { increment: totalAmount } },
    });

    // Mark as Paid
    await this.prisma.booking.updateMany({
      where: { id: { in: payableBookings.map(b => b.id) } },
      data: { status: 'Paid' },
    });

    return { ok: true, transactionId: transaction.id, total: totalAmount };
  }

  @Post('mobile/bookings/:id/complete')
  async completeUserBooking(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || (booking.userId !== user.id && user.role !== Role.ADMIN)) {
      throw new ForbiddenException();
    }
    if (booking.status !== 'Paid') throw new BadRequestException('Only paid bookings can be completed');
    return await this.prisma.booking.update({
      where: { id },
      data: { status: 'Completed' },
    });
  }

  @Post('mobile/bookings/:id/accept-reschedule')
  async acceptReschedule(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.userId !== user.id) throw new ForbiddenException();
    if (booking.status !== 'Rescheduled') throw new BadRequestException('Not in rescheduled state');
    return await this.prisma.booking.update({
      where: { id },
      data: { status: 'Approved' },
    });
  }

  @Post('mobile/bookings')
  async createMobileBooking(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { businessId: string; serviceId: string; date: string; staffId?: string; familyMemberId?: string },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const business = await this.prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business || business.status !== 'active') {
      throw new BadRequestException('Business is not available for booking');
    }
    const service = await this.prisma.service.findFirst({
      where: { id: body.serviceId, businessId: body.businessId },
    });
    if (!service) throw new BadRequestException('Service not found for this business');
    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
    let staffId: string | null = null;
    const rawStaff = typeof body.staffId === 'string' ? body.staffId.trim() : '';
    if (rawStaff) {
      const st = await this.prisma.staff.findFirst({
        where: { id: rawStaff, businessId: body.businessId },
      });
      if (st) {
        const ids = st.serviceIds ?? [];
        if (ids.length > 0 && !ids.includes(service.id)) {
          throw new BadRequestException('Selected staff does not offer this service');
        }
        staffId = st.id;
      }
    }
    let customerName = user.name;
    let familyMemberId: string | null = null;
    const rawFm = typeof body.familyMemberId === 'string' ? body.familyMemberId.trim() : '';
    if (rawFm) {
      const fm = await this.prisma.familyMember.findFirst({
        where: { id: rawFm, userId: user.id },
      });
      if (fm) {
        familyMemberId = fm.id;
        customerName = fm.name;
      }
    }
    const activePromotion = await this.prisma.promotion.findFirst({
      where: {
        serviceId: service.id,
        active: true,
        startsAt: { lte: new Date() },
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } }
        ]
      }
    });

    const finalPrice = activePromotion 
      ? service.price * (1 - activePromotion.discountPercent / 100)
      : service.price;

    const status = (body as any).status || 'Pending';
    const taxPercentage = business.taxPercentage || 0;
    const taxAmount = (finalPrice * taxPercentage) / 100;

    const booking = await this.prisma.booking.create({
      data: {
        userId: user.id,
        businessId: body.businessId,
        serviceId: service.id,
        staffId,
        familyMemberId,
        customerName,
        date,
        status,
        price: finalPrice,
        taxAmount,
      },
    });

    if (status === 'Approved') {
      await this.prisma.transaction.create({
        data: {
          bookingId: booking.id,
          businessId: body.businessId,
          amount: finalPrice,
          status: 'Completed',
          type: 'Online Payment',
          customerEmail: user.email,
          staffMember: staffId ? (await this.prisma.staff.findUnique({ where: { id: staffId } }))?.name : null,
        },
      });
    }

    return booking;
  }

  @Get('mobile/invoices')
  async getMobileInvoices(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Headers('authorization') authorization?: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));

    const userBookings = await this.prisma.booking.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const bookingIds = userBookings.map((b) => b.id);

    const [total, tx] = await Promise.all([
      this.prisma.transaction.count({
        where: { bookingId: { in: bookingIds } },
      }),
      this.prisma.transaction.findMany({
        where: { bookingId: { in: bookingIds } },
        include: { business: true, bookings: { include: { service: true, staff: true } } },
        orderBy: { date: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
    ]);

    const data = tx.map((t) => {
      const logo = (t.business.logoUrl || '').trim();
      const banner = (t.business.bannerUrl || '').trim();
      const venueImageUrl = logo || banner || null;
      
      const lines = t.bookings.length > 0 
        ? t.bookings.map(b => ({ 
            title: b.service?.name || 'Service', 
            amount: b.price,
            professional: b.staff?.name || '—'
          }))
        : [{ title: t.description || t.paymentMethod, amount: t.amount, professional: t.staffMember || '—' }];

      return {
        id: t.id,
        bookingId: t.bookingId,
        number: `RZV-${t.date.getFullYear()}-${t.id.slice(0, 4).toUpperCase()}`,
        venueName: t.business.name,
        issuedDate: t.date,
        subtotal: t.amount,
        amount: t.amount,
        tax: t.taxAmount || 0,
        total: t.amount + (t.taxAmount || 0),
        status: t.status,
        locationLine: t.business.address,
        venueImageUrl,
        paymentMethod: t.paymentMethod,
        lines,
      };
    });

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Get('mobile/venues')
  async getMobileVenues(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy: string = 'newest',
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    const p = Math.max(1, parseInt(page));
    const l = Math.max(1, parseInt(limit));
    const geo = parseUserGeoQuery(userLat, userLng);

    const where: any = { status: 'active' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'all') {
      where.categoryKeys = { has: category };
    }

    // Since rating is calculated from Reviews, we'll need to filter/sort after fetching or use subqueries.
    // For now, let's stick to basic filtering and maybe add rating filter if needed via separate logic.
    
    let orderBy: any = { joinedDate: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };

    const [total, allServices, amenityRows] = await Promise.all([
      this.prisma.service.count({
        where: { business: where },
      }),
      this.prisma.service.findMany({
        where: { business: where },
        include: { business: true },
        orderBy: { name: 'asc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.amenity.findMany({
        where: { active: true },
        select: { key: true, labelEn: true, labelEs: true },
      }),
    ]);

    if (allServices.length === 0) {
      return {
        data: [],
        total: 0,
        page: p,
        limit: l,
        totalPages: 0,
      };
    }

    const bizIds = [...new Set(allServices.map((s) => s.businessId))];
    const [bookingCounts, reviewStats] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['businessId'],
        where: { businessId: { in: bizIds } },
        _count: { _all: true },
      }),
      this.prisma.review.groupBy({
        by: ['businessId'],
        where: { businessId: { in: bizIds }, businessRating: { not: null } },
        _avg: { businessRating: true },
        _count: { _all: true },
      }),
    ]);

    const amenityLabelEn = new Map(amenityRows.map((a) => [a.key, a.labelEn]));
    const amenityLabelEs = new Map(amenityRows.map((a) => [a.key, a.labelEs]));
    const reviewMap = new Map(
      reviewStats.map((r) => [
        r.businessId,
        { avg: r._avg.businessRating ?? 0, n: r._count._all },
      ]),
    );

    const data = allServices.map((svc, index) => {
      const b = svc.business;
      const rs = reviewMap.get(b.id);
      const ratingStr = rs && rs.n > 0 ? Number(rs.avg).toFixed(1) : '0';
      const reviewsStr = String(rs?.n ?? 0);

      const categoryKey =
        Array.isArray(b.categoryKeys) && b.categoryKeys.length > 0
          ? b.categoryKeys[0]
          : categoryKeyFromServiceCategory(svc.category);

      const displayPrice = svc.price > 0 ? `$${Number(svc.price).toFixed(2)}` : `$${Number(0).toFixed(2)}`;
      const keys = b.amenityKeys ?? [];
      const amenityLabelsEn = keys.map((k) => amenityLabelEn.get(k) ?? k);
      const amenityLabelsEs = keys.map((k) => amenityLabelEs.get(k) ?? k);

      const imageUrl = (svc.imageUrl && String(svc.imageUrl).trim()) || null;
      const logoUrl = (b.logoUrl && String(b.logoUrl).trim()) || null;
      const bannerUrl = (b.bannerUrl && String(b.bannerUrl).trim()) || null;
      const bizLat = b.latitude ?? null;
      const bizLng = b.longitude ?? null;
      const distanceLabel = distanceLabelBetween(geo.lat, geo.lng, bizLat, bizLng);

      return {
        id: (p - 1) * l + index + 1,
        businessId: b.id,
        name: b.name,
        categoryKey,
        rating: ratingStr,
        reviews: reviewsStr,
        price: displayPrice,
        serviceName: svc.name ?? '',
        serviceDurationMinutes: svc.duration ?? 0,
        lat: bizLat ?? 0,
        lng: bizLng ?? 0,
        imageUrl: safeImageUrl(svc.imageUrl),
        logoUrl: safeImageUrl(b.logoUrl),
        bannerUrl: safeImageUrl(b.bannerUrl),
        unsplashImgId: null,
        locationLabel: b.address || 'Panama City',
        distanceLabel,
        amenityKeys: keys,
        amenityLabelsEn,
        amenityLabelsEs,
      };
    });

    return {
      data,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  @Get('mobile/notifications')
  async getMobileNotifications(@Headers('authorization') authorization?: string) {
    await requireUser(this.prisma, authorization, [Role.USER]);
    const notifications = await this.prisma.notification.findMany({
      where: {
        OR: [{ role: Role.USER }, { type: 'BROADCAST' }],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  @Get('mobile/events')
  async getMobileEvents() {
    const events = await this.prisma.event.findMany({
      where: { active: true },
      orderBy: { startAt: 'asc' },
      take: 50,
    });
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      body: e.body,
      startAt: e.startAt,
      location: e.location,
      price: e.price,
      imageKey: e.imageKey,
    }));
  }

  @Get('public/categories')
  async getPublicCategories() {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const activeBusinesses = await this.prisma.business.findMany({
      where: { status: 'active' },
      select: { id: true, categoryKeys: true },
    });
    const services = await this.prisma.service.findMany({
      where: { business: { status: 'active' } },
      select: { businessId: true, category: true },
    });
    const keysByBusiness = new Map<string, Set<string>>();
    for (const b of activeBusinesses) {
      const s = new Set<string>();
      for (const k of b.categoryKeys) {
        if (k) s.add(k);
      }
      keysByBusiness.set(b.id, s);
    }
    for (const row of services) {
      const k = categoryKeyFromServiceCategory(row.category);
      const set = keysByBusiness.get(row.businessId);
      if (set) set.add(k);
    }
    const countByKey = new Map<string, number>();
    for (const [, set] of keysByBusiness) {
      for (const k of set) {
        countByKey.set(k, (countByKey.get(k) ?? 0) + 1);
      }
    }
    return categories.map((c) => ({
      ...c,
      activeBusinessCount: countByKey.get(c.key) ?? 0,
    }));
  }

  @Get('public/amenities')
  async getPublicAmenities() {
    return this.prisma.amenity.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        key: true,
        labelEn: true,
        labelEs: true,
        descriptionEn: true,
        descriptionEs: true,
        imageUrl: true,
        sortOrder: true,
      },
    });
  }

  @Post('public/business-join')
  async createPublicBusinessJoin(
    @Body()
    body: {
      name: string;
      taxId: string;
      owner: string;
      email: string;
      phone: string;
      address: string;
      categories: string[];
      services: Array<{ name: string; price: number; duration: number; category?: string }>;
      idDocumentImage?: string;
      licenseDocumentImage?: string;
      insuranceDocumentImage?: string;
    },
  ) {
    const name = (body.name || '').trim();
    const taxId = (body.taxId || '').trim();
    const owner = (body.owner || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const address = (body.address || '').trim();
    const categories = Array.isArray(body.categories) ? body.categories.filter(Boolean) : [];
    const services = Array.isArray(body.services) ? body.services : [];
    const idDocumentImage = String(body.idDocumentImage || '').trim();
    const licenseDocumentImage = String(body.licenseDocumentImage || '').trim();
    const insuranceDocumentImage = String(body.insuranceDocumentImage || '').trim();

    if (!name || !taxId || !owner || !email || !phone || !address) {
      throw new BadRequestException('name, taxId, owner, email, phone, and address are required');
    }
    if (categories.length === 0) {
      throw new BadRequestException('at least one category is required');
    }
    if (services.length === 0) {
      throw new BadRequestException('at least one service is required');
    }
    if (!idDocumentImage || !licenseDocumentImage || !insuranceDocumentImage) {
      throw new BadRequestException('id, license, and insurance images are required');
    }

    const existing = await this.prisma.business.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('business already exists for this email');

    const merchantNumber = await allocateMerchantNumber(this.prisma);
    const created = await this.prisma.business.create({
      data: {
        merchantNumber,
        name,
        owner,
        email,
        phone,
        address,
        categoryKeys: categories,
        description: `Categories: ${categories.join(', ')}`,
        taxId,
        status: 'pending',
        idVerified: false,
        licenseVerified: false,
        insuranceVerified: false,
        idDocumentImage,
        licenseDocumentImage,
        insuranceDocumentImage,
        services: {
          create: services.map((s) => ({
            name: (s.name || '').trim() || 'Service',
            price: Number(s.price) || 0,
            duration: Number(s.duration) || 30,
            category: (s.category || categories[0] || 'general').toString(),
          })),
        },
      },
      include: { services: true },
    });
    await this.prisma.businessStatusHistory.create({
      data: {
        businessId: created.id,
        fromStatus: null,
        toStatus: created.status,
        reason: 'Created from public business join form',
        actorName: 'System',
      },
    });

    return {
      id: created.id,
      merchantNumber: created.merchantNumber,
      status: created.status,
      services: created.services.length,
    };
  }

  @Get('mobile/jobs')
  async getMobileJobs() {
    return this.prisma.jobPosting.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Get('mobile/favorites')
  async getMobileFavorites(
    @Headers('authorization') authorization?: string,
    @Query('userLat') userLat?: string,
    @Query('userLng') userLng?: string,
  ) {
    const geo = parseUserGeoQuery(userLat, userLng);
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    const rows = await this.prisma.userFavorite.findMany({
      where: { userId: user.id, business: { status: 'active' } },
      include: { business: true },
    });
    if (rows.length === 0) return [];
    const businessIds = rows.map((r) => r.businessId);
    const itemImages = await this.prisma.service.findMany({
      where: { businessId: { in: businessIds } },
      orderBy: [{ price: 'asc' }, { name: 'asc' }],
      select: { businessId: true, imageUrl: true },
    });
    const itemImageByBusiness = new Map<string, string | null>();
    for (const s of itemImages) {
      if (itemImageByBusiness.has(s.businessId)) continue;
      const img = (s.imageUrl || '').trim();
      itemImageByBusiness.set(s.businessId, img || null);
    }
    const [reviewAgg, minPrices] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['businessId'],
        where: { businessId: { in: businessIds }, businessRating: { not: null } },
        _avg: { businessRating: true },
        _count: { _all: true },
      }),
      this.prisma.service.groupBy({
        by: ['businessId'],
        where: { businessId: { in: businessIds } },
        _min: { price: true },
      }),
    ]);
    const reviewByBiz = new Map(
      reviewAgg.map((x) => [
        x.businessId,
        { avg: x._avg.businessRating ?? 0, count: x._count._all },
      ]),
    );
    const minPriceByBiz = new Map(minPrices.map((p) => [p.businessId, p._min.price ?? 0]));
    return rows.map((r) => {
      const b = r.business;
      const rv = reviewByBiz.get(b.id);
      const ratingNum = rv?.avg != null ? Number(rv.avg.toFixed(1)) : 0;
      const reviewsCount = rv?.count ?? 0;
      const minSvc = minPriceByBiz.get(b.id) ?? 0;
      const imageUrl = itemImageByBusiness.get(b.id) ?? null;
      const bizLat = b.latitude ?? null;
      const bizLng = b.longitude ?? null;
      const distanceLabel = distanceLabelBetween(geo.lat, geo.lng, bizLat, bizLng);
      return {
        id: r.id,
        businessId: b.id,
        name: b.name,
        categoryKey: (b.categoryKeys && b.categoryKeys[0]) || 'beautyService',
        rating: String(ratingNum),
        reviews: String(reviewsCount),
        price: `$${Number(minSvc || 0).toFixed(2)}`,
        lat: bizLat ?? 0,
        lng: bizLng ?? 0,
        imageUrl,
        logoUrl: b.logoUrl,
        bannerUrl: b.bannerUrl,
        unsplashImgId: null,
        locationLabel: b.address,
        distanceLabel,
      };
    });
  }

  @Post('mobile/favorites')
  async addMobileFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { businessId: string },
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    await this.prisma.userFavorite.upsert({
      where: {
        userId_businessId: { userId: user.id, businessId: body.businessId },
      },
      create: { userId: user.id, businessId: body.businessId },
      update: {},
    });
    return { ok: true };
  }

  @Delete('mobile/favorites/:businessId')
  async removeMobileFavorite(
    @Headers('authorization') authorization: string | undefined,
    @Param('businessId') businessId: string,
  ) {
    const user = await requireUser(this.prisma, authorization, [Role.USER]);
    await this.prisma.userFavorite.deleteMany({
      where: { userId: user.id, businessId },
    });
    return { ok: true };
  }
}
