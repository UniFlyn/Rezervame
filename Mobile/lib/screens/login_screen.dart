import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'main_screen.dart';
import 'forgot_password_screen.dart';

enum _AuthStep { email, password, signup }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  _AuthStep _step = _AuthStep.email;
  bool _isPasswordVisible = false;
  bool _loading = false;
  final _api = ApiRepository();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _finishAuth() async {
    await _api.bootstrapMobileData();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const MainScreen()),
      (route) => false,
    );
  }

  Future<void> _checkEmail() async {
    final email = _emailController.text.trim().toLowerCase();
    if (email.isEmpty) {
      _showError('Please enter your email.');
      return;
    }
    setState(() => _loading = true);
    try {
      final exists = await _api.checkEmailExists(email);
      if (!mounted) return;
      setState(() {
        _step = exists ? _AuthStep.password : _AuthStep.signup;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  Future<void> _login() async {
    setState(() => _loading = true);
    final ok = await _api.login(_emailController.text.trim(), _passwordController.text);
    if (!mounted) return;
    if (ok) {
      await _finishAuth();
    } else {
      setState(() => _loading = false);
      _showError('Invalid email or password.');
    }
  }

  Future<void> _register() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      _showError('Please enter your name.');
      return;
    }
    if (_passwordController.text.length < 6) {
      _showError('Password must be at least 6 characters.');
      return;
    }
    setState(() => _loading = true);
    try {
      final ok = await _api.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        name: name,
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      );
      if (!mounted) return;
      if (ok) {
        await _finishAuth();
      } else {
        setState(() => _loading = false);
        _showError('Registration failed.');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _showError(e.toString().replaceAll('Exception: ', ''));
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

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
                child: Image.asset('assets/logo/logo_square.png', height: 120, width: 120),
              ),
              const SizedBox(height: 48),
              Text(
                _step == _AuthStep.signup ? 'Create Account' : 'Welcome Back!',
                style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
              ),
              const SizedBox(height: 8),
              Text(
                _step == _AuthStep.signup
                    ? 'Sign up to get started on your beauty journey.'
                    : _step == _AuthStep.password
                        ? 'Enter your password to continue.'
                        : 'Log in or sign up with your email.',
                style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
              ),
              const SizedBox(height: 32),
              if (_step != _AuthStep.email) ...[
                _buildLabel('Email'),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _emailController,
                  hintText: 'name@email.com',
                  prefixIcon: Icons.email_outlined,
                  readOnly: true,
                ),
                const SizedBox(height: 20),
              ],
              if (_step == _AuthStep.email) ...[
                _buildLabel('Email'),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _emailController,
                  hintText: 'name@email.com',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
              ],
              if (_step == _AuthStep.signup) ...[
                _buildLabel('Full Name'),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _nameController,
                  hintText: 'John Doe',
                  prefixIcon: Icons.person_outline,
                ),
                const SizedBox(height: 20),
                _buildLabel('Phone (optional)'),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _phoneController,
                  hintText: '+507 6000-0000',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 20),
              ],
              if (_step == _AuthStep.password || _step == _AuthStep.signup) ...[
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
              ],
              if (_step == _AuthStep.password) ...[
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () {
                            Navigator.push<void>(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => ForgotPasswordScreen(
                                  initialEmail: _emailController.text.trim(),
                                ),
                              ),
                            );
                          },
                    child: Text(
                      'forgotPass'.tr(),
                      style: AppTypography.heading200.copyWith(color: AppColors.primary500),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _loading
                      ? null
                      : () async {
                          FocusScope.of(context).unfocus();
                          switch (_step) {
                            case _AuthStep.email:
                              await _checkEmail();
                            case _AuthStep.password:
                              await _login();
                            case _AuthStep.signup:
                              await _register();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _step == _AuthStep.email
                              ? 'Continue'
                              : _step == _AuthStep.signup
                                  ? 'Sign Up'
                                  : 'Log In',
                          style: AppTypography.buttonLarge,
                        ),
                ),
              ),
              if (_step != _AuthStep.email) ...[
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () => setState(() {
                              _step = _AuthStep.email;
                              _passwordController.clear();
                            }),
                    child: Text(
                      'Use a different email',
                      style: AppTypography.heading200.copyWith(color: AppColors.primary500),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(text, style: AppTypography.heading200.copyWith(color: AppColors.grey900));
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    bool isPassword = false,
    bool isPasswordVisible = false,
    VoidCallback? onVisibilityToggle,
    bool readOnly = false,
    TextInputType? keyboardType,
  }) {
    return TextField(
      controller: controller,
      readOnly: readOnly,
      keyboardType: keyboardType,
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
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
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
}
