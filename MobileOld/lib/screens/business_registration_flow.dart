import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class BusinessRegistrationFlow extends StatefulWidget {
  const BusinessRegistrationFlow({super.key});

  @override
  State<BusinessRegistrationFlow> createState() => _BusinessRegistrationFlowState();
}

class _BusinessRegistrationFlowState extends State<BusinessRegistrationFlow> {
  int _currentStep = 0;
  final PageController _pageController = PageController();

  final List<String> _steps = ['stepIdentification', 'stepContact', 'stepLocation', 'stepServices'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          children: [
            Text('registerBusiness'.tr(), style: AppTypography.heading300.copyWith(color: AppColors.grey900)),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_steps.length, (index) => Container(
                width: 30,
                height: 4,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: index <= _currentStep ? AppColors.primary500 : AppColors.grey100,
                  borderRadius: BorderRadius.circular(2),
                ),
              )),
            ),
          ],
        ),
      ),
      body: PageView(
        controller: _pageController,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _buildIdentificationStep(),
          _buildContactStep(),
          _buildLocationStep(),
          _buildServicesStep(),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.white,
          border: Border(top: BorderSide(color: AppColors.grey50)),
        ),
        child: Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() => _currentStep--);
                      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                    },
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppColors.grey100),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('back'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.grey900)),
                  ),
                ),
              ),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  if (_currentStep < _steps.length - 1) {
                    setState(() => _currentStep++);
                    _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  } else {
                    _showSuccessDialog();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  _currentStep == _steps.length - 1 ? 'finish'.tr() : 'next'.tr(),
                  style: AppTypography.heading400.copyWith(color: AppColors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIdentificationStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegTellUs'.tr(), style: AppTypography.heading700.copyWith(color: AppColors.grey900)),
          const SizedBox(height: 8),
          Text('bizRegTellUsSub'.tr(), style: AppTypography.body100.copyWith(color: AppColors.grey500)),
          const SizedBox(height: 32),
          _buildField('bizRegName'.tr(), 'bizRegNameHint'.tr()),
          const SizedBox(height: 16),
          _buildField('bizRegEntityId'.tr(), 'bizRegEntityIdHint'.tr()),
          const SizedBox(height: 16),
          _buildField('bizRegIndustry'.tr(), 'bizRegIndustryHint'.tr()),
        ],
      ),
    );
  }

  Widget _buildContactStep() {
     return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegReachYou'.tr(), style: AppTypography.heading700.copyWith(color: AppColors.grey900)),
          const SizedBox(height: 32),
          _buildField('bizRegEmail'.tr(), 'hello@luxe.com'),
          const SizedBox(height: 16),
          _buildField('bizRegPhone'.tr(), '+507 ...'),
          const SizedBox(height: 16),
          _buildField('bizRegInstagram'.tr(), '@luxe_barber'),
        ],
      ),
    );
  }

  Widget _buildLocationStep() {
     return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegLocation'.tr(), style: AppTypography.heading700.copyWith(color: AppColors.grey900)),
          const SizedBox(height: 32),
          _buildField('bizRegAddress'.tr(), 'bizRegAddressHint'.tr()),
          const SizedBox(height: 16),
          _buildField('bizRegCity'.tr(), 'bizRegCityHint'.tr()),
          const SizedBox(height: 32),
          Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Center(child: Icon(Icons.map_outlined, size: 48, color: Colors.grey)),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesStep() {
     return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegServices'.tr(), style: AppTypography.heading700.copyWith(color: AppColors.grey900)),
          const SizedBox(height: 32),
          _buildServiceCheck('Corte de Cabello', true),
          _buildServiceCheck('Afeitado de Barba', false),
          _buildServiceCheck('Manicura / Pedicura', true),
          _buildServiceCheck('Tintado / Coloración', false),
          const SizedBox(height: 24),
          TextButton.icon(
            onPressed: () {}, 
            icon: const Icon(Icons.add), 
            label: Text('bizRegAddCustom'.tr(), style: const TextStyle(fontWeight: FontWeight.w800))
          ),
        ],
      ),
    );
  }

  Widget _buildField(String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.heading100.copyWith(color: AppColors.grey900)),
        const SizedBox(height: 8),
        TextField(
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTypography.body100.copyWith(color: AppColors.grey300),
            filled: true,
            fillColor: AppColors.grey25,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildServiceCheck(String title, bool val) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: val ? AppColors.primary500.withOpacity(0.05) : AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: val ? AppColors.primary500.withOpacity(0.2) : AppColors.grey50),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTypography.heading200.copyWith(color: val ? AppColors.primary500 : AppColors.grey900)),
          Checkbox(value: val, onChanged: (v) {}, activeColor: AppColors.primary500),
        ],
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 80),
            const SizedBox(height: 24),
            Text('bizRegWelcome'.tr(), textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            Text('bizRegReviewing'.tr(), textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Close flow
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.grey900,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('backToHome'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.white)),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
