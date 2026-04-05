import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'business_registration_flow.dart';
import 'customer_service_screen.dart';
import 'edit_profile_screen.dart';
import 'events_screen.dart';
import 'family_members_screen.dart';
import 'how_it_works_screen.dart';
import 'invoices_screen.dart';
import 'jobs_screen.dart';
import 'login_screen.dart';
import 'pricing_screen.dart';
import '../widgets/language_picker_sheet.dart';
import 'static_info_screen.dart';

/// Profile / My Account — menu structure and copy from Mobile `SettingsScreen`, MobileNew visuals.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  void _navigateToStatic(String title, List<StaticSection> sections) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (context) => StaticInfoScreen(title: title, sections: sections),
      ),
    );
  }

  void _showChangePasswordSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
          decoration: const BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('changePassword'.tr(), style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
              const SizedBox(height: 24),
              _passwordField('currentPassword'.tr()),
              const SizedBox(height: 16),
              _passwordField('newPassword'.tr()),
              const SizedBox(height: 16),
              _passwordField('confirmNewPassword'.tr()),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text('updatePassword'.tr(), style: AppTypography.buttonLarge),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _passwordField(String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.body100.copyWith(color: AppColors.grey700, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          obscureText: true,
          decoration: InputDecoration(
            hintText: '••••••••',
            filled: true,
            fillColor: AppColors.grey25,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        centerTitle: false,
        title: Text(
          'tabProfile'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom + 96),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                          border: Border.all(color: AppColors.grey100, width: 2),
                          image: const DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&fit=crop'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(builder: (context) => const EditProfileScreen()),
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: AppColors.primary500, shape: BoxShape.circle),
                          child: const Icon(Icons.edit, color: AppColors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Richard Lucas',
                          style: AppTypography.heading300.copyWith(color: AppColors.grey900, height: 1.25),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'richard.lucas@example.com',
                          style: AppTypography.body100.copyWith(color: AppColors.grey500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _sectionHeader('account'.tr()),
            _menuTile(
              icon: Icons.person_outline_rounded,
              title: 'editProfile'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const EditProfileScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.people_alt_rounded,
              title: 'familyFriends'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const FamilyMembersScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.lock_outline_rounded,
              title: 'changePassword'.tr(),
              onTap: _showChangePasswordSheet,
            ),
            _languageTile(),
            const SizedBox(height: 8),
            _sectionHeader('business'.tr()),
            _menuTile(
              icon: Icons.store_rounded,
              title: 'registerBusiness'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const BusinessRegistrationFlow()),
              ),
            ),
            _menuTile(
              icon: Icons.help_outline_rounded,
              title: 'businessSupport'.tr(),
              onTap: () => _navigateToStatic('businessSupport'.tr(), [
                StaticSection(title: 'businessSupport'.tr(), content: 'businessSupportContent'.tr()),
              ]),
            ),
            _menuTile(
              icon: Icons.payments_outlined,
              title: 'pricingTitle'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const PricingScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.receipt_long_outlined,
              title: 'invoicesMenu'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const InvoicesScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _sectionHeader('community'.tr()),
            _menuTile(
              icon: Icons.event_note_rounded,
              title: 'eventsTitle'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const EventsScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.work_outline_rounded,
              title: 'jobsTitle'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const JobsScreen()),
              ),
            ),
            const SizedBox(height: 8),
            _sectionHeader('legal_support'.tr()),
            _menuTile(
              icon: Icons.info_outline_rounded,
              title: 'howItWorksTitle'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const HowItWorksScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.support_agent_rounded,
              title: 'customerServiceTitle'.tr(),
              onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (context) => const CustomerServiceScreen()),
              ),
            ),
            _menuTile(
              icon: Icons.group_outlined,
              title: 'aboutUs'.tr(),
              onTap: () => _navigateToStatic('aboutUs'.tr(), [
                StaticSection(title: 'aboutMissionTitle'.tr(), content: 'aboutMissionDesc'.tr()),
                StaticSection(title: 'aboutVisionTitle'.tr(), content: 'aboutVisionDesc'.tr()),
                StaticSection(title: 'aboutValuesTitle'.tr(), content: 'aboutValues'.tr()),
              ]),
            ),
            _menuTile(
              icon: Icons.privacy_tip_outlined,
              title: 'privacyPolicy'.tr(),
              onTap: () => _navigateToStatic('privacyPolicy'.tr(), [
                StaticSection(title: 'privacyTitle1'.tr(), content: 'privacyDesc1'.tr()),
                StaticSection(title: 'privacyTitle2'.tr(), content: 'privacyDesc2'.tr()),
                StaticSection(title: 'privacyTitle3'.tr(), content: 'privacyDesc3'.tr()),
                StaticSection(title: 'privacyTitle4'.tr(), content: 'privacyDesc4'.tr()),
              ]),
            ),
            _menuTile(
              icon: Icons.description_outlined,
              title: 'termsConditions'.tr(),
              onTap: () => _navigateToStatic('termsConditions'.tr(), [
                StaticSection(title: 'termsTitle1'.tr(), content: 'termsDesc1'.tr()),
                StaticSection(title: 'termsTitle2'.tr(), content: 'termsDesc2'.tr()),
                StaticSection(title: 'termsTitle3'.tr(), content: 'termsDesc3'.tr()),
                StaticSection(title: 'termsTitle4'.tr(), content: 'termsDesc4'.tr()),
              ]),
            ),
            const SizedBox(height: 32),
            Center(
              child: TextButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil<void>(
                    context,
                    MaterialPageRoute<void>(builder: (context) => const LoginScreen()),
                    (_) => false,
                  );
                },
                child: Text('logout'.tr(), style: AppTypography.homeSectionTitle.copyWith(color: AppColors.error)),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                '${'version'.tr()} 1.0.1 (Build 42)',
                style: AppTypography.body100.copyWith(color: AppColors.grey400),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Text(
        title,
        style: AppTypography.homeSectionTitle.copyWith(
          color: AppColors.grey400,
          fontSize: 12,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  Widget _menuLeadingIcon(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Icon(icon, color: AppColors.grey600, size: 18),
    );
  }

  Widget _menuTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
      horizontalTitleGap: 14,
      minLeadingWidth: 40,
      minVerticalPadding: 10,
      titleAlignment: ListTileTitleAlignment.center,
      leading: _menuLeadingIcon(icon),
      title: Text(title, style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: AppColors.grey400),
    );
  }

  Widget _languageTile() {
    final code = context.locale.languageCode.toUpperCase();
    return ListTile(
      onTap: () async {
        final picked = await showAppLanguagePicker(
          context,
          selectedCode: context.locale.languageCode,
        );
        if (!mounted) return;
        if (picked != null) {
          context.setLocale(Locale(picked));
          setState(() {});
        }
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
      horizontalTitleGap: 14,
      minLeadingWidth: 40,
      minVerticalPadding: 10,
      titleAlignment: ListTileTitleAlignment.center,
      leading: _menuLeadingIcon(Icons.language),
      title: Text('language'.tr(), style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(code, style: AppTypography.homeSectionTitle.copyWith(color: AppColors.grey900, fontWeight: FontWeight.w700)),
          const SizedBox(width: 2),
          const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.grey400, size: 20),
        ],
      ),
    );
  }
}
