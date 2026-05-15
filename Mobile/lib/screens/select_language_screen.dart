import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/language_picker_sheet.dart';
import 'onboarding_screen.dart';

/// Onboarding step: progress bar, title, dropdown-style field opening the same sheet as Profile.
class SelectLanguageScreen extends StatefulWidget {
  const SelectLanguageScreen({super.key});

  @override
  State<SelectLanguageScreen> createState() => _SelectLanguageScreenState();
}

class _SelectLanguageScreenState extends State<SelectLanguageScreen> {
  late String _selectedCode;

  @override
  void initState() {
    super.initState();
    _selectedCode = context.locale.languageCode;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Material(
            color: AppColors.grey25,
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: IconButton(
              onPressed: () => Navigator.maybePop(context),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 18),
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: 0.33,
                        minHeight: 4,
                        backgroundColor: AppColors.grey100,
                        color: AppColors.primary500,
                      ),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      'selectYourLanguageTitle'.tr(),
                      style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'selectLanguageDescription'.tr(),
                      style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                    ),
                    const SizedBox(height: 28),
                    Text(
                      'language'.tr(),
                      style: AppTypography.body200.copyWith(color: AppColors.grey700, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 10),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () async {
                          final code = await showAppLanguagePicker(context, selectedCode: _selectedCode);
                          if (!mounted) return;
                          if (code != null) setState(() => _selectedCode = code);
                        },
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                          decoration: BoxDecoration(
                            color: AppColors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.grey200),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  languageLabelForCode(_selectedCode),
                                  style: AppTypography.body200.copyWith(
                                    color: AppColors.grey900,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.grey400.withValues(alpha: 0.9)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    context.setLocale(Locale(_selectedCode));
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute<void>(builder: (context) => const OnboardingScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('continueAction'.tr(), style: AppTypography.buttonLarge),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
