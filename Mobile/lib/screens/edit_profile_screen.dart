import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final ApiRepository _api = ApiRepository();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();
  String _selectedGender = 'Female';
  String? _avatarUrl;
  bool _loading = true;
  bool _submitting = false;

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name cannot be empty'), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email cannot be empty'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await _api.updateUserProfile(name: name, phone: phone, email: email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully'), behavior: SnackBarBehavior.floating),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Error'),
          content: Text(e.toString().replaceAll('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((s) => s.isNotEmpty).take(2).toList();
    if (parts.isEmpty) return '?';
    return parts.map((s) => s[0].toUpperCase()).join();
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final row = await _api.fetchUserSession();
    if (!mounted) return;
    if (row != null) {
      _nameController.text = '${row['name'] ?? ''}'.trim();
      _emailController.text = '${row['email'] ?? ''}'.trim();
      final p = '${row['phone'] ?? ''}'.trim();
      if (p.isNotEmpty) _phoneController.text = p;
      final a = '${row['avatar'] ?? ''}'.trim();
      _avatarUrl = a.isNotEmpty ? a : null;
    }
    setState(() => _loading = false);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Personal Data',
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  _buildAvatarEditor(),
                  const SizedBox(height: 32),
                  _buildField('Full Name', _nameController, Icons.person_outline),
                  const SizedBox(height: 20),
                  _buildField('Email', _emailController, Icons.email_outlined),
                  const SizedBox(height: 20),
                  _buildField('Phone Number', _phoneController, Icons.phone_outlined),
                  const SizedBox(height: 20),
                  _buildField('Date of Birth', _dobController, Icons.calendar_today_outlined),
                  const SizedBox(height: 20),
                  _buildDropdownField('Gender', ['Male', 'Female', 'Other']),
                  const SizedBox(height: 48),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary500,
                        foregroundColor: AppColors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2),
                            )
                          : Text('Save Changes', style: AppTypography.buttonLarge),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildAvatarEditor() {
    final url = _avatarUrl;
    final Widget avatar = (url != null && url.startsWith('http'))
        ? CircleAvatar(
            radius: 60,
            backgroundColor: AppColors.grey100,
            backgroundImage: NetworkImage(url),
          )
        : CircleAvatar(
            radius: 60,
            backgroundColor: AppColors.grey100,
            child: Text(
              _initials(_nameController.text),
              style: AppTypography.heading300.copyWith(color: AppColors.grey700, fontSize: 28),
            ),
          );

    return Stack(
      children: [
        avatar,
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: AppColors.primary500,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.camera_alt_outlined, color: AppColors.white, size: 20),
          ),
        ),
      ],
    );
  }

  Widget _buildField(String label, TextEditingController controller, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          style: AppTypography.body300.copyWith(color: AppColors.grey900),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.grey25,
            prefixIcon: Icon(icon, color: AppColors.grey400, size: 20),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.grey100)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary500, width: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, List<String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppColors.grey25,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.grey100),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedGender,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.grey400),
              onChanged: (String? newValue) {
                setState(() => _selectedGender = newValue!);
              },
              items: options.map<DropdownMenuItem<String>>((String value) {
                return DropdownMenuItem<String>(
                  value: value,
                  child: Text(value, style: AppTypography.body300.copyWith(color: AppColors.grey900)),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }
}
