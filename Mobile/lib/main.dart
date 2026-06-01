import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'data/api_config.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'data/api_repository.dart';
import 'data/locale_preferences.dart';
import 'utils/app_colors.dart';
import 'utils/app_typography.dart';
import 'screens/splash_screen.dart';
import 'screens/main_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('en_US', null);
  await initializeDateFormatting('es_ES', null);
  await EasyLocalization.ensureInitialized();
  if (kDebugMode) {
    debugPrint('Rezervame API: ${resolveApiBaseUrl()}');
  }
  final savedLocale = await LocalePreferences.loadSavedLocale();
  try {
    await ApiRepository().bootstrapMobileData();
  } catch (e, st) {
    debugPrint('bootstrapMobileData failed (is the backend running?): $e');
    debugPrint('$st');
  }
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('es')],
      path: 'assets/translations',
      startLocale: savedLocale ?? const Locale('en'),
      fallbackLocale: const Locale('en'),
      child: const RezervemeApp(),
    ),
  );
}

class RezervemeApp extends StatelessWidget {
  const RezervemeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      key: ValueKey(context.locale.toString()),
      debugShowCheckedModeBanner: false,
      title: 'Rezerveme',
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.white,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary500,
          primary: AppColors.primary500,
          surface: AppColors.white,
        ),
        appBarTheme: AppBarTheme(
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.grey900,
          titleTextStyle: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
        textTheme: TextTheme(
          displayLarge: AppTypography.heading600,
          displayMedium: AppTypography.screenTitle,
          displaySmall: AppTypography.sectionTitle,
          headlineMedium: AppTypography.appBarTitle,
          headlineSmall: AppTypography.heading200,
          titleLarge: AppTypography.appBarTitle,
          titleMedium: AppTypography.sectionTitle,
          titleSmall: AppTypography.heading200,
          bodyLarge: AppTypography.body300,
          bodyMedium: AppTypography.screenSubtitle,
          bodySmall: AppTypography.body100,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary500,
            foregroundColor: AppColors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: AppTypography.buttonLarge,
          ),
        ),
      ),
      home: const SplashScreen(),
      routes: {
        '/main': (context) => const MainScreen(),
      },
    );
  }
}
