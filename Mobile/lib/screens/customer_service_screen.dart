import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class CustomerServiceScreen extends StatelessWidget {
  const CustomerServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'customerServiceTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'customerServiceSub'.tr(),
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(child: _buildContactCard(context, 'chatSupport'.tr(), Icons.message_rounded, AppColors.primary500)),
                const SizedBox(width: 16),
                Expanded(child: _buildContactCard(context, 'callUs'.tr(), Icons.phone_rounded, AppColors.grey900)),
              ],
            ),
            const SizedBox(height: 48),
            Text(
              'faqTitle'.tr(),
              style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
            ),
            const SizedBox(height: 24),
            _buildFaqItem('faq1Question'.tr(), 'faq1Answer'.tr()),
            _buildFaqItem('faq2Question'.tr(), 'faq2Answer'.tr()),
            _buildFaqItem('faq3Question'.tr(), 'faq3Answer'.tr()),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard(BuildContext context, String title, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey50),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title, style: AppTypography.heading100.copyWith(color: AppColors.grey900)),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ExpansionTile(
        title: Text(question, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(answer, style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5)),
          ),
        ],
      ),
    );
  }
}
