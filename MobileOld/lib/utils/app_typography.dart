import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  static const String fontFamily = 'Plus Jakarta Sans';

  // Headings
  static TextStyle get heading900 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 32,
        fontWeight: FontWeight.bold,
        height: 48 / 32,
        letterSpacing: -0.02 * 32,
        color: AppColors.grey900,
      );

  static TextStyle get heading800 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 28,
        fontWeight: FontWeight.bold,
        height: 40 / 28,
        letterSpacing: -0.02 * 28,
        color: AppColors.grey900,
      );

  static TextStyle get heading700 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        height: 36 / 24,
        letterSpacing: -0.02 * 24,
        color: AppColors.grey900,
      );

  static TextStyle get heading600 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 20,
        fontWeight: FontWeight.bold,
        height: 32 / 20,
        letterSpacing: -0.02 * 20,
        color: AppColors.grey900,
      );

  static TextStyle get heading500 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 18,
        fontWeight: FontWeight.bold,
        height: 28 / 18,
        letterSpacing: -0.02 * 18,
        color: AppColors.grey900,
      );

  static TextStyle get heading400 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.bold,
        height: 24 / 16,
        letterSpacing: -0.02 * 16,
        color: AppColors.grey900,
      );

  static TextStyle get heading300 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.bold,
        height: 20 / 14,
        letterSpacing: -0.02 * 14,
        color: AppColors.grey900,
      );

  static TextStyle get heading200 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.bold,
        height: 16 / 12,
        letterSpacing: -0.02 * 12,
        color: AppColors.grey900,
      );

  static TextStyle get heading100 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 10,
        fontWeight: FontWeight.bold,
        height: 14 / 10,
        letterSpacing: -0.02 * 10,
        color: AppColors.grey900,
      );

  // Body Text
  static TextStyle get body300 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 16,
        fontWeight: FontWeight.normal,
        height: 24 / 16,
        color: AppColors.grey600,
      );

  static TextStyle get body200 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 14,
        fontWeight: FontWeight.normal,
        height: 20 / 14,
        color: AppColors.grey600,
      );

  static TextStyle get body100 => GoogleFonts.getFont(
        fontFamily,
        fontSize: 12,
        fontWeight: FontWeight.normal,
        height: 16 / 12,
        color: AppColors.grey600,
      );

  // Semantic mappings
  static TextTheme get textTheme => TextTheme(
        displayLarge: heading900,
        displayMedium: heading800,
        displaySmall: heading700,
        headlineLarge: heading600,
        headlineMedium: heading500,
        headlineSmall: heading400,
        titleLarge: heading400,
        titleMedium: heading300,
        titleSmall: heading200,
        bodyLarge: body300,
        bodyMedium: body200,
        bodySmall: body100,
        labelLarge: heading300,
        labelSmall: body100,
      );
}
