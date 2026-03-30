import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'family_members_screen.dart';
import 'my_favorites_screen.dart';
import 'my_reservations_screen.dart';
import 'business_registration_flow.dart';
import 'static_info_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'tabProfile'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900),
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
                          border: Border.all(color: Colors.grey.shade100, width: 2),
                          image: const DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&fit=crop'),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(color: Color(0xFFff5a5f), shape: BoxShape.circle),
                        child: const Icon(Icons.edit, color: Colors.white, size: 14),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Richard Lucas', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1e293b))),
                      SizedBox(height: 4),
                      Text('richard.lucas@example.com', style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600)),
                    ],
                  )
                ],
              ),
            ),
            const SizedBox(height: 40),

            _buildSectionHeader('account'.tr()),
            _buildMenuItem(
              icon: Icons.calendar_today_rounded, 
              title: 'myBookings'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MyReservationsScreen())),
            ),
            _buildMenuItem(
              icon: Icons.people_alt_rounded, 
              title: 'familyMembers'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const FamilyMembersScreen())),
            ),
            _buildMenuItem(
              icon: Icons.favorite_rounded, 
              title: 'favorites'.tr(), 
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MyFavoritesScreen())),
            ),
            _buildMenuItem(
              icon: Icons.lock_outline_rounded, 
              title: 'changePassword'.tr(), 
              onTap: () => _showChangePasswordModal(),
            ),

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
              onTap: () => _navigateToStatic('Business Support', 'How can we help your business grow? Contact our partner success team.'),
            ),

            const SizedBox(height: 24),
            _buildSectionHeader('legal_support'.tr()),
            _buildMenuItem(
              icon: Icons.info_outline_rounded, 
              title: 'aboutUs'.tr(), 
              onTap: () => _navigateToStatic('About Us', 'REZERVAME is the leading platform for beauty and wellness services.'),
            ),
            _buildMenuItem(
              icon: Icons.privacy_tip_outlined, 
              title: 'privacyPolicy'.tr(), 
              onTap: () => _navigateToStatic('Privacy Policy', 'Your data is safe with us. Read our full policy here.'),
            ),
            _buildMenuItem(
              icon: Icons.description_outlined, 
              title: 'termsOfService'.tr(), 
              onTap: () => _navigateToStatic('Terms of Service', 'By using our platform, you agree to these terms.'),
            ),
            
            const SizedBox(height: 40),
            Center(
              child: TextButton(
                onPressed: () {},
                child: const Text('Log Out / Salir', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w800, fontSize: 16)),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                'Version 1.0.4 (Build 42)',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.w600),
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
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: Colors.grey,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildMenuItem({required IconData icon, required String title, required VoidCallback onTap}) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: const Color(0xFFff5a5f).withOpacity(0.05), borderRadius: BorderRadius.circular(14)),
        child: Icon(icon, color: const Color(0xFFff5a5f), size: 22),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
    );
  }

  void _navigateToStatic(String title, String content) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StaticInfoScreen(title: title, content: content),
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
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('changePassword'.tr(), style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 24),
            _buildField('Current Password', '••••••••'),
            const SizedBox(height: 16),
            _buildField('New Password', '••••••••'),
            const SizedBox(height: 16),
            _buildField('Confirm New Password', '••••••••'),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFff5a5f),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: Text('updatePassword'.tr(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
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
        Text(label, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        TextField(
          obscureText: true,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.grey.shade50,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }
}
