import { Prisma } from '@prisma/client';
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
import { PrismaService } from './prisma.service';
import { S3StorageService } from './storage/s3-storage.service';
export declare class AppController {
    private readonly prisma;
    private readonly s3Storage;
    constructor(prisma: PrismaService, s3Storage: S3StorageService);
    private storeImage;
    getAdminConfig(authorization?: string): Promise<Record<string, unknown>>;
    updateAdminConfig(body: Record<string, unknown>, authorization?: string): Promise<Record<string, unknown>>;
    publishSiteStatus(authorization?: string): Promise<{
        maintenanceMode: boolean;
        platformBranding: string;
        ok: boolean;
        url: string | null;
    }>;
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
        user: {
            name: string;
            id: string;
            email: string;
            phone: string | null;
            address: string | null;
            status: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            avatar: string | null;
            gender: string | null;
            age: number | null;
            webPushEnabled: boolean;
        };
        sessionExpiresAt: string;
        security: {
            minPasswordLength: number;
            sessionTimeoutMinutes: number;
        };
    } | {
        twoFactorRequired: boolean;
        email: string;
        message: string;
    }>;
    adminVerifyTwoFactor(body: {
        email?: string;
        code?: string;
    }): Promise<{
        token: string;
        user: {
            name: string;
            id: string;
            email: string;
            phone: string | null;
            address: string | null;
            status: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            avatar: string | null;
            gender: string | null;
            age: number | null;
            webPushEnabled: boolean;
        };
        sessionExpiresAt: string;
        security: {
            minPasswordLength: number;
            sessionTimeoutMinutes: number;
        };
    }>;
    checkEmail(body: CheckEmailDto): Promise<{
        exists: boolean;
    }>;
    registerCustomer(body: RegisterCustomerDto): Promise<{
        token: string;
        user: {
            name: string;
            id: string;
            email: string;
            phone: string | null;
            address: string | null;
            status: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            avatar: string | null;
            gender: string | null;
            age: number | null;
            webPushEnabled: boolean;
        };
        sessionExpiresAt: string;
        security: {
            minPasswordLength: number;
            sessionTimeoutMinutes: number;
        };
    }>;
    private findValidPasswordResetCode;
    forgotPassword(body: {
        email?: string;
    }): Promise<Record<string, unknown> | {
        ok: boolean;
        message: string;
    }>;
    private assertPasswordResetUser;
    verifyResetCode(body: {
        email?: string;
        code?: string;
    }): Promise<{
        ok: boolean;
    }>;
    resetPasswordWithCode(body: {
        email?: string;
        code?: string;
        newPassword?: string;
    }): Promise<{
        ok: boolean;
        message: string;
    }>;
    googleAuth(body: {
        idToken: string;
        name?: string;
    }): Promise<{
        token: string;
        user: {
            name: string;
            id: string;
            email: string;
            phone: string | null;
            address: string | null;
            status: string;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            avatar: string | null;
            gender: string | null;
            age: number | null;
            webPushEnabled: boolean;
        };
        sessionExpiresAt: string;
        security: {
            minPasswordLength: number;
            sessionTimeoutMinutes: number;
        };
    }>;
    getPublicSecurityPolicy(): Promise<{
        minPasswordLength: number;
        sessionTimeoutMinutes: number;
        adminTwoFactorRequired: boolean;
    }>;
    getPublicVapidKey(): {
        publicKey: string | null;
        configured: boolean;
    };
    getPushStatus(authorization?: string): Promise<{
        configured: boolean;
        enabled: boolean;
        subscribed: boolean;
        subscriptionCount: number;
    }>;
    subscribePush(authorization: string | undefined, body: {
        endpoint?: string;
        keys?: {
            p256dh?: string;
            auth?: string;
        };
    }, userAgent?: string): Promise<{
        ok: boolean;
    }>;
    unsubscribePush(authorization?: string, endpoint?: string): Promise<{
        ok: boolean;
    }>;
    updatePushPreferences(authorization: string | undefined, body: {
        enabled?: boolean;
    }): Promise<{
        enabled: boolean;
        subscribed: boolean;
    }>;
    testPush(authorization?: string): Promise<{
        sent: number;
        failed: number;
    }>;
    getPublicSiteFooter(): Promise<{
        socialFacebookUrl: string | null;
        socialInstagramUrl: string | null;
        socialLinkedinUrl: string | null;
        appStoreUrl: string | null;
        playStoreUrl: string | null;
        showFooterDownloadApp: boolean;
        showDownloadSection: boolean;
        clientLinks: ({
            labelKey: string;
            url: string;
            external: boolean;
        } | null)[];
        businessLinks: ({
            labelKey: string;
            url: string;
            external: boolean;
        } | null)[];
        legalLinks: ({
            labelKey: string;
            url: string;
            external: boolean;
        } | null)[];
    }>;
    getPublicSiteStatus(): Promise<{
        maintenanceMode: boolean;
        platformBranding: string;
    }>;
    getPublicSiteHero(): Promise<{
        enabled: boolean;
        title: string | null;
        subtitle: string | null;
        dealText: string | null;
        imageUrl: string | null;
        ctaText: string | null;
        ctaUrl: string | null;
        ctaExternal: boolean;
    }>;
    getPaymentConfig(): Promise<import("./payments/payment-config.util").PublicPaymentConfig>;
    getPublicCustomerServiceFaqs(): Promise<{
        id: string;
        questionEn: string;
        questionEs: string;
        answerEn: string;
        answerEs: string;
        sortOrder: number;
    }[]>;
    getBusinessSession(authorization?: string): Promise<{
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
        images: string[];
        description: string;
        category: string;
        categories: string[];
        location: string;
        latitude: number | null;
        longitude: number | null;
        contactEmail: string;
        contactPhone: string;
        balance: number;
        revenue: number;
        socialYoutube: string;
        socialInstagram: string;
        socialX: string;
        socialTiktok: string;
        workingHours: string;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        categoryKeys: string[];
        amenityKeys: string[];
        status: string;
        planId: string;
        plan: string;
        taxPercentage: number;
        appointmentApprovalMode: "manual" | "automatic";
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        cancellationPolicyMessageEn: string;
        cancellationPolicyMessageEs: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        setupStatus: import("./business/business-listing.util").BusinessSetupStatus;
        owner: string;
        taxId: string;
        businessType: string;
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
    } | null>;
    getUserSession(authorization?: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        avatar: string | null;
        address: string;
        gender: string;
        age: number | null;
        webPushEnabled: boolean;
    }>;
    updateUserSession(authorization: string | undefined, body: {
        name?: string;
        phone?: string;
        email?: string;
        avatar?: string;
        gender?: string;
    }): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string;
        avatar: string | null;
        address: string;
        gender: string;
        age: number | null;
        webPushEnabled: boolean;
    }>;
    updateUserPassword(authorization: string | undefined, body: {
        currentPassword?: string;
        newPassword?: string;
    }): Promise<{
        ok: boolean;
    }>;
    getAdminSession(authorization?: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    getAdminDashboard(authorization?: string, rangeQuery?: string): Promise<{
        range: string;
        stats: {
            businesses: number;
            newBusinesses: number;
            users: number;
            bookings: number;
            revenue: number;
            pendingApprovals: number;
            avgBookingValue: number;
            bookingsPerCustomer: number;
            revenuePerCustomer: number;
            customersPerBooking: number;
            distinctBookers: number;
            platformBalance: number;
        };
        previous: {
            businesses: number;
            newBusinesses: number;
            users: number;
            bookings: number;
            revenue: number;
            pendingApprovals: number;
            avgBookingValue: number;
            bookingsPerCustomer: number;
            revenuePerCustomer: number;
            customersPerBooking: number;
            distinctBookers: number;
        };
        changes: {
            businesses: number;
            bookings: number;
            revenue: number;
            users: number;
            avgBookingValue: number;
            bookingsPerCustomer: number;
            revenuePerCustomer: number;
            customersPerBooking: number;
            pendingApprovals: number;
        };
        charts: {
            weeklyBookings: {
                day: string;
                bookings: number;
            }[];
            revenue: {
                month: string;
                amount: number;
            }[];
        };
        recentActivities: {
            id: string;
            user: string;
            message: string;
            timestamp: Date;
            type: string;
            title: string;
        }[];
    }>;
    getAdminBroadcasts(authorization?: string): Promise<{
        id: string;
        audience: string;
        status: string;
        reach: number;
        readRate: string;
        sentAt: string;
        summary: string;
    }[]>;
    getAdminEvents(auth?: string): Promise<{
        location: string;
        id: string;
        active: boolean;
        createdAt: Date;
        title: string;
        body: string;
        price: number;
        startAt: Date;
        imageKey: string | null;
        websiteUrl: string | null;
    }[]>;
    createAdminEvent(body: any, auth?: string): Promise<{
        location: string;
        id: string;
        active: boolean;
        createdAt: Date;
        title: string;
        body: string;
        price: number;
        startAt: Date;
        imageKey: string | null;
        websiteUrl: string | null;
    }>;
    updateAdminEvent(id: string, body: any, auth?: string): Promise<{
        location: string;
        id: string;
        active: boolean;
        createdAt: Date;
        title: string;
        body: string;
        price: number;
        startAt: Date;
        imageKey: string | null;
        websiteUrl: string | null;
    }>;
    deleteAdminEvent(id: string, auth?: string): Promise<{
        success: boolean;
    }>;
    getAdminBusinesses(page?: string, limit?: string, search?: string, status?: string, authorization?: string): Promise<{
        data: {
            id: string;
            name: string;
            address: string;
            description: string;
            merchantNumber: number | null;
            taxId: string;
            owner: string;
            email: string;
            phone: string;
            categoryKeys: string[];
            status: string;
            listingVisible: boolean;
            profileSetupComplete: boolean;
            revenue: number;
            joinedDate: Date;
            rejectionReason: string | null;
            idDocumentImage: string | null;
            licenseDocumentImage: string | null;
            insuranceDocumentImage: string | null;
            documents: {
                id_verified: boolean;
                license_verified: boolean;
                insurance_verified: boolean;
            };
            statusHistory: {
                id: string;
                createdAt: Date;
                businessId: string;
                fromStatus: string | null;
                toStatus: string;
                reason: string | null;
                actorId: string | null;
                actorName: string | null;
                actorRole: import(".prisma/client").$Enums.Role | null;
            }[];
            registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
            workingHours: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAdminBusinessById(id: string, authorization?: string): Promise<{
        id: string;
        merchantNumber: number | null;
        name: string;
        owner: string;
        email: string;
        phone: string;
        address: string;
        description: string;
        taxId: string;
        status: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        revenue: number;
        balance: number;
        joinedDate: Date;
        rejectionReason: string | null;
        categoryKeys: string[];
        categoryLabels: string[];
        amenityKeys: string[];
        amenities: {
            key: string;
            labelEn: string;
            labelEs: string;
        }[];
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        bannerUrl: string | null;
        images: (string | null)[];
        socialYoutube: string | null;
        socialInstagram: string | null;
        socialX: string | null;
        socialTiktok: string | null;
        workingHours: string | null;
        taxPercentage: number;
        plan: string;
        planId: string | null;
        planName: string;
        appointmentApprovalMode: string;
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        idDocumentImage: string | null;
        licenseDocumentImage: string | null;
        insuranceDocumentImage: string | null;
        documents: {
            id_verified: boolean;
            license_verified: boolean;
            insurance_verified: boolean;
        };
        statusHistory: {
            id: string;
            createdAt: Date;
            businessId: string;
            fromStatus: string | null;
            toStatus: string;
            reason: string | null;
            actorId: string | null;
            actorName: string | null;
            actorRole: import(".prisma/client").$Enums.Role | null;
        }[];
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
        registrationPhotoUrls: string[];
        loginAccount: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: string;
            createdAt: Date;
        } | null;
        services: {
            id: string;
            name: string;
            price: number;
            duration: number;
            category: string;
            imageUrl: string | null;
        }[];
        staff: {
            id: string;
            name: string;
            role: string;
            skills: string[];
            availability: string;
            image: string | null;
            bio: string | null;
            experienceYears: number;
        }[];
        reviewCount: number;
    }>;
    updateAdminBusinessStatus(authorization: string | undefined, id: string, body: {
        status: 'active' | 'pending' | 'suspended' | 'rejected';
        reason?: string;
    }): Promise<{
        ok: boolean;
        id: string;
        status: string;
    }>;
    updateAdminBusinessDocumentVerification(authorization: string | undefined, id: string, body: {
        document: 'id' | 'license' | 'insurance';
        approved: boolean;
    }): Promise<{
        ok: boolean;
        id: string;
        documents: {
            id_verified: boolean;
            license_verified: boolean;
            insurance_verified: boolean;
        };
    }>;
    deleteAdminBusiness(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getAdminBookings(page?: string, limit?: string, status?: string, search?: string, authorization?: string): Promise<{
        data: {
            id: string;
            user: string;
            email: string;
            business: string;
            businessId: string;
            service: string;
            date: Date;
            amount: number;
            status: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    deleteAdminBooking(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    updateAdminBookingStatus(authorization: string | undefined, id: string, body: {
        status: string;
    }): Promise<{
        ok: boolean;
        id: string;
        status: string;
        user: string;
        email: string;
        business: string;
        date: Date;
        amount: number;
        service: string | null;
    }>;
    getAdminPromotions(page?: string, limit?: string, authorization?: string): Promise<{
        data: {
            id: string;
            businessId: string;
            businessName: string;
            serviceId: string;
            serviceName: string;
            servicePrice: number;
            discountPercent: number;
            discountedPrice: number;
            label: string | null;
            active: boolean;
            startsAt: Date;
            endsAt: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createAdminPromotion(body: {
        businessId: string;
        serviceId: string;
        discountPercent: number;
        label?: string;
        endsAt?: string;
    }, authorization?: string): Promise<{
        business: {
            description: string;
            workingHours: string | null;
            name: string;
            id: string;
            merchantNumber: number | null;
            owner: string;
            email: string;
            phone: string;
            address: string;
            categoryKeys: string[];
            amenityKeys: string[];
            taxId: string;
            status: string;
            idVerified: boolean;
            licenseVerified: boolean;
            insuranceVerified: boolean;
            idDocumentImage: string | null;
            licenseDocumentImage: string | null;
            insuranceDocumentImage: string | null;
            rejectionReason: string | null;
            revenue: number;
            balance: number;
            joinedDate: Date;
            notifyBookingEmail: boolean;
            notifyCancellationEmail: boolean;
            notifyDailySummary: boolean;
            logoUrl: string | null;
            bannerUrl: string | null;
            images: string[];
            latitude: number | null;
            longitude: number | null;
            categoryLabel: string | null;
            categoryLabels: string[];
            socialYoutube: string | null;
            socialInstagram: string | null;
            socialX: string | null;
            socialTiktok: string | null;
            taxPercentage: number;
            appointmentApprovalMode: string;
            cancellationAllowed: boolean;
            cancellationHoursBefore: number;
            plan: string;
            planExpires: Date | null;
            planId: string | null;
            registrationDetails: Prisma.JsonValue | null;
            listingVisible: boolean;
            profileSetupComplete: boolean;
        };
        service: {
            name: string;
            id: string;
            category: string;
            businessId: string;
            price: number;
            duration: number;
            imageUrl: string | null;
        };
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        businessId: string;
        serviceId: string;
        label: string | null;
        discountPercent: number;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    deleteAdminPromotion(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getAdminLogs(page?: string, limit?: string, search?: string, severity?: string, authorization?: string): Promise<{
        data: {
            id: string;
            source: string;
            message: string;
            severity: string;
            timestamp: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAdminBusinessesServices(authorization?: string): Promise<{
        name: string;
        id: string;
        services: {
            name: string;
            id: string;
            category: string;
            price: number;
        }[];
    }[]>;
    getAdminUsers(page?: string, limit?: string, search?: string, status?: string, authorization?: string): Promise<{
        data: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            avatar: string | null;
            address: string | null;
            gender: string | null;
            age: number | null;
            status: string;
            joinedDate: Date;
            bookingsCount: number;
            bookings: {
                id: string;
                date: Date;
                status: string;
                price: number;
                taxAmount: number;
                serviceName: string;
                businessName: string;
                staffName: string;
            }[];
            reviews: {
                id: string;
                rating: number;
                comment: string;
                date: Date;
                serviceName: string;
                staffName: string;
                businessName: string;
            }[];
            favorites: {
                id: string;
                businessName: string;
            }[];
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    patchAdminUserStatus(authorization: string | undefined, id: string, body: {
        status?: string;
    }): Promise<{
        ok: boolean;
        id: string;
        status: string;
    }>;
    emailAdminUser(authorization: string | undefined, id: string, body: {
        subject?: string;
        message?: string;
    }): Promise<{
        ok: boolean;
        skipped?: boolean;
        error?: string;
        messageId?: string;
    }>;
    deleteAdminUser(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getAdminTransactions(page?: string, limit?: string, status?: string, authorization?: string): Promise<{
        data: {
            id: string;
            business: string;
            amount: number;
            date: Date;
            status: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    deleteAdminTransaction(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getAdminWallet(authorization?: string): Promise<{
        platformBalance: number;
        totalCommissionRecorded: number;
        pendingMerchantWithdrawals: number;
        defaultCommission: number;
    }>;
    getAdminWithdrawals(page?: string, limit?: string, status?: string, authorization?: string): Promise<{
        data: {
            id: string;
            amount: number;
            balance: number;
            status: string;
            date: Date;
            processedDate: Date | null;
            businessId: string;
            merchantNumber: number | null;
            business: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        totalPendingAmount: number;
        pendingCount: number;
    }>;
    deleteAdminWithdrawal(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    batchApproveAdminWithdrawals(authorization: string | undefined, body?: {
        ids?: string[];
    }): Promise<{
        ok: boolean;
        approved: number;
        totalAmount: number;
        ids: string[];
    }>;
    approveAdminWithdrawal(authorization: string | undefined, id: string): Promise<{
        id: string;
        status: string;
        balance: number;
        businessId: string;
        date: Date;
        amount: number;
        processedDate: Date | null;
    }>;
    rejectAdminWithdrawal(authorization: string | undefined, id: string, body: {
        reason?: string;
    }): Promise<{
        id: string;
        status: string;
        balance: number;
        businessId: string;
        date: Date;
        amount: number;
        processedDate: Date | null;
    }>;
    getAdminAlertFeed(authorization?: string, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            type: string;
            title: string;
            body: string;
            read: boolean;
            createdAt: string;
        }[];
        total: number;
        unread: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    markAdminAlertRead(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    markAllAdminAlertsRead(authorization?: string): Promise<{
        ok: boolean;
    }>;
    getAdminNotifications(authorization?: string, page?: string, limit?: string, status?: string, search?: string): Promise<{
        data: {
            id: string;
            ticketRef: string;
            subject: string;
            category: string;
            status: string;
            priority: string;
            businessId: string | null;
            businessName: string | null;
            merchantNumber: number | null;
            userId: string | null;
            requesterName: string;
            requesterEmail: string | null;
            screenshotUrl: string | null;
            hasScreenshot: boolean;
            createdByRole: import(".prisma/client").$Enums.Role;
            createdAt: string;
            updatedAt: string;
            resolvedAt: string | null;
            messageCount: number;
            lastMessage: string | null;
            messages: {
                id: string;
                body: string;
                senderRole: import(".prisma/client").$Enums.Role;
                senderName: string | null;
                attachmentUrl: string | null;
                hasAttachment: boolean;
                createdAt: string;
            }[] | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        openCount: number;
    }>;
    getAdminSupportTickets(authorization?: string, page?: string, limit?: string, status?: string, search?: string): Promise<{
        data: {
            id: string;
            ticketRef: string;
            subject: string;
            category: string;
            status: string;
            priority: string;
            businessId: string | null;
            businessName: string | null;
            merchantNumber: number | null;
            userId: string | null;
            requesterName: string;
            requesterEmail: string | null;
            screenshotUrl: string | null;
            hasScreenshot: boolean;
            createdByRole: import(".prisma/client").$Enums.Role;
            createdAt: string;
            updatedAt: string;
            resolvedAt: string | null;
            messageCount: number;
            lastMessage: string | null;
            messages: {
                id: string;
                body: string;
                senderRole: import(".prisma/client").$Enums.Role;
                senderName: string | null;
                attachmentUrl: string | null;
                hasAttachment: boolean;
                createdAt: string;
            }[] | undefined;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        openCount: number;
    }>;
    getAdminSupportTicket(authorization: string | undefined, id: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    updateAdminSupportTicketStatus(authorization: string | undefined, id: string, body: {
        status: string;
    }): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    replyAdminSupportTicket(authorization: string | undefined, id: string, body: {
        message: string;
    }): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    batchResolveAdminSupportTickets(authorization: string | undefined, body?: {
        ids?: string[];
    }): Promise<{
        ok: boolean;
        resolved: number;
    }>;
    testAdminEmail(authorization: string | undefined, body: {
        to?: string;
    }): Promise<{
        ok: boolean;
        provider: string;
        to: string;
        from: string;
        messageStream: string;
        configSource: string;
        message: string;
        skipped?: boolean;
        error?: string;
        messageId?: string;
    }>;
    getAdminEmailRecent(authorization?: string): Promise<{
        configured: boolean;
        from: string | null;
        replyTo: string | null;
        messageStream: string | null;
        configSource: string;
        recent: {
            id: string;
            recipient: string;
            subject: string | null;
            status: string;
            error: string | null;
            meta: string | null;
            createdAt: Date;
        }[];
    }>;
    testAdminSms(authorization: string | undefined, body: {
        to?: string;
    }): Promise<{
        ok: boolean;
        skipped?: boolean;
        error?: string;
    }>;
    getAdminPlans(authorization?: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        billingCycle: string;
        features: string[];
    }[]>;
    createAdminPlan(body: any, authorization?: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        billingCycle: string;
        features: string[];
    }>;
    updateAdminPlan(id: string, body: any, authorization?: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        billingCycle: string;
        features: string[];
    }>;
    deleteAdminPlan(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getNotifications(authorization?: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
        title: string;
        body: string;
        userId: string | null;
        type: string;
        read: boolean;
    }[]>;
    markNotificationRead(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    markAllNotificationsRead(authorization?: string): Promise<{
        ok: boolean;
    }>;
    deleteAdminNotification(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getAdminCustomerServiceFaqs(page?: string, limit?: string, search?: string, authorization?: string): Promise<{
        data: {
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            questionEn: string;
            questionEs: string;
            answerEn: string;
            answerEs: string;
            sortOrder: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createAdminCustomerServiceFaq(authorization: string | undefined, body: {
        questionEn: string;
        questionEs?: string;
        answerEn: string;
        answerEs?: string;
        sortOrder?: number;
        active?: boolean;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        questionEn: string;
        questionEs: string;
        answerEn: string;
        answerEs: string;
        sortOrder: number;
    }>;
    updateAdminCustomerServiceFaq(authorization: string | undefined, id: string, body: {
        questionEn?: string;
        questionEs?: string;
        answerEn?: string;
        answerEs?: string;
        sortOrder?: number;
        active?: boolean;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        questionEn: string;
        questionEs: string;
        answerEn: string;
        answerEs: string;
        sortOrder: number;
    }>;
    deleteAdminCustomerServiceFaq(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getAdminCategories(page?: string, limit?: string, search?: string, authorization?: string): Promise<{
        data: {
            id: string;
            active: boolean;
            createdAt: Date;
            imageUrl: string | null;
            sortOrder: number;
            key: string;
            labelEn: string;
            labelEs: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createAdminCategory(authorization: string | undefined, body: {
        key: string;
        labelEn: string;
        labelEs: string;
        imageUrl?: string;
        active?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
    }>;
    deleteAdminCategory(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    updateAdminCategory(authorization: string | undefined, id: string, body: {
        labelEn?: string;
        labelEs?: string;
        imageUrl?: string;
        active?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
    }>;
    getAdminAmenities(authorization?: string): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
        descriptionEn: string | null;
        descriptionEs: string | null;
    }[]>;
    createAdminAmenity(authorization: string | undefined, body: {
        key: string;
        labelEn: string;
        labelEs: string;
        descriptionEn?: string;
        descriptionEs?: string;
        imageUrl?: string;
        active?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
        descriptionEn: string | null;
        descriptionEs: string | null;
    }>;
    deleteAdminAmenity(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
    }>;
    updateAdminAmenity(authorization: string | undefined, id: string, body: {
        labelEn?: string;
        labelEs?: string;
        descriptionEn?: string;
        descriptionEs?: string;
        imageUrl?: string;
        active?: boolean;
        sortOrder?: number;
    }): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
        descriptionEn: string | null;
        descriptionEs: string | null;
    }>;
    broadcast(authorization: string | undefined, body: {
        message: string;
        target: string;
    }): Promise<{
        id: string;
        status: string;
        roles: import(".prisma/client").$Enums.Role[];
        push: {
            sent: number;
            failed: number;
            recipients: number;
        };
    }>;
    getBusiness(id: string, authorization?: string, userLat?: string, userLng?: string): Promise<{
        images: string[];
        portfolioImageUrls: string[];
        rating: string;
        reviews: string;
        distanceLabel: string;
        taxPercentage: number;
        commissionPercent: number;
        serviceFee: number;
        venueDetailSections: import("./business/venue-details.util").VenueDetailSection[];
        registrationPhotoUrls: string[];
        amenities: {
            key: string;
            labelEn: string;
            labelEs: string;
            descriptionEn: string | null;
            descriptionEs: string | null;
        }[];
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
        description: string;
        category: string;
        categories: string[];
        location: string;
        latitude: number | null;
        longitude: number | null;
        contactEmail: string;
        contactPhone: string;
        balance: number;
        revenue: number;
        socialYoutube: string;
        socialInstagram: string;
        socialX: string;
        socialTiktok: string;
        workingHours: string;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        categoryKeys: string[];
        amenityKeys: string[];
        status: string;
        planId: string;
        plan: string;
        appointmentApprovalMode: "manual" | "automatic";
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        cancellationPolicyMessageEn: string;
        cancellationPolicyMessageEs: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        setupStatus: import("./business/business-listing.util").BusinessSetupStatus;
        owner: string;
        taxId: string;
        businessType: string;
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
    } | null>;
    getBusinessByEmail(email: string): Promise<{
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
        images: string[];
        description: string;
        category: string;
        categories: string[];
        location: string;
        latitude: number | null;
        longitude: number | null;
        contactEmail: string;
        contactPhone: string;
        balance: number;
        revenue: number;
        socialYoutube: string;
        socialInstagram: string;
        socialX: string;
        socialTiktok: string;
        workingHours: string;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        categoryKeys: string[];
        amenityKeys: string[];
        status: string;
        planId: string;
        plan: string;
        taxPercentage: number;
        appointmentApprovalMode: "manual" | "automatic";
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        cancellationPolicyMessageEn: string;
        cancellationPolicyMessageEs: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        setupStatus: import("./business/business-listing.util").BusinessSetupStatus;
        owner: string;
        taxId: string;
        businessType: string;
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
    } | null>;
    updateBusiness(id: string, body: UpdateBusinessPanelDto, authorization?: string): Promise<{
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
        images: string[];
        description: string;
        category: string;
        categories: string[];
        location: string;
        latitude: number | null;
        longitude: number | null;
        contactEmail: string;
        contactPhone: string;
        balance: number;
        revenue: number;
        socialYoutube: string;
        socialInstagram: string;
        socialX: string;
        socialTiktok: string;
        workingHours: string;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        categoryKeys: string[];
        amenityKeys: string[];
        status: string;
        planId: string;
        plan: string;
        taxPercentage: number;
        appointmentApprovalMode: "manual" | "automatic";
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        cancellationPolicyMessageEn: string;
        cancellationPolicyMessageEs: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        setupStatus: import("./business/business-listing.util").BusinessSetupStatus;
        owner: string;
        taxId: string;
        businessType: string;
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
    } | null>;
    updateBusinessListingVisibility(id: string, body: {
        visible?: boolean;
    }, authorization?: string): Promise<{
        id: string;
        name: string;
        logo: string | null;
        banner: string | null;
        images: string[];
        description: string;
        category: string;
        categories: string[];
        location: string;
        latitude: number | null;
        longitude: number | null;
        contactEmail: string;
        contactPhone: string;
        balance: number;
        revenue: number;
        socialYoutube: string;
        socialInstagram: string;
        socialX: string;
        socialTiktok: string;
        workingHours: string;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        categoryKeys: string[];
        amenityKeys: string[];
        status: string;
        planId: string;
        plan: string;
        taxPercentage: number;
        appointmentApprovalMode: "manual" | "automatic";
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        cancellationPolicyMessageEn: string;
        cancellationPolicyMessageEs: string;
        listingVisible: boolean;
        profileSetupComplete: boolean;
        setupStatus: import("./business/business-listing.util").BusinessSetupStatus;
        owner: string;
        taxId: string;
        businessType: string;
        registrationDetails: string | number | boolean | Prisma.JsonObject | Prisma.JsonArray | null;
        registrationSections: import("./business/venue-details.util").VenueDetailSection[];
    } | null>;
    upgradeBusinessPlan(id: string, body: {
        plan?: string;
        planId?: string;
    }, authorization?: string): Promise<{
        description: string;
        workingHours: string | null;
        name: string;
        id: string;
        merchantNumber: number | null;
        owner: string;
        email: string;
        phone: string;
        address: string;
        categoryKeys: string[];
        amenityKeys: string[];
        taxId: string;
        status: string;
        idVerified: boolean;
        licenseVerified: boolean;
        insuranceVerified: boolean;
        idDocumentImage: string | null;
        licenseDocumentImage: string | null;
        insuranceDocumentImage: string | null;
        rejectionReason: string | null;
        revenue: number;
        balance: number;
        joinedDate: Date;
        notifyBookingEmail: boolean;
        notifyCancellationEmail: boolean;
        notifyDailySummary: boolean;
        logoUrl: string | null;
        bannerUrl: string | null;
        images: string[];
        latitude: number | null;
        longitude: number | null;
        categoryLabel: string | null;
        categoryLabels: string[];
        socialYoutube: string | null;
        socialInstagram: string | null;
        socialX: string | null;
        socialTiktok: string | null;
        taxPercentage: number;
        appointmentApprovalMode: string;
        cancellationAllowed: boolean;
        cancellationHoursBefore: number;
        plan: string;
        planExpires: Date | null;
        planId: string | null;
        registrationDetails: Prisma.JsonValue | null;
        listingVisible: boolean;
        profileSetupComplete: boolean;
    }>;
    getBusinessServices(id: string, page?: string, limit?: string, search?: string, category?: string, authorization?: string): Promise<{
        data: {
            imageUrl: string | null;
            promotions: {
                id: string;
                active: boolean;
                createdAt: Date;
                businessId: string;
                serviceId: string;
                label: string | null;
                discountPercent: number;
                startsAt: Date;
                endsAt: Date | null;
            }[];
            name: string;
            id: string;
            category: string;
            businessId: string;
            price: number;
            duration: number;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createBusinessService(id: string, body: CreateServiceDto, authorization?: string): Promise<{
        name: string;
        id: string;
        category: string;
        businessId: string;
        price: number;
        duration: number;
        imageUrl: string | null;
    }>;
    updateService(id: string, body: UpdateServiceDto, authorization?: string): Promise<{
        name: string;
        id: string;
        category: string;
        businessId: string;
        price: number;
        duration: number;
        imageUrl: string | null;
    }>;
    deleteService(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getBusinessBestsellers(id: string): Promise<{
        serviceId: string | null;
        bookingCount: number;
    }[]>;
    getBusinessPromotions(id: string): Promise<({
        service: {
            name: string;
            id: string;
            category: string;
            price: number;
            duration: number;
            imageUrl: string | null;
        };
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        businessId: string;
        serviceId: string;
        label: string | null;
        discountPercent: number;
        startsAt: Date;
        endsAt: Date | null;
    })[]>;
    createPromotion(id: string, body: {
        serviceId: string;
        discountPercent: number;
        label?: string;
        endsAt?: string;
    }, authorization?: string): Promise<{
        service: {
            name: string;
            id: string;
            category: string;
            businessId: string;
            price: number;
            duration: number;
            imageUrl: string | null;
        };
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        businessId: string;
        serviceId: string;
        label: string | null;
        discountPercent: number;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    updatePromotion(id: string, promoId: string, body: {
        discountPercent?: number;
        label?: string;
        endsAt?: string;
        active?: boolean;
    }, authorization?: string): Promise<{
        service: {
            name: string;
            id: string;
            category: string;
            businessId: string;
            price: number;
            duration: number;
            imageUrl: string | null;
        };
    } & {
        id: string;
        active: boolean;
        createdAt: Date;
        businessId: string;
        serviceId: string;
        label: string | null;
        discountPercent: number;
        startsAt: Date;
        endsAt: Date | null;
    }>;
    deletePromotion(promoId: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getBusinessStaff(id: string, page?: string, limit?: string, search?: string, role?: string, authorization?: string): Promise<{
        data: {
            image: string | null;
            experienceYears: number;
            rating: number;
            reviews: number;
            clients: number;
            name: string;
            id: string;
            role: string;
            businessId: string;
            skills: string[];
            serviceIds: string[];
            availability: string;
            bio: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createStaff(id: string, body: CreateStaffDto, authorization?: string): Promise<{
        image: string | null;
        name: string;
        id: string;
        role: string;
        businessId: string;
        skills: string[];
        serviceIds: string[];
        availability: string;
        bio: string | null;
        experienceYears: number;
    }>;
    updateStaff(id: string, body: UpdateStaffDto, authorization?: string): Promise<{
        image: string | null;
        name: string;
        id: string;
        role: string;
        businessId: string;
        skills: string[];
        serviceIds: string[];
        availability: string;
        bio: string | null;
        experienceYears: number;
    }>;
    deleteStaff(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getBusinessBookings(id: string, page?: string, limit?: string, status?: string, staffId?: string, search?: string, startDate?: string, endDate?: string, authorization?: string): Promise<{
        data: ({
            user: {
                name: string;
                id: string;
                email: string;
                phone: string | null;
                address: string | null;
                status: string;
                role: import(".prisma/client").$Enums.Role;
                createdAt: Date;
                avatar: string | null;
                gender: string | null;
                age: number | null;
                webPushEnabled: boolean;
            };
            familyMember: {
                name: string;
                id: string;
                email: string | null;
                createdAt: Date;
                gender: string;
                age: number | null;
                userId: string;
            } | null;
            service: {
                name: string;
                id: string;
                category: string;
                businessId: string;
                price: number;
                duration: number;
                imageUrl: string | null;
            } | null;
            staff: {
                name: string;
                id: string;
                role: string;
                businessId: string;
                skills: string[];
                serviceIds: string[];
                availability: string;
                image: string | null;
                bio: string | null;
                experienceYears: number;
            } | null;
            transaction: {
                description: string | null;
                id: string;
                status: string;
                businessId: string;
                date: Date;
                paymentMethod: string;
                amount: number;
                taxAmount: number;
                bookingId: string | null;
                customerEmail: string | null;
                staffMember: string | null;
                commissionAmount: number;
                type: string;
            } | null;
        } & {
            id: string;
            status: string;
            createdAt: Date;
            businessId: string;
            serviceId: string | null;
            customerName: string;
            date: Date;
            paymentMethod: string | null;
            price: number;
            userId: string;
            staffId: string | null;
            familyMemberId: string | null;
            transactionId: string | null;
            taxAmount: number;
            isReviewed: boolean;
            bookingGroupId: string | null;
            reminderSent24h: boolean;
            reminderSent1h: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createBooking(id: string, body: CreateBookingDto, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    payBusinessBookingGroup(id: string, body: {
        bookingIds: string[];
        paymentMethod?: string;
    }, authorization?: string): Promise<{
        description: string | null;
        id: string;
        status: string;
        businessId: string;
        date: Date;
        paymentMethod: string;
        amount: number;
        taxAmount: number;
        bookingId: string | null;
        customerEmail: string | null;
        staffMember: string | null;
        commissionAmount: number;
        type: string;
    }>;
    proposeReschedule(id: string, bookingId: string, body: {
        newDate: string;
    }, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    updateBooking(id: string, body: UpdateBookingDto, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    getBusinessReviews(id: string, page?: string, limit?: string, authorization?: string): Promise<{
        data: {
            id: string;
            status: string;
            avatar: string | null;
            businessId: string;
            customerName: string;
            serviceName: string;
            date: Date;
            userId: string;
            staffId: string | null;
            bookingId: string | null;
            rating: number;
            staffRating: number | null;
            businessRating: number | null;
            comment: string;
            staffName: string;
            reply: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createMobileReview(body: {
        bookingId: string;
        staffRating: number;
        businessRating: number;
        serviceRating?: number;
        comment: string;
    }, authorization?: string): Promise<{
        id: string;
        status: string;
        avatar: string | null;
        businessId: string;
        customerName: string;
        serviceName: string;
        date: Date;
        userId: string;
        staffId: string | null;
        bookingId: string | null;
        rating: number;
        staffRating: number | null;
        businessRating: number | null;
        comment: string;
        staffName: string;
        reply: string | null;
    }>;
    createMobileReviewGroup(body: {
        businessRating: number;
        comment: string;
        services: {
            bookingId: string;
            serviceRating: number;
            staffRating: number;
            comment?: string;
        }[];
    }, authorization?: string): Promise<{
        ok: boolean;
        count: number;
    }>;
    updateReview(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        id: string;
        status: string;
        avatar: string | null;
        businessId: string;
        customerName: string;
        serviceName: string;
        date: Date;
        userId: string;
        staffId: string | null;
        bookingId: string | null;
        rating: number;
        staffRating: number | null;
        businessRating: number | null;
        comment: string;
        staffName: string;
        reply: string | null;
    }>;
    deleteReview(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    getBusinessTransactions(id: string, page?: string, limit?: string, search?: string, type?: string, status?: string, authorization?: string): Promise<{
        description: string | null;
        id: string;
        status: string;
        businessId: string;
        date: Date;
        paymentMethod: string;
        amount: number;
        taxAmount: number;
        bookingId: string | null;
        customerEmail: string | null;
        staffMember: string | null;
        commissionAmount: number;
        type: string;
    }[] | {
        data: {
            description: string | null;
            id: string;
            status: string;
            businessId: string;
            date: Date;
            paymentMethod: string;
            amount: number;
            taxAmount: number;
            bookingId: string | null;
            customerEmail: string | null;
            staffMember: string | null;
            commissionAmount: number;
            type: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createTransaction(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        description: string | null;
        id: string;
        status: string;
        businessId: string;
        date: Date;
        paymentMethod: string;
        amount: number;
        taxAmount: number;
        bookingId: string | null;
        customerEmail: string | null;
        staffMember: string | null;
        commissionAmount: number;
        type: string;
    }>;
    getBusinessWithdrawals(id: string, page?: string, limit?: string, authorization?: string): Promise<{
        id: string;
        status: string;
        balance: number;
        businessId: string;
        date: Date;
        amount: number;
        processedDate: Date | null;
    }[] | {
        data: {
            id: string;
            status: string;
            balance: number;
            businessId: string;
            date: Date;
            amount: number;
            processedDate: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createBusinessWithdrawal(id: string, body: {
        amount: number;
    }, authorization?: string): Promise<{
        id: string;
        status: string;
        balance: number;
        businessId: string;
        date: Date;
        amount: number;
        processedDate: Date | null;
    }>;
    createBusinessSupportRequest(id: string, body: {
        message: string;
        subject?: string;
        category?: string;
        screenshotUrl?: string;
    }, authorization?: string): Promise<{
        ok: boolean;
        ticketId: string;
        ticketRef: string;
    }>;
    getBusinessSupportTickets(id: string, authorization?: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }[]>;
    createBusinessSupportTicket(id: string, body: {
        subject: string;
        message: string;
        category?: string;
        priority?: string;
        screenshotUrl?: string;
    }, authorization?: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    getBusinessSupportTicket(id: string, ticketId: string, authorization?: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    replyBusinessSupportTicket(id: string, ticketId: string, body: {
        message: string;
        screenshotUrl?: string;
    }, authorization?: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    getUserSupportTickets(authorization?: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }[]>;
    createUserSupportTicket(authorization: string | undefined, body: {
        subject: string;
        message: string;
        category?: string;
        screenshotUrl?: string;
        businessId?: string;
    }): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    getUserSupportTicket(authorization: string | undefined, ticketId: string): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    replyUserSupportTicket(authorization: string | undefined, ticketId: string, body: {
        message: string;
        screenshotUrl?: string;
    }): Promise<{
        id: string;
        ticketRef: string;
        subject: string;
        category: string;
        status: string;
        priority: string;
        businessId: string | null;
        businessName: string | null;
        merchantNumber: number | null;
        userId: string | null;
        requesterName: string;
        requesterEmail: string | null;
        screenshotUrl: string | null;
        hasScreenshot: boolean;
        createdByRole: import(".prisma/client").$Enums.Role;
        createdAt: string;
        updatedAt: string;
        resolvedAt: string | null;
        messageCount: number;
        lastMessage: string | null;
        messages: {
            id: string;
            body: string;
            senderRole: import(".prisma/client").$Enums.Role;
            senderName: string | null;
            attachmentUrl: string | null;
            hasAttachment: boolean;
            createdAt: string;
        }[] | undefined;
    }>;
    getMachines(id: string, authorization?: string): Promise<{
        id: string;
        status: string;
        businessId: string;
        serial: string;
        qrCode: string;
    }[]>;
    createMachine(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        id: string;
        status: string;
        businessId: string;
        serial: string;
        qrCode: string;
    }>;
    getParts(id: string, authorization?: string): Promise<{
        name: string;
        id: string;
        businessId: string;
        partNumber: string;
        machineId: string | null;
    }[]>;
    createPart(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        name: string;
        id: string;
        businessId: string;
        partNumber: string;
        machineId: string | null;
    }>;
    getQaInspections(id: string, authorization?: string): Promise<{
        id: string;
        status: string;
        businessId: string;
        machineId: string;
        notes: string;
        completedAt: Date | null;
    }[]>;
    createQaInspection(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        id: string;
        status: string;
        businessId: string;
        machineId: string;
        notes: string;
        completedAt: Date | null;
    }>;
    getNcrs(id: string, authorization?: string): Promise<{
        description: string;
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        severity: string;
        machineId: string;
    }[]>;
    createNcr(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        description: string;
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        severity: string;
        machineId: string;
    }>;
    getOrders(id: string, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        total: number;
        productName: string;
        quantity: number;
    }[]>;
    createOrder(id: string, body: Record<string, unknown>, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        total: number;
        productName: string;
        quantity: number;
    }>;
    getMobileBookingGroup(id: string, authorization?: string): Promise<any[]>;
    getMobileBookings(page?: string, limit?: string, authorization?: string): Promise<{
        ongoing: any[];
        history: {
            data: any[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    listFamilyMembers(authorization?: string): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        gender: string;
        age: number | null;
        userId: string;
    }[]>;
    getStaffBusySlots(staffId: string, dateStr: string): Promise<{
        start: string;
        end: string;
    }[]>;
    createFamilyMember(authorization: string | undefined, body: CreateFamilyMemberDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        gender: string;
        age: number | null;
        userId: string;
    }>;
    updateFamilyMember(id: string, authorization: string | undefined, body: UpdateFamilyMemberDto): Promise<{
        name: string;
        id: string;
        email: string | null;
        createdAt: Date;
        gender: string;
        age: number | null;
        userId: string;
    }>;
    deleteFamilyMember(id: string, authorization?: string): Promise<{
        ok: boolean;
    }>;
    cancelMobileBooking(id: string, authorization?: string): Promise<{
        cancelled: number;
        ok: boolean;
    }>;
    cancelMobileBookingGroup(authorization?: string, body?: {
        bookingIds?: string[];
    }): Promise<{
        cancelled: number;
        ok: boolean;
    }>;
    payMobileBooking(id: string, authorization?: string, body?: {
        paymentMethod?: string;
    }): Promise<{
        ok: true;
        transactionId: string;
        total: number;
        commissionAmount: number;
        businessCredit: number;
    }>;
    payMobileBookingGroup(authorization?: string, body?: {
        bookingIds: string[];
        paymentMethod?: string;
        businessId?: string;
    }): Promise<{
        ok: true;
        transactionId: string;
        total: number;
        commissionAmount: number;
        businessCredit: number;
    }>;
    payMobileBookingGroupStripe(): Promise<void>;
    completeUserBooking(id: string, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    acceptReschedule(id: string, authorization?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    createMobileBooking(authorization: string | undefined, body: {
        businessId: string;
        serviceId: string;
        date: string;
        staffId?: string;
        familyMemberId?: string;
        paymentMethod?: string;
        bookingGroupId?: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        businessId: string;
        serviceId: string | null;
        customerName: string;
        date: Date;
        paymentMethod: string | null;
        price: number;
        userId: string;
        staffId: string | null;
        familyMemberId: string | null;
        transactionId: string | null;
        taxAmount: number;
        isReviewed: boolean;
        bookingGroupId: string | null;
        reminderSent24h: boolean;
        reminderSent1h: boolean;
    }>;
    getMobileInvoices(page?: string, limit?: string, authorization?: string): Promise<{
        data: {
            id: string;
            bookingId: string | null;
            number: string;
            venueName: string;
            issuedDate: Date;
            subtotal: number;
            amount: number;
            taxAmount: number;
            taxPercentage: number;
            total: number;
            status: string;
            locationLine: string;
            venueImageUrl: string | null;
            paymentMethod: string;
            lines: {
                title: string;
                amount: number;
                professional: string;
            }[];
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMobileVenues(page?: string, limit?: string, search?: string, category?: string, minRating?: string, sortBy?: string, userLat?: string, userLng?: string): Promise<{
        data: {
            id: any;
            businessId: any;
            name: any;
            categoryKey: string;
            categoryKeys: string[];
            rating: string;
            reviews: string;
            price: any;
            lat: any;
            lng: any;
            serviceName: any;
            serviceDurationMinutes: any;
            serviceImageUrl: string;
            imageUrl: string;
            bannerUrl: string | null;
            logoUrl: string | null;
            portfolioImageUrls: string[];
            locationLabel: any;
            distanceLabel: string;
            distance: number;
            ratingNum: number;
            priceNum: any;
            todaySlotTimings: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMobileNotifications(authorization?: string, page?: string, limit?: string): Promise<{
        data: {
            id: string;
            type: string;
            title: string;
            body: string;
            createdAt: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMobileEvents(page?: string, limit?: string): Promise<{
        data: {
            id: string;
            title: string;
            body: string;
            startAt: Date;
            location: string;
            price: number;
            imageKey: string | null;
            websiteUrl: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPublicPlans(): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        price: number;
        billingCycle: string;
        features: string[];
    }[]>;
    getPublicCategories(): Promise<{
        id: string;
        partnerTypeId: string;
        key: string;
        filterParam: string;
        labelEn: string;
        labelEs: string;
        imageUrl: string | null;
        active: boolean;
        sortOrder: number;
        activeBusinessCount: number;
    }[]>;
    getPublicAmenities(): Promise<{
        id: string;
        imageUrl: string | null;
        sortOrder: number;
        key: string;
        labelEn: string;
        labelEs: string;
        descriptionEn: string | null;
        descriptionEs: string | null;
    }[]>;
    createPublicBusinessJoin(body: {
        name: string;
        taxId: string;
        owner: string;
        email: string;
        phone: string;
        address: string;
        categories: string[];
        services: Array<{
            name: string;
            price: number;
            duration: number;
            category?: string;
            imageUrl?: string;
        }>;
        idDocumentImage?: string;
        licenseDocumentImage?: string;
        insuranceDocumentImage?: string;
        password?: string;
        planId?: string;
        latitude?: number | null;
        longitude?: number | null;
        registrationDetails?: Record<string, unknown>;
    }): Promise<{
        id: string;
        merchantNumber: number | null;
        status: string;
        services: number;
    }>;
    getAdminJobs(page?: string, limit?: string, search?: string, authorization?: string): Promise<{
        data: {
            description: string;
            location: string;
            id: string;
            active: boolean;
            createdAt: Date;
            title: string;
            sortOrder: number;
            applyUrl: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createAdminJob(authorization: string | undefined, body: {
        title: string;
        location: string;
        description: string;
        applyUrl?: string;
        sortOrder?: number;
        active?: boolean;
    }): Promise<{
        description: string;
        location: string;
        id: string;
        active: boolean;
        createdAt: Date;
        title: string;
        sortOrder: number;
        applyUrl: string | null;
    }>;
    updateAdminJob(authorization: string | undefined, id: string, body: {
        title?: string;
        location?: string;
        description?: string;
        applyUrl?: string | null;
        sortOrder?: number;
        active?: boolean;
    }): Promise<{
        description: string;
        location: string;
        id: string;
        active: boolean;
        createdAt: Date;
        title: string;
        sortOrder: number;
        applyUrl: string | null;
    }>;
    deleteAdminJob(authorization: string | undefined, id: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getMobileJobs(page?: string, limit?: string): Promise<{
        data: {
            description: string;
            location: string;
            id: string;
            active: boolean;
            createdAt: Date;
            title: string;
            sortOrder: number;
            applyUrl: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMobileFavorites(authorization?: string, userLat?: string, userLng?: string, page?: string, limit?: string, search?: string, category?: string): Promise<{
        data: {
            id: string;
            businessId: string;
            name: string;
            categoryKey: string;
            categoryKeys: string[];
            rating: string;
            reviews: string;
            price: string;
            lat: number;
            lng: number;
            imageUrl: string | null;
            serviceImageUrl: string | null;
            logoUrl: string | null;
            bannerUrl: string | null;
            unsplashImgId: null;
            locationLabel: string;
            distanceLabel: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    addMobileFavorite(authorization: string | undefined, body: {
        businessId: string;
    }): Promise<{
        ok: boolean;
    }>;
    removeMobileFavorite(authorization: string | undefined, businessId: string): Promise<{
        ok: boolean;
    }>;
}
