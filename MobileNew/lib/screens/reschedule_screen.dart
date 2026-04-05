import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Request a new time — reason dropdown + message (reference “Reschedule” flow).
class RescheduleScreen extends StatefulWidget {
  const RescheduleScreen({super.key, this.venueName});

  final String? venueName;

  static const List<String> _reasonKeys = [
    'rescheduleReasonConflict',
    'rescheduleReasonPersonal',
    'rescheduleReasonPreferTime',
    'rescheduleReasonOther',
  ];

  @override
  State<RescheduleScreen> createState() => _RescheduleScreenState();
}

class _RescheduleScreenState extends State<RescheduleScreen> {
  final TextEditingController _message = TextEditingController();
  static const int _maxMessage = 200;
  String? _reasonKey;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  InputBorder _fieldBorder() {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.grey100),
    );
  }

  void _onContinue() {
    if (_reasonKey == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('rescheduleReasonRequired'.tr(), style: AppTypography.body200.copyWith(color: AppColors.white)),
          backgroundColor: AppColors.grey900,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('rescheduleRequestSent'.tr(), style: AppTypography.body200.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Center(
            child: Material(
              color: AppColors.grey25,
              shape: const CircleBorder(),
              clipBehavior: Clip.antiAlias,
              child: IconButton(
                padding: EdgeInsets.zero,
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.grey900),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ),
        title: Text(
          'rescheduleTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'rescheduleReasonSection'.tr(),
                    style: AppTypography.heading300.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'rescheduleSelectReason'.tr(),
                    style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    key: ValueKey<String?>(_reasonKey),
                    initialValue: _reasonKey,
                    hint: Text(
                      'rescheduleReasonPlaceholder'.tr(),
                      style: AppTypography.body200.copyWith(color: AppColors.grey400),
                    ),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppColors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      enabledBorder: _fieldBorder(),
                      focusedBorder: _fieldBorder().copyWith(
                        borderSide: const BorderSide(color: AppColors.grey300),
                      ),
                      border: _fieldBorder(),
                    ),
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.grey600),
                    items: RescheduleScreen._reasonKeys
                        .map(
                          (k) => DropdownMenuItem<String>(
                            value: k,
                            child: Text(k.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey900)),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _reasonKey = v),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'rescheduleMessage'.tr(),
                    style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Stack(
                    children: [
                      TextField(
                        controller: _message,
                        maxLength: _maxMessage,
                        maxLines: 6,
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          hintText: 'rescheduleMessagePlaceholder'.tr(),
                          hintStyle: AppTypography.body200.copyWith(color: AppColors.grey400),
                          filled: true,
                          fillColor: AppColors.white,
                          counterText: '',
                          contentPadding: const EdgeInsets.fromLTRB(16, 14, 16, 36),
                          enabledBorder: _fieldBorder(),
                          focusedBorder: _fieldBorder().copyWith(
                            borderSide: const BorderSide(color: AppColors.grey300),
                          ),
                          border: _fieldBorder(),
                        ),
                      ),
                      Positioned(
                        left: 16,
                        bottom: 10,
                        child: Text(
                          '${_message.text.length}/$_maxMessage',
                          style: AppTypography.body100.copyWith(color: AppColors.grey400),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _onContinue,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    'continueAction'.tr(),
                    style: AppTypography.buttonLarge.copyWith(color: AppColors.white, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
