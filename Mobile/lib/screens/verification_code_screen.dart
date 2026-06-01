import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/password_reset_constants.dart';
import 'new_password_screen.dart';

class VerificationCodeScreen extends StatefulWidget {
  const VerificationCodeScreen({super.key, required this.email});

  final String email;

  @override
  State<VerificationCodeScreen> createState() => _VerificationCodeScreenState();
}

class _VerificationCodeScreenState extends State<VerificationCodeScreen> {
  final List<String> _digits = List.filled(passwordResetCodeLength, '');
  int _activeIndex = 0;
  int _secondsLeft = 56;
  Timer? _timer;
  bool _verifying = false;
  final _api = ApiRepository();

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  String get _code => _digits.join();

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_secondsLeft > 0) {
        setState(() => _secondsLeft--);
      } else {
        _timer?.cancel();
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _submitCode() async {
    if (_code.length < passwordResetCodeLength || _verifying) return;
    setState(() => _verifying = true);
    try {
      await _api.verifyPasswordResetCode(widget.email, _code);
      if (!mounted) return;
      await Navigator.push<void>(
        context,
        MaterialPageRoute<void>(
          builder: (context) => NewPasswordScreen(email: widget.email, code: _code),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.error,
        ),
      );
      setState(() {
        for (var i = 0; i < passwordResetCodeLength; i++) {
          _digits[i] = '';
        }
        _activeIndex = 0;
      });
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  void _onKeyTap(String key) {
    if (_verifying) return;
    if (key == 'back') {
      if (_digits[_activeIndex].isNotEmpty) {
        setState(() => _digits[_activeIndex] = '');
      } else if (_activeIndex > 0) {
        setState(() {
          _activeIndex--;
          _digits[_activeIndex] = '';
        });
      }
      return;
    }
    if (key.length == 1 && RegExp(r'[0-9]').hasMatch(key)) {
      setState(() {
        _digits[_activeIndex] = key;
        if (_activeIndex < passwordResetCodeLength - 1) _activeIndex++;
      });
      if (_digits.every((d) => d.isNotEmpty)) {
        Future<void>.delayed(const Duration(milliseconds: 200), _submitCode);
      }
    }
  }

  Future<void> _resend() async {
    try {
      await _api.requestPasswordReset(widget.email);
      if (!mounted) return;
      setState(() {
        _secondsLeft = 56;
        for (var i = 0; i < passwordResetCodeLength; i++) {
          _digits[i] = '';
        }
        _activeIndex = 0;
      });
      _startTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Verification code sent')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Enter Verification Code',
                      style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'authVerificationBody'.tr(),
                      style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.email,
                      style: AppTypography.body200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: List.generate(
                        passwordResetCodeLength,
                        (index) => Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(right: index < passwordResetCodeLength - 1 ? 8 : 0),
                            child: _buildOtpCell(index),
                          ),
                        ),
                      ),
                    ),
                    if (kDebugMode) ...[
                      const SizedBox(height: 12),
                      Text(
                        'Developer bypass: $passwordResetDevBypass',
                        style: AppTypography.body100.copyWith(color: AppColors.grey400),
                      ),
                    ],
                    if (_verifying) ...[
                      const SizedBox(height: 24),
                      const Center(child: CircularProgressIndicator(color: AppColors.primary500)),
                    ],
                    const SizedBox(height: 28),
                    if (_secondsLeft > 0)
                      RichText(
                        text: TextSpan(
                          style: AppTypography.body200.copyWith(color: AppColors.grey500),
                          children: [
                            const TextSpan(text: 'You can resend the code in '),
                            TextSpan(
                              text: '$_secondsLeft',
                              style: AppTypography.body200.copyWith(
                                color: AppColors.primary500,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const TextSpan(text: ' seconds'),
                          ],
                        ),
                      ),
                    if (_secondsLeft > 0) const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton(
                        onPressed: _secondsLeft > 0 ? null : _resend,
                        style: TextButton.styleFrom(padding: EdgeInsets.zero),
                        child: Text(
                          'Resend Code',
                          style: AppTypography.heading200.copyWith(
                            color: _secondsLeft > 0 ? AppColors.grey300 : AppColors.primary500,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            _buildNumericKeypad(),
          ],
        ),
      ),
    );
  }

  Widget _buildOtpCell(int index) {
    final active = _activeIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _activeIndex = index),
      child: Container(
        height: 56,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active ? AppColors.primary500 : AppColors.grey200,
            width: active ? 2 : 1,
          ),
        ),
        child: Text(
          _digits[index],
          style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
        ),
      ),
    );
  }

  Widget _buildNumericKeypad() {
    Widget keyCell(String label, {bool back = false}) {
      return Material(
        color: AppColors.grey25,
        child: InkWell(
          onTap: () => _onKeyTap(back ? 'back' : label),
          child: SizedBox(
            height: 56,
            child: Center(
              child: back
                  ? Icon(Icons.backspace_outlined, color: AppColors.grey700, size: 22)
                  : Text(
                      label,
                      style: AppTypography.screenTitle.copyWith(color: AppColors.grey900),
                    ),
            ),
          ),
        ),
      );
    }

    Widget row(List<String> keys) {
      return SizedBox(
        height: 56,
        child: Row(
          children: [
            for (final k in keys)
              Expanded(
                child: k == 'back'
                    ? keyCell('', back: true)
                    : k.isEmpty
                        ? ColoredBox(color: AppColors.grey25, child: const SizedBox.expand())
                        : keyCell(k),
              ),
          ],
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.grey25,
        border: Border(top: BorderSide(color: AppColors.grey100)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            row(['1', '2', '3']),
            Divider(height: 1, thickness: 1, color: AppColors.grey100),
            row(['4', '5', '6']),
            Divider(height: 1, thickness: 1, color: AppColors.grey100),
            row(['7', '8', '9']),
            Divider(height: 1, thickness: 1, color: AppColors.grey100),
            row(['', '0', 'back']),
          ],
        ),
      ),
    );
  }
}
