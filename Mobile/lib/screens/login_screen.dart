import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/mock_auth.dart';
import 'main_navigation.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.scaffoldBackground,
      appBar: AppBar(
        backgroundColor: AppColors.scaffoldBackground,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () {
            mainNavigationNotifier.value = 3; // Set to Profile tab
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const MainNavigation()),
              (route) => false,
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            Center(
              child: Image.asset(
                'assets/logo.png',
                height: 120,
                fit: BoxFit.contain,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'signupSub'.tr(),
              style: AppTypography.body100.copyWith(color: AppColors.grey500),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            Text('btnSignIn'.tr(), style: AppTypography.heading600),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                icon: Image.network('https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png', width: 20),
                label: Text('contGoogle'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.grey900)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.grey100),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {},
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.facebook, color: Colors.blue),
                label: Text('contFacebook'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.grey900)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.grey100),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {},
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: Divider(color: Colors.grey.shade300)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text('o', style: AppTypography.body100.copyWith(color: AppColors.grey300)),
                ),
                Expanded(child: Divider(color: AppColors.grey100)),
              ],
            ),
            const SizedBox(height: 24),
            TextField(
              decoration: InputDecoration(
                hintText: 'email'.tr(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                hintText: 'password'.tr(),
              ),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                'forgotPass'.tr(),
                style: AppTypography.heading300.copyWith(color: AppColors.primary500),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                onPressed: () {
                  mockAuthNotifier.value = true;
                  mainNavigationNotifier.value = 0; // Default to Home after login
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const MainNavigation()),
                    (route) => false,
                  );
                },
                child: Text('btnSignIn'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.white)),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'termsAgree'.tr(),
              textAlign: TextAlign.center,
              style: AppTypography.body100.copyWith(color: AppColors.grey400, height: 1.5),
            )
          ],
        ),
      ),
    );
  }
}
