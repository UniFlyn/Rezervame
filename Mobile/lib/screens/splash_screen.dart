import 'package:flutter/material.dart';
import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../utils/app_colors.dart';
import 'onboarding_screen.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  void _navigateToNext() async {
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    try {
      await ApiRepository().bootstrapMobileData();
    } catch (e, st) {
      debugPrint('bootstrapMobileData failed (is the backend running?): $e');
      debugPrint('$st');
    }

    final token = await AuthSession.getToken();
    if (!mounted) return;

    var hasValidSession = token != null && token.isNotEmpty;
    if (hasValidSession) {
      final profile = await ApiRepository().fetchUserSession();
      if (!mounted) return;
      if (profile == null) {
        await AuthSession.setToken(null);
        hasValidSession = false;
      }
    }

    if (!mounted) return;

    if (hasValidSession) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute<void>(builder: (context) => const MainScreen()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute<void>(builder: (context) => const OnboardingScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/logo/logo_square.png',
              width: 180,
              height: 180,
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary500),
              strokeWidth: 2,
            ),
          ],
        ),
      ),
    );
  }
}
