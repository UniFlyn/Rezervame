import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'home_screen.dart';
import 'favorite_screen.dart';
import 'profile_screen.dart';
import 'booking_history_screen.dart';
import 'search_hub_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const SearchHubScreen(),
    const FavoriteScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: _buildBottomNav(),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => const BookingHistoryScreen()));
        },
        backgroundColor: AppColors.primary500,
        shape: const CircleBorder(),
        child: const Icon(Icons.calendar_today_outlined, color: AppColors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildBottomNav() {
    return BottomAppBar(
      height: 80,
      elevation: 6,
      shadowColor: AppColors.black.withValues(alpha: 0.08),
      color: AppColors.white,
      notchMargin: 10,
      shape: const CircularNotchedRectangle(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(0, Icons.home_outlined, 'tabHome'.tr()),
          _buildNavItem(1, Icons.search_outlined, 'tabSearch'.tr()),
          const SizedBox(width: 40), // Space for FAB
          _buildNavItem(2, Icons.favorite_outline, 'favoriteScreenTitle'.tr()),
          _buildNavItem(3, Icons.person_outline, 'tabAccount'.tr()),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return InkWell(
      onTap: () => setState(() => _selectedIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: isSelected ? AppColors.primary500 : AppColors.grey400, size: 24),
          const SizedBox(height: 4),
          Text(
            label,
            style: AppTypography.body100.copyWith(
              color: isSelected ? AppColors.primary500 : AppColors.grey400,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
