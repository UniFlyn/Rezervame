import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../models/user_invoice.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';

class InvoiceDetailScreen extends StatelessWidget {
  const InvoiceDetailScreen({super.key, required this.invoice});

  final UserInvoice invoice;

  @override
  Widget build(BuildContext context) {
    final loc = invoice.locationLine;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'invoiceDetailTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: ChainedNetworkImage(
                urls: ChainedNetworkImage.urlsForUnsplashId(invoice.unsplashId, w: 800),
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Text(
                    invoice.venueName,
                    style: AppTypography.heading300.copyWith(color: AppColors.grey900),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: invoice.statusKey == 'invoicePaid' ? AppColors.success.withValues(alpha: 0.12) : AppColors.primary50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    invoice.statusKey.tr(),
                    style: AppTypography.body100.copyWith(
                      color: invoice.statusKey == 'invoicePaid' ? AppColors.success : AppColors.primary500,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _detailRow('invoiceNumberLabel'.tr(), invoice.number),
            _detailRow('invoiceIssued'.tr(), invoice.issuedDate),
            if (loc != null && loc.isNotEmpty) _detailRow('location'.tr(), loc),
            const SizedBox(height: 24),
            Text(
              'servicesContracted'.tr(),
              style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.0),
            ),
            const SizedBox(height: 12),
            ...invoice.lines.map(
              (line) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(line.title, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                    ),
                    Text(
                      line.amount,
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 32, color: AppColors.grey100),
            _moneyRow('invoiceSubtotal'.tr(), invoice.subtotal, emphasize: false),
            const SizedBox(height: 8),
            _moneyRow('invoiceTax'.tr(), invoice.tax, emphasize: false),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.grey25,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.grey100),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('totalLabel'.tr(), style: AppTypography.heading300.copyWith(color: AppColors.grey900)),
                  Text(
                    invoice.total,
                    style: AppTypography.heading400.copyWith(color: AppColors.primary500),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('invoiceDownloadStarted'.tr()),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              icon: const Icon(Icons.download_outlined, color: AppColors.primary500, size: 20),
              label: Text('invoiceDownloadPdf'.tr(), style: AppTypography.buttonMedium.copyWith(color: AppColors.primary500)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.primary500),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: AppTypography.body100.copyWith(color: AppColors.grey500, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            child: Text(value, style: AppTypography.body200.copyWith(color: AppColors.grey900)),
          ),
        ],
      ),
    );
  }

  Widget _moneyRow(String label, String value, {required bool emphasize}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTypography.body200.copyWith(color: AppColors.grey500),
        ),
        Text(
          value,
          style: emphasize
              ? AppTypography.heading300.copyWith(color: AppColors.grey900)
              : AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}
