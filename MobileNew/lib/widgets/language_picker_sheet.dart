import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Supported in-app languages (locale code + translation key for label).
class AppLanguageOption {
  const AppLanguageOption(this.code, this.labelKey);

  final String code;
  final String labelKey;
}

const List<AppLanguageOption> kAppLanguageOptions = [
  AppLanguageOption('en', 'langEnglishUS'),
  AppLanguageOption('es', 'langSpanish'),
];

String languageLabelForCode(String code) {
  for (final o in kAppLanguageOptions) {
    if (o.code == code) return o.labelKey.tr();
  }
  return code.toUpperCase();
}

/// Modal sheet: close (X), centered title, bordered list rows with selected check (reference UI).
Future<String?> showAppLanguagePicker(
  BuildContext context, {
  String? selectedCode,
}) {
  final initial = selectedCode ?? context.locale.languageCode;
  return showModalBottomSheet<String>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) {
      return SafeArea(
        child: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: [
                    Material(
                      color: AppColors.grey25,
                      shape: const CircleBorder(),
                      clipBehavior: Clip.antiAlias,
                      child: IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close_rounded, color: AppColors.grey900, size: 22),
                        padding: const EdgeInsets.all(10),
                        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'selectLanguageTitle'.tr(),
                        textAlign: TextAlign.center,
                        style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
                      ),
                    ),
                    const SizedBox(width: 44),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: Column(
                  children: List.generate(kAppLanguageOptions.length, (i) {
                    final opt = kAppLanguageOptions[i];
                    final selected = opt.code == initial;
                    return Padding(
                      padding: EdgeInsets.only(top: i == 0 ? 0 : 12),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => Navigator.pop(ctx, opt.code),
                          borderRadius: BorderRadius.circular(14),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary50 : AppColors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: selected ? AppColors.primary500 : AppColors.grey200,
                                width: selected ? 1.5 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    opt.labelKey.tr(),
                                    style: AppTypography.body200.copyWith(
                                      color: AppColors.grey900,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                if (selected)
                                  Container(
                                    width: 26,
                                    height: 26,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary500,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.check_rounded, color: AppColors.white, size: 16),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
