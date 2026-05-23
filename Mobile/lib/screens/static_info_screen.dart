import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'customer_service_screen.dart';

class StaticSection {
  const StaticSection({required this.title, required this.content});

  final String title;
  final String content;
}

class StaticInfoScreen extends StatelessWidget {
  const StaticInfoScreen({
    super.key,
    required this.title,
    required this.sections,
  });

  final String title;
  final List<StaticSection> sections;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(title, style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
            ),
            const SizedBox(height: 32),
            ...sections.map(
              (section) => Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.title,
                      style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 0.2),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      section.content,
                      style: AppTypography.body200.copyWith(color: AppColors.grey700),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.grey25,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.grey50),
              ),
              child: Column(
                children: [
                  Icon(Icons.support_agent_rounded, color: AppColors.primary500, size: 32),
                  const SizedBox(height: 16),
                  Text(
                    'staticNeedHelpTitle'.tr(),
                    style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'staticNeedHelpDesc'.tr(),
                    textAlign: TextAlign.center,
                    style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(builder: (context) => const CustomerServiceScreen()),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.grey900,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: Text(
                        'staticContactSupportBtn'.tr(),
                        style: AppTypography.heading200.copyWith(color: AppColors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
