import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../models/user_invoice.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/chained_network_image.dart';
import 'invoice_detail_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _repo = ApiRepository();

  late final Future<List<UserInvoice>> _futureInvoices = _repo.fetchInvoices();

  @override
  Widget build(BuildContext context) {
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
          'invoicesMenu'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: FutureBuilder<List<UserInvoice>>(
        future: _futureInvoices,
        builder: (context, snapshot) {
          final items = snapshot.data ?? const <UserInvoice>[];
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          if (items.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text(
                  'invoicesEmpty'.tr(),
                  textAlign: TextAlign.center,
                  style: AppTypography.body200.copyWith(color: AppColors.grey500),
                ),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) => _InvoiceTile(invoice: items[index]),
          );
        },
      ),
    );
  }
}

class _InvoiceTile extends StatelessWidget {
  const _InvoiceTile({required this.invoice});

  final UserInvoice invoice;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push<void>(
            context,
            MaterialPageRoute<void>(builder: (context) => InvoiceDetailScreen(invoice: invoice)),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
            boxShadow: [
              BoxShadow(
                color: AppColors.grey900.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: ChainedNetworkImage(
                  urls: ChainedNetworkImage.chainFrom(invoice.venueImageUrl, null, w: 200),
                  width: 56,
                  height: 56,
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invoice.venueName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.heading200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      invoice.number,
                      style: AppTypography.body100.copyWith(color: AppColors.grey500),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      invoice.issuedDate,
                      style: AppTypography.body100.copyWith(color: AppColors.grey400),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    invoice.total,
                    style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: invoice.statusKey == 'invoicePaid' ? AppColors.success.withValues(alpha: 0.12) : AppColors.primary50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      invoice.statusKey.tr(),
                      style: AppTypography.body100.copyWith(
                        color: invoice.statusKey == 'invoicePaid' ? AppColors.success : AppColors.primary500,
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right_rounded, color: AppColors.grey400, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}
