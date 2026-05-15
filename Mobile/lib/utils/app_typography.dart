import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Manrope-based type scale for MobileNew.
///
/// **Top bars:** [appBarTitle] is for Scaffold [AppBar] / [SliverAppBar] titles and matching
/// custom header rows (**20px / w700**).
///
/// **In-page titles:** [homeSectionTitle], [navigationTitle], [screenTitle], and [sectionTitle]
/// stay **16px / w700** (row headers, cards that reuse the old bar size, body headlines).
/// [heading400]–[heading600] are also **16px** (heavier weight / spacing).
///
/// Prefer semantic tiers for UI copy:
/// - [appBarTitle] — toolbar / top header text only.
/// - [navigationTitle] / [screenTitle] / [sectionTitle] / [homeSectionTitle] — 16px headline tier.
/// - [screenSubtitle] — supporting line under a title (14 w500).
/// - [contentBody] / [contentCaption] — paragraph and helper text.
class AppTypography {
  static const String fontFamily = 'Manrope';

  // --- Scale (building blocks; max 16px for headline-style text) ---

  static TextStyle get heading100 => GoogleFonts.manrope(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: 0.1,
      );

  static TextStyle get heading200 => GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: 0.1,
      );

  static TextStyle get heading300 => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: 0.1,
      );

  /// Same pixel size as [homeSectionTitle]; slightly heavier for inline emphasis (prices, buttons on cards).
  static TextStyle get heading400 => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.15,
      );

  /// Same cap as row headers; use for numeric emphasis (totals, large prices in cards).
  static TextStyle get heading500 => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.25,
      );

  /// Same cap; strongest weight for rare display-style lines at 16px.
  static TextStyle get heading600 => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.35,
      );

  static TextStyle get body100 => GoogleFonts.manrope(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );

  static TextStyle get body200 => GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );

  static TextStyle get body300 => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );

  static TextStyle get bodyLarge => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.5,
      );

  static TextStyle get buttonLarge => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        height: 1.2,
      );

  static TextStyle get buttonMedium => GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w800,
        height: 1.2,
      );

  static TextStyle get buttonSmall => GoogleFonts.manrope(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        height: 1.2,
      );

  // --- Semantic (Home "Service Categories" row = max in-page title tier) ---

  /// Row headers on Home: Categories, Nearby, Top services, etc. **Canonical 16 / w700.**
  static TextStyle get homeSectionTitle => GoogleFonts.manrope(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: 0,
      );

  /// Scaffold app bar, sliver bar titles, and sheet/map header rows. **20 / w700.**
  static TextStyle get appBarTitle => GoogleFonts.manrope(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        height: 1.2,
        letterSpacing: -0.2,
      );

  /// Same pixel size as [homeSectionTitle] (legacy name; list/card lines may use this).
  static TextStyle get navigationTitle => homeSectionTitle;

  /// Page headline — same as [homeSectionTitle].
  static TextStyle get screenTitle => homeSectionTitle;

  /// In-page section headers — same as [homeSectionTitle].
  static TextStyle get sectionTitle => homeSectionTitle;

  /// Line under [screenTitle] / [appBarTitle]; pair with [AppColors.grey500] unless inverted.
  static TextStyle get screenSubtitle => GoogleFonts.manrope(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.45,
        letterSpacing: 0.05,
      );

  /// Primary body copy (descriptions, paragraphs).
  static TextStyle get contentBody => body200;

  /// Secondary / helper copy (hints, captions).
  static TextStyle get contentCaption => body100;
}
