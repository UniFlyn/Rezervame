import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'choose_location_screen.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, String>> _onboardingData = [
    {
      'title': 'The world class beauty\nclinic is here',
      'subtitle': 'Refine your skin to its innate beauty with the expertise to achieve the perfect tone.',
      'image': 'assets/onboarding/onboarding_1.png',
    },
    {
      'title': 'Book your beauty salon at\nyour home',
      'subtitle': 'Refine your skin to its innate beauty with the expertise to achieve the perfect tone.',
      'image': 'assets/onboarding/onboarding_2.png',
    },
    {
      'title': 'Your journey to timeless\nbeauty begins here!',
      'subtitle': 'Refine your skin to its innate beauty with the expertise to achieve the perfect tone.',
      'image': 'assets/onboarding/onboarding_3.png',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background Images
          PageView.builder(
            controller: _pageController,
            itemCount: _onboardingData.length,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemBuilder: (context, index) {
              return Stack(
                children: [
                  Positioned.fill(
                    child: Image.asset(
                      _onboardingData[index]['image']!,
                      fit: BoxFit.cover,
                    ),
                  ),
                  // Gradient Overlay
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.0),
                            Colors.black.withValues(alpha: 0.2),
                            Colors.black.withValues(alpha: 0.8),
                            Colors.black,
                          ],
                          stops: const [0.0, 0.4, 0.7, 1.0],
                        ),
                      ),
                    ),
                  ),
                  // Content
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          _onboardingData[index]['title']!,
                          textAlign: TextAlign.center,
                          style: AppTypography.screenTitle.copyWith(
                            color: AppColors.white,
                            height: 1.3,
                            // Match all slides to the third-slide hero title scale.
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.35,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          _onboardingData[index]['subtitle']!,
                          textAlign: TextAlign.center,
                          style: AppTypography.screenSubtitle.copyWith(
                            color: AppColors.grey300,
                            height: 1.75,
                            leadingDistribution: TextLeadingDistribution.even,
                          ),
                        ),
                        // Reserve room above fixed bottom controls (button + footer)
                        const SizedBox(height: 212),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),

          // Bottom Controls
          Positioned(
            bottom: 48,
            left: 24,
            right: 24,
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () {
                      if (_currentPage == _onboardingData.length - 1) {
                        Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(builder: (context) => const ChooseLocationScreen()),
                        );
                      } else {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary500,
                      foregroundColor: AppColors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      _currentPage == _onboardingData.length - 1 ? 'Get Started' : 'Next',
                      style: AppTypography.buttonLarge,
                    ),
                  ),
                ),
                if (_currentPage == _onboardingData.length - 1) ...[
                  const SizedBox(height: 36),
                  GestureDetector(
                    onTap: () => Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (context) => const LoginScreen()),
                    ),
                    child: RichText(
                      text: TextSpan(
                        text: 'Already have an account? ',
                        style: AppTypography.body100.copyWith(color: AppColors.white),
                        children: [
                          TextSpan(
                            text: 'Sign In',
                            style: AppTypography.heading200.copyWith(color: AppColors.primary500),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
