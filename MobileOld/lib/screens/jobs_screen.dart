import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

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
          'jobsTitle'.tr(),
          style: AppTypography.heading300.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.grey900, AppColors.grey800],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.grey900.withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'jobsWhyWork'.tr(),
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, height: 1.2, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'jobsSub'.tr(),
                    style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'jobsOpenPositions'.tr().toUpperCase(),
              style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 1.5),
            ),
            const SizedBox(height: 24),
            _buildJobCard(context, 'jobTitle1'.tr(), 'jobInfo1'.tr()),
            _buildJobCard(context, 'jobTitle2'.tr(), 'jobInfo2'.tr()),
            _buildJobCard(context, 'jobDesigner'.tr(), 'jobPanamaFull'.tr()),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildJobCard(BuildContext context, String title, String meta) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey50, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.heading300.copyWith(color: AppColors.grey900),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 14, color: AppColors.grey300),
                    const SizedBox(width: 4),
                    Text(
                      meta,
                      style: AppTypography.body100.copyWith(color: AppColors.grey500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 0),
            ),
            child: Text(
              'jobApply'.tr(),
              style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 1),
            ),
          ),
        ],
      ),
    );
  }
}
