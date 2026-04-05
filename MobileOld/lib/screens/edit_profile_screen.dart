import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController(text: 'Richard Lucas');
  final _phoneController = TextEditingController(text: '+507 6123-4567');
  final _emailController = TextEditingController(text: 'richard.lucas@example.com');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'editProfile'.tr(),
          style: AppTypography.heading400.copyWith(color: AppColors.grey900),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Stack(
                alignment: Alignment.bottomRight,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.grey50, width: 4),
                      image: const DecorationImage(
                        image: NetworkImage('https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300&fit=crop'),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: AppColors.primary500, shape: BoxShape.circle),
                    child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            _buildInputField('fullName'.tr(), _nameController),
            const SizedBox(height: 20),
            _buildInputField('phoneNumber'.tr(), _phoneController),
            const SizedBox(height: 20),
            _buildInputField('email'.tr(), _emailController),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('saveChanges'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.2),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          style: AppTypography.body200.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w700),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.grey25,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          ),
        ),
      ],
    );
  }
}
