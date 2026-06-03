import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/security_policy.dart';

class _ServiceDraft {
  _ServiceDraft();

  final nameCtrl = TextEditingController();
  final durationCtrl = TextEditingController(text: '30');
  final priceCtrl = TextEditingController(text: '25');
  String category = 'hairService';

  void dispose() {
    nameCtrl.dispose();
    durationCtrl.dispose();
    priceCtrl.dispose();
  }
}

/// Business partner registration — `POST /public/business-join` (web `/business/join` parity).
class BusinessRegistrationFlow extends StatefulWidget {
  const BusinessRegistrationFlow({super.key});

  @override
  State<BusinessRegistrationFlow> createState() => _BusinessRegistrationFlowState();
}

class _BusinessRegistrationFlowState extends State<BusinessRegistrationFlow> {
  final ApiRepository _api = ApiRepository();
  final PageController _pageController = PageController();
  final ImagePicker _picker = ImagePicker();

  int _currentStep = 0;
  bool _submitting = false;
  bool _acceptedTerms = false;
  String? _error;

  final _nameCtrl = TextEditingController();
  final _taxIdCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  List<Map<String, dynamic>> _categories = [];
  final Set<String> _selectedCategoryKeys = {};
  final List<_ServiceDraft> _services = [_ServiceDraft(), _ServiceDraft()];

  String? _idDocDataUri;
  String? _licenseDocDataUri;
  String? _insuranceDocDataUri;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final rows = await _api.fetchPublicCategories();
    if (!mounted) return;
    setState(() {
      _categories = rows;
      if (_selectedCategoryKeys.isEmpty && rows.isNotEmpty) {
        _selectedCategoryKeys.add('${rows.first['key'] ?? rows.first['id']}');
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameCtrl.dispose();
    _taxIdCtrl.dispose();
    _ownerCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _addressCtrl.dispose();
    for (final s in _services) {
      s.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDoc(void Function(String) setter) async {
    final file = await _picker.pickImage(source: ImageSource.gallery, maxWidth: 1400, maxHeight: 1400, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    final b64 = base64Encode(bytes);
    final mime = file.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    setter('data:$mime;base64,$b64');
    setState(() {});
  }

  bool _setError(String msg) {
    setState(() => _error = msg);
    return false;
  }

  Future<bool> _validateStep() async {
    setState(() => _error = null);
    switch (_currentStep) {
      case 0:
        if (_nameCtrl.text.trim().isEmpty || _taxIdCtrl.text.trim().isEmpty || _ownerCtrl.text.trim().isEmpty) {
          return _setError('Business name, tax ID, and owner name are required.');
        }
        if (_selectedCategoryKeys.isEmpty) return _setError('Select at least one category.');
        return true;
      case 1:
        if (_emailCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty) {
          return _setError('Email and phone are required.');
        }
        final policy = await fetchSecurityPolicy();
        if (passwordTooShort(_passwordCtrl.text, policy.minPasswordLength)) {
          return _setError(passwordLengthMessage(policy.minPasswordLength));
        }
        return true;
      case 2:
        if (_addressCtrl.text.trim().isEmpty) return _setError('Business address is required.');
        if (_idDocDataUri == null || _licenseDocDataUri == null || _insuranceDocDataUri == null) {
          return _setError('ID, license, and insurance document photos are required.');
        }
        return true;
      case 3:
        final valid = _services.where((s) {
          final price = double.tryParse(s.priceCtrl.text) ?? -1;
          final dur = int.tryParse(s.durationCtrl.text) ?? 0;
          return s.nameCtrl.text.trim().isNotEmpty && dur > 0 && price >= 0;
        });
        if (valid.isEmpty) return _setError('Add at least one service with name, duration, and price.');
        if (!_acceptedTerms) return _setError('You must accept the terms to submit.');
        return true;
      default:
        return true;
    }
  }

  Future<void> _next() async {
    if (!await _validateStep()) return;
    if (_currentStep < 3) {
      setState(() => _currentStep++);
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      return;
    }
    await _submit();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final categoryFallback = _selectedCategoryKeys.isEmpty ? 'hairService' : _selectedCategoryKeys.first;
      final services = _services
          .where((s) => s.nameCtrl.text.trim().isNotEmpty)
          .map((s) => {
                'name': s.nameCtrl.text.trim(),
                'duration': int.tryParse(s.durationCtrl.text) ?? 30,
                'price': double.tryParse(s.priceCtrl.text) ?? 0,
                'category': s.category.isNotEmpty ? s.category : categoryFallback,
              })
          .toList();

      await _api.submitBusinessJoin({
        'name': _nameCtrl.text.trim(),
        'taxId': _taxIdCtrl.text.trim(),
        'owner': _ownerCtrl.text.trim(),
        'email': _emailCtrl.text.trim().toLowerCase(),
        'phone': _phoneCtrl.text.trim(),
        'address': _addressCtrl.text.trim(),
        'categories': _selectedCategoryKeys.toList(),
        'password': _passwordCtrl.text.trim(),
        'planId': 'basic',
        'idDocumentImage': _idDocDataUri,
        'licenseDocumentImage': _licenseDocDataUri,
        'insuranceDocumentImage': _insuranceDocDataUri,
        'services': services,
      });
      if (!mounted) return;
      setState(() => _submitting = false);
      _showSuccessDialog();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _submitting = false;
      });
    }
  }

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
            Text('registerBusiness'.tr(), style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900)),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                return Container(
                  width: 30,
                  height: 4,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: index <= _currentStep ? AppColors.primary500 : AppColors.grey100,
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          if (_error != null)
            Container(
              width: double.infinity,
              color: AppColors.error.withValues(alpha: 0.08),
              padding: const EdgeInsets.all(12),
              child: Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.error)),
            ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [_buildStep1(), _buildStep2(), _buildStep3(), _buildStep4()],
            ),
          ),
          _buildNavBar(),
        ],
      ),
    );
  }

  Widget _buildNavBar() {
    return Container(
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
                  onPressed: _submitting
                      ? null
                      : () {
                          setState(() => _currentStep--);
                          _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                  child: Text('back'.tr()),
                ),
              ),
            ),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _submitting ? null : _next,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary500,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                    )
                  : Text(
                      _currentStep == 3 ? 'finish'.tr() : 'next'.tr(),
                      style: AppTypography.buttonLarge.copyWith(color: AppColors.white),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {String? hint, bool obscure = false, TextInputType? keyboard}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.heading100.copyWith(color: AppColors.grey900)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          obscureText: obscure,
          keyboardType: keyboard,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: AppColors.grey25,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegTellUs'.tr(), style: AppTypography.screenTitle),
          const SizedBox(height: 24),
          _field('bizRegName'.tr(), _nameCtrl, hint: 'bizRegNameHint'.tr()),
          const SizedBox(height: 16),
          _field('bizRegEntityId'.tr(), _taxIdCtrl, hint: 'bizRegEntityIdHint'.tr()),
          const SizedBox(height: 16),
          _field('Owner / manager', _ownerCtrl),
          const SizedBox(height: 24),
          Text('bizRegIndustry'.tr(), style: AppTypography.heading100),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((c) {
              final key = '${c['key'] ?? c['id']}';
              final label = '${c['labelEn'] ?? c['name'] ?? key}';
              final selected = _selectedCategoryKeys.contains(key);
              return FilterChip(
                label: Text(label),
                selected: selected,
                onSelected: (v) {
                  setState(() {
                    if (v) {
                      _selectedCategoryKeys.add(key);
                    } else {
                      _selectedCategoryKeys.remove(key);
                    }
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegReachYou'.tr(), style: AppTypography.screenTitle),
          const SizedBox(height: 24),
          _field('bizRegEmail'.tr(), _emailCtrl, keyboard: TextInputType.emailAddress),
          const SizedBox(height: 16),
          _field('bizRegPhone'.tr(), _phoneCtrl, keyboard: TextInputType.phone),
          const SizedBox(height: 16),
          _field('Password', _passwordCtrl, obscure: true),
        ],
      ),
    );
  }

  Widget _docRow(String label, String? dataUri, void Function(String) onPicked) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label, style: AppTypography.heading200),
      subtitle: Text(
        dataUri == null ? 'Tap to upload' : 'Uploaded',
        style: AppTypography.body100.copyWith(color: AppColors.grey500),
      ),
      trailing: IconButton(
        icon: const Icon(Icons.upload_file, color: AppColors.primary500),
        onPressed: () => _pickDoc(onPicked),
      ),
    );
  }

  Widget _buildStep3() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegLocation'.tr(), style: AppTypography.screenTitle),
          const SizedBox(height: 24),
          _field('bizRegAddress'.tr(), _addressCtrl, hint: 'bizRegAddressHint'.tr()),
          const SizedBox(height: 24),
          _docRow('ID document', _idDocDataUri, (v) => _idDocDataUri = v),
          _docRow('Business license', _licenseDocDataUri, (v) => _licenseDocDataUri = v),
          _docRow('Insurance', _insuranceDocDataUri, (v) => _insuranceDocDataUri = v),
        ],
      ),
    );
  }

  Widget _buildStep4() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('bizRegServices'.tr(), style: AppTypography.screenTitle),
          const SizedBox(height: 16),
          ..._services.asMap().entries.map((e) {
            final s = e.value;
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    _field('Service', s.nameCtrl),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _field('Minutes', s.durationCtrl, keyboard: TextInputType.number)),
                        const SizedBox(width: 12),
                        Expanded(child: _field('Price', s.priceCtrl, keyboard: TextInputType.number)),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
          TextButton.icon(
            onPressed: () => setState(() => _services.add(_ServiceDraft())),
            icon: const Icon(Icons.add),
            label: Text('bizRegAddCustom'.tr()),
          ),
          CheckboxListTile(
            value: _acceptedTerms,
            onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
            title: const Text('I accept the terms and confirm this information is accurate.'),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 80),
            const SizedBox(height: 24),
            Text('bizRegWelcome'.tr(), textAlign: TextAlign.center, style: AppTypography.screenTitle),
            const SizedBox(height: 12),
            Text(
              'bizRegReviewing'.tr(),
              textAlign: TextAlign.center,
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                child: Text('backToHome'.tr()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
