import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/locale_preferences.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Bottom sheet to switch app language (English / Spanish).
Future<void> showLanguagePickerSheet(BuildContext context) async {
  final current = context.locale.languageCode;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'selectLanguageTitle'.tr(),
              style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
            ),
            const SizedBox(height: 8),
            Text(
              'selectLanguageDescription'.tr(),
              style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
            ),
            const SizedBox(height: 20),
            _LanguageTile(
              label: 'english'.tr(),
              subtitle: 'langEnglishUS'.tr(),
              selected: current == 'en',
              onTap: () => _apply(ctx, const Locale('en')),
            ),
            const SizedBox(height: 10),
            _LanguageTile(
              label: 'spanish'.tr(),
              subtitle: 'langSpanish'.tr(),
              selected: current == 'es',
              onTap: () => _apply(ctx, const Locale('es')),
            ),
          ],
        ),
      ),
    ),
  );
}

Future<void> _apply(BuildContext context, Locale locale) async {
  if (context.locale == locale) {
    Navigator.pop(context);
    return;
  }
  await LocalePreferences.saveLocale(locale);
  if (!context.mounted) return;
  await context.setLocale(locale);
  if (!context.mounted) return;
  Navigator.pop(context);
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({
    required this.label,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primary500.withValues(alpha: 0.08) : AppColors.grey25,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(
                Icons.language_rounded,
                color: selected ? AppColors.primary500 : AppColors.grey500,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTypography.body200.copyWith(
                        color: AppColors.grey900,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: AppTypography.body100.copyWith(color: AppColors.grey500),
                    ),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle_rounded, color: AppColors.primary500, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}
