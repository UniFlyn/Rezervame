import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'signup_screen.dart';
import 'forgot_password_screen.dart';
import 'main_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Image.asset(
                  'assets/logo/logo_square.png',
                  height: 120,
                  width: 120,
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'Welcome Back!',
                style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
              ),
              const SizedBox(height: 8),
              Text(
                'Log in to your account and continue your beauty journey.',
                style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
              ),
              const SizedBox(height: 32),
              _buildLabel('Email'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _emailController,
                hintText: 'name@email.com',
                prefixIcon: Icons.email_outlined,
              ),
              const SizedBox(height: 20),
              _buildLabel('Password'),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _passwordController,
                hintText: 'Enter your password',
                prefixIcon: Icons.lock_outline,
                isPassword: true,
                isPasswordVisible: _isPasswordVisible,
                onVisibilityToggle: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const ForgotPasswordScreen()),
                    );
                  },
                  child: Text(
                    'Forgot Password?',
                    style: AppTypography.heading200.copyWith(color: AppColors.primary500),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => const MainScreen()),
                      (route) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    'Log In',
                    style: AppTypography.buttonLarge,
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Center(
                child: Text(
                  'Or continue with',
                  style: AppTypography.body100.copyWith(color: AppColors.grey400),
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildSocialButton(Icons.g_mobiledata, 'Google'),
                  const SizedBox(width: 16),
                  _buildSocialButton(Icons.apple, 'Apple'),
                  const SizedBox(width: 16),
                  _buildSocialButton(Icons.facebook, 'Facebook'),
                ],
              ),
              const SizedBox(height: 48),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account?",
                    style: AppTypography.body200.copyWith(color: AppColors.grey500),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SignUpScreen()),
                      );
                    },
                    child: Text(
                      'Sign Up',
                      style: AppTypography.heading300.copyWith(color: AppColors.primary500),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: AppTypography.heading200.copyWith(color: AppColors.grey900),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    bool isPassword = false,
    bool isPasswordVisible = false,
    VoidCallback? onVisibilityToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword && !isPasswordVisible,
      style: AppTypography.body300.copyWith(color: AppColors.grey900),
      decoration: InputDecoration(
        filled: true,
        fillColor: AppColors.grey25,
        hintText: hintText,
        hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
        prefixIcon: Icon(prefixIcon, color: AppColors.grey400, size: 20),
        suffixIcon: isPassword
            ? IconButton(
                onPressed: onVisibilityToggle,
                icon: Icon(
                  isPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: AppColors.grey400,
                  size: 20,
                ),
              )
            : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.grey100, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary500, width: 2),
        ),
      ),
    );
  }

  Widget _buildSocialButton(IconData icon, String label) {
    return Expanded(
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.grey100),
        ),
        child: Center(
          child: Icon(icon, size: 32, color: AppColors.grey900),
        ),
      ),
    );
  }
}
