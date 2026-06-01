"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessPanelController = void 0;
const common_1 = require("@nestjs/common");
const auth_helpers_1 = require("../auth.helpers");
const prisma_service_1 = require("../prisma.service");
const business_panel_service_1 = require("./business-panel.service");
let BusinessPanelController = class BusinessPanelController {
    constructor(prisma, panel) {
        this.prisma = prisma;
        this.panel = panel;
    }
    async dashboard(businessId, period = 'week', authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, businessId);
        const p = period === 'day' || period === 'week' || period === 'month' ? period : 'week';
        return this.panel.getDashboard(businessId, p);
    }
    async menu(businessId, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, businessId);
        return this.panel.getPanelMenu(businessId);
    }
    async customers(businessId, page, limit, search, authorization) {
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, businessId);
        return this.panel.getCustomers(businessId, page, limit, search);
    }
    async bulkCompleteBookings(id, body, authorization) {
        console.log(`[bulkComplete] businessId=${id}, bookings=${body.bookingIds}`);
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return await this.prisma.booking.updateMany({
            where: {
                id: { in: body.bookingIds },
                businessId: id,
                OR: [
                    { status: 'Paid' },
                    { transactionId: { not: null } }
                ]
            },
            data: { status: 'Completed' },
        });
    }
    async bulkUpdateBookingStatus(id, body, authorization) {
        console.log(`[bulkStatus] businessId=${id}, bookings=${body.bookingIds}, status=${body.status}`);
        await (0, auth_helpers_1.requireBusinessOwner)(this.prisma, authorization, id);
        return await this.prisma.booking.updateMany({
            where: { id: { in: body.bookingIds }, businessId: id },
            data: { status: body.status },
        });
    }
};
exports.BusinessPanelController = BusinessPanelController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessPanelController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('menu'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BusinessPanelController.prototype, "menu", null);
__decorate([
    (0, common_1.Get)('customers'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BusinessPanelController.prototype, "customers", null);
__decorate([
    (0, common_1.Patch)('bookings/bulk-complete'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], BusinessPanelController.prototype, "bulkCompleteBookings", null);
__decorate([
    (0, common_1.Patch)('bookings/bulk-status'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], BusinessPanelController.prototype, "bulkUpdateBookingStatus", null);
exports.BusinessPanelController = BusinessPanelController = __decorate([
    (0, common_1.Controller)('api/business/:businessId/panel'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        business_panel_service_1.BusinessPanelService])
], BusinessPanelController);
//# sourceMappingURL=business-panel.controller.js.map