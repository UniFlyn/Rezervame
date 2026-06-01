import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key, this.platformName});

  final String? platformName;

  @override
  Widget build(BuildContext context) {
    final name = platformName?.trim().isNotEmpty == true ? platformName!.trim() : 'Rezervame';
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primary500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.build_rounded, size: 40, color: AppColors.primary500),
              ),
              const SizedBox(height: 28),
              Text(
                'maintenanceTitle'.tr(),
                textAlign: TextAlign.center,
                style: AppTypography.screenTitle,
              ),
              const SizedBox(height: 12),
              Text(
                'maintenanceBody'.tr(namedArgs: {'platform': name}),
                textAlign: TextAlign.center,
                style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
