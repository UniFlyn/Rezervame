import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final TextEditingController _nameController = TextEditingController(text: 'Amelia Wilson');
  final TextEditingController _emailController = TextEditingController(text: 'ameliawilson@gmail.com');
  final TextEditingController _phoneController = TextEditingController(text: '+1 (409) 487-1935');
  final TextEditingController _dobController = TextEditingController(text: 'December 20, 1998');
  String _selectedGender = 'Female';

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
      body: SingleChildScrollView(
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
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('Save Changes', style: AppTypography.buttonLarge),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAvatarEditor() {
    return Stack(
      children: [
        const CircleAvatar(
          radius: 60,
          backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=amelia'),
        ),
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
