import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class HowItWorksScreen extends StatelessWidget {
  const HowItWorksScreen({super.key});

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
          'howItWorksTitle'.tr(),
          style: AppTypography.heading300.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'howItWorksSub'.tr(),
              style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
            ),
            const SizedBox(height: 48),
            _buildStep(
              context,
              '1',
              'howItWorksStep1Title'.tr(),
              'howItWorksStep1Desc'.tr(),
              Icons.search_rounded,
              AppColors.primary500,
              AppColors.primary500.withOpacity(0.2),
            ),
            _buildStep(
              context,
              '2',
              'howItWorksStep2Title'.tr(),
              'howItWorksStep2Desc'.tr(),
              Icons.calendar_today_rounded,
              AppColors.grey900,
              AppColors.grey900.withOpacity(0.1),
            ),
            _buildStep(
              context,
              '3',
              'howItWorksStep3Title'.tr(),
              'howItWorksStep3Desc'.tr(),
              Icons.check_circle_outline_rounded,
              AppColors.success,
              AppColors.success.withOpacity(0.2),
            ),
            const SizedBox(height: 16),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'howItWorksBenefitsTitle'.tr().toUpperCase(),
                    style: AppTypography.heading100.copyWith(color: AppColors.grey900, letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 24),
                  _buildBenefit('howItWorksBenefit1'.tr()),
                  _buildBenefit('howItWorksBenefit2'.tr()),
                  _buildBenefit('howItWorksBenefit3'.tr()),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStep(BuildContext context, String num, String title, String desc, IconData icon, Color color, Color shadowColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 48),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: shadowColor,
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 36),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$num. $title'.toUpperCase(),
                  style: AppTypography.heading300.copyWith(color: AppColors.grey900, letterSpacing: -0.5),
                ),
                const SizedBox(height: 10),
                Text(
                  desc,
                  style: AppTypography.body100.copyWith(color: AppColors.grey500, height: 1.6),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefit(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, color: AppColors.grey700, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
