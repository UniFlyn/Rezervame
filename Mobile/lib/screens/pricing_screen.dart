import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class PricingScreen extends StatelessWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'pricingTitle'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'pricingSub'.tr(),
              style: TextStyle(fontSize: 15, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
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
        color: isFeatured ? Colors.white : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(40),
        border: Border.all(
          color: isFeatured ? const Color(0xFFff5a5f) : const Color(0xFFF1F5F9),
          width: isFeatured ? 3 : 1,
        ),
        boxShadow: isFeatured ? [
          BoxShadow(
            color: const Color(0xFFff5a5f).withOpacity(0.12),
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
                    color: const Color(0xFFff5a5f),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'mostPopular'.tr(),
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                  ),
                ),
              ),
            ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFff5a5f), letterSpacing: 1.5),
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    price,
                    style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -1),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8, left: 4),
                    child: Text(
                      period,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.grey.shade400),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              ...features.map((feature) => _buildFeatureItem(feature, isFeatured)).toList(),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isFeatured ? const Color(0xFFff5a5f) : const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: Text(
                    btnText,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, letterSpacing: 1.2),
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
              color: isFeatured ? const Color(0xFFff5a5f).withOpacity(0.1) : Colors.green.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.check,
              size: 14,
              color: isFeatured ? const Color(0xFFff5a5f) : Colors.green,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Colors.grey.shade600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
