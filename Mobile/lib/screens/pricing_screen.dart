import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

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
          'pricingTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'pricingSub'.tr(),
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
            ),
            const SizedBox(height: 48),
            _buildPricingCard(
              context, 
              'pricingPlanBasic'.tr(), 
              'pricingPriceFree'.tr(), 
              'pricingPerMonth'.tr(),
              [
                'pricingFeatureFree1'.tr(),
                'pricingFeatureFree2'.tr(),
                'pricingFeatureFree3'.tr(),
              ],
              'pricingStartFree'.tr(),
              false
            ),
            const SizedBox(height: 16),
            _buildPricingCard(
              context, 
              'pricingPlanPremium'.tr(), 
              'pricingPricePremium'.tr(), 
              'pricingPerMonth'.tr(),
              [
                'pricingFeaturePremium1'.tr(),
                'pricingFeaturePremium2'.tr(),
                'pricingFeaturePremium3'.tr(),
                'pricingFeaturePremium4'.tr(),
              ],
              'pricingActivatePremium'.tr(),
              true
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context, String title, String price, String period, List<String> features, String btnText, bool isFeatured) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: isFeatured ? AppColors.white : AppColors.grey25,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isFeatured ? AppColors.primary500 : AppColors.grey50,
          width: isFeatured ? 2 : 1,
        ),
        boxShadow: isFeatured ? [
          BoxShadow(
            color: AppColors.primary500.withValues(alpha: 0.12),
            blurRadius: 30,
            offset: const Offset(0, 15),
          )
        ] : [],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          if (isFeatured)
            Positioned(
              top: -55,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primary500,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'mostPopular'.tr(),
                    style: AppTypography.heading100.copyWith(color: AppColors.white, letterSpacing: 0.2),
                  ),
                ),
              ),
            ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 0.2),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    price,
                    style: AppTypography.heading500.copyWith(color: AppColors.grey900),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, left: 4),
                    child: Text(
                      period,
                      style: AppTypography.heading100.copyWith(color: AppColors.grey400),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              ...features.map((feature) => _buildFeatureItem(feature, isFeatured)),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isFeatured ? AppColors.primary500 : AppColors.grey900,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    btnText,
                    style: AppTypography.heading200.copyWith(color: AppColors.white, letterSpacing: 0.2),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureItem(String text, bool isFeatured) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isFeatured ? AppColors.primary500.withValues(alpha: 0.1) : Colors.green.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check,
              size: 14,
              color: isFeatured ? AppColors.primary500 : Colors.green,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, color: AppColors.grey600),
            ),
          ),
        ],
      ),
    );
  }
}
