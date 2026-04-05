import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'family_members_screen.dart';
import 'my_favorites_screen.dart';
import 'my_reservations_screen.dart';
import 'business_registration_flow.dart';
import 'static_info_screen.dart';
import 'events_screen.dart';
import 'jobs_screen.dart';
import 'pricing_screen.dart';
import 'how_it_works_screen.dart';
import 'customer_service_screen.dart';
import 'edit_profile_screen.dart';
import 'login_screen.dart';
import '../utils/mock_auth.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(
          'tabProfile'.tr(),
          style: AppTypography.heading500.copyWith(color: AppColors.grey900),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            // Profile Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.grey50, width: 2),
                          image: const DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&fit=crop'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const EditProfileScreen())),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: AppColors.primary500, shape: BoxShape.circle),
                          child: const Icon(Icons.edit, color: Colors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Richard Lucas', style: AppTypography.heading600.copyWith(color: AppColors.grey900)),
                      const SizedBox(height: 4),
                      Text('richard.lucas@example.com', style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                    ],
                  )
                ],
              ),
            ),
            const SizedBox(height: 40),

            _buildSectionHeader('account'.tr()),
            _buildMenuItem(
              icon: Icons.calendar_today_rounded, 
              title: 'reservations'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MyReservationsScreen())),
            ),
            _buildMenuItem(
              icon: Icons.people_alt_rounded, 
              title: 'familyFriends'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const FamilyMembersScreen())),
            ),
            _buildMenuItem(
              icon: Icons.favorite_rounded, 
              title: 'favorites'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MyFavoritesScreen())),
            ),
            _buildMenuItem(
              icon: Icons.person_outline_rounded, 
              title: 'editProfile'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const EditProfileScreen())),
            ),
            _buildMenuItem(
              icon: Icons.lock_outline_rounded, 
              title: 'changePassword'.tr(), 
              onTap: () => _showChangePasswordModal(),
            ),
            _buildLanguageToggle(),

            const SizedBox(height: 24),
            _buildSectionHeader('business'.tr()),
            _buildMenuItem(
              icon: Icons.store_rounded, 
              title: 'registerBusiness'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const BusinessRegistrationFlow())),
            ),
            _buildMenuItem(
              icon: Icons.help_outline_rounded, 
              title: 'businessSupport'.tr(), 
              onTap: () => _navigateToStatic('businessSupport'.tr(), [
                StaticSection(title: 'businessSupport'.tr(), content: 'businessSupportContent'.tr()),
              ]),
            ),
            _buildMenuItem(
              icon: Icons.payments_outlined, 
              title: 'pricingTitle'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const PricingScreen())),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('community'.tr()),
            _buildMenuItem(
              icon: Icons.event_note_rounded, 
              title: 'eventsTitle'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const EventsScreen())),
            ),
            _buildMenuItem(
              icon: Icons.work_outline_rounded, 
              title: 'jobsTitle'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const JobsScreen())),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('legal_support'.tr()),
            _buildMenuItem(
              icon: Icons.info_outline_rounded, 
              title: 'howItWorksTitle'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const HowItWorksScreen())),
            ),
            _buildMenuItem(
              icon: Icons.support_agent_rounded, 
              title: 'customerServiceTitle'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CustomerServiceScreen())),
            ),
            _buildMenuItem(
              icon: Icons.group_outlined, 
              title: 'aboutUs'.tr(), 
              onTap: () => _navigateToStatic('aboutUs'.tr(), [
                StaticSection(title: 'aboutMissionTitle'.tr(), content: 'aboutMissionDesc'.tr()),
                StaticSection(title: 'aboutVisionTitle'.tr(), content: 'aboutVisionDesc'.tr()),
                StaticSection(title: 'aboutValuesTitle'.tr(), content: 'aboutValues'.tr()),
              ]),
            ),
            _buildMenuItem(
              icon: Icons.privacy_tip_outlined, 
              title: 'privacyPolicy'.tr(), 
              onTap: () => _navigateToStatic('privacyPolicy'.tr(), [
                StaticSection(title: 'privacyTitle1'.tr(), content: 'privacyDesc1'.tr()),
                StaticSection(title: 'privacyTitle2'.tr(), content: 'privacyDesc2'.tr()),
                StaticSection(title: 'privacyTitle3'.tr(), content: 'privacyDesc3'.tr()),
                StaticSection(title: 'privacyTitle4'.tr(), content: 'privacyDesc4'.tr()),
              ]),
            ),
            _buildMenuItem(
              icon: Icons.description_outlined, 
              title: 'termsConditions'.tr(), 
              onTap: () => _navigateToStatic('termsConditions'.tr(), [
                StaticSection(title: 'termsTitle1'.tr(), content: 'termsDesc1'.tr()),
                StaticSection(title: 'termsTitle2'.tr(), content: 'termsDesc2'.tr()),
                StaticSection(title: 'termsTitle3'.tr(), content: 'termsDesc3'.tr()),
                StaticSection(title: 'termsTitle4'.tr(), content: 'termsDesc4'.tr()),
              ]),
            ),
            
            const SizedBox(height: 40),
            Center(
              child: TextButton(
                onPressed: () {
                  mockAuthNotifier.value = false;
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                },
                child: Text('logout'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.error)),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                '${'version'.tr()} 1.0.4 (Build 42)',
                style: AppTypography.body100.copyWith(color: AppColors.grey300),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Text(
        title.toUpperCase(),
        style: AppTypography.heading100.copyWith(color: AppColors.grey400, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildMenuItem({required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.primary500.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: AppColors.primary500, size: 22),
      ),
      title: Text(title, style: AppTypography.heading300),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.grey300),
    );
  }

  void _navigateToStatic(String title, List<StaticSection> sections) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StaticInfoScreen(title: title, sections: sections),
      ),
    );
  }

  Widget _buildLanguageToggle() {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.primary500.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.language, color: AppColors.primary500, size: 22),
      ),
      title: Text('language'.tr(), style: AppTypography.heading300),
      trailing: DropdownButton<String>(
        value: context.locale.languageCode,
        underline: const SizedBox(),
        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.grey300),
        items: [
          DropdownMenuItem(value: 'en', child: Text('EN', style: AppTypography.heading200)),
          DropdownMenuItem(value: 'es', child: Text('ES', style: AppTypography.heading200)),
        ],
        onChanged: (String? newValue) {
          if (newValue != null) {
            context.setLocale(Locale(newValue));
          }
        },
      ),
    );
  }

  void _showChangePasswordModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          top: 24, left: 24, right: 24,
        ),
        decoration: const BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('changePassword'.tr(), style: AppTypography.heading600),
            const SizedBox(height: 24),
            _buildField('currentPassword'.tr(), '••••••••'),
            const SizedBox(height: 16),
            _buildField('newPassword'.tr(), '••••••••'),
            const SizedBox(height: 16),
            _buildField('confirmNewPassword'.tr(), '••••••••'),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('updatePassword'.tr(), style: AppTypography.heading400.copyWith(color: AppColors.white)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
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
          obscureText: true,
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
}
