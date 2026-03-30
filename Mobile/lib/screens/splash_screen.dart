import 'package:flutter/material.dart';
import 'onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const OnboardingScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
             const Text(
               'rez',
               style: TextStyle(
                 color: Color(0xFFff5a5f),
                 fontSize: 48,
                 fontWeight: FontWeight.w900,
                 letterSpacing: -2,
               ),
             ),
             Stack(
               alignment: Alignment.center,
               children: const [
                 Icon(Icons.access_time_filled, color: Color(0xFFff5a5f), size: 48),
                 Icon(Icons.check, color: Color(0xFF0f2e4a), size: 28),
               ],
             ),
             const Text(
               'rvame',
               style: TextStyle(
                 color: Color(0xFFff5a5f),
                 fontSize: 48,
                 fontWeight: FontWeight.w900,
                 letterSpacing: -2,
               ),
             ),
          ],
        ),
      ),
    );
  }
}
