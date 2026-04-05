import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'home.dart';
import 'search_results_screen.dart';
import 'my_reservations_screen.dart';
import 'settings_screen.dart';

// Global notifier to control main navigation from anywhere
final ValueNotifier<int> mainNavigationNotifier = ValueNotifier<int>(0);

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  final List<Widget> _screens = [
    const HomeScreen(),
    const SearchResultsScreen(),
    const MyReservationsScreen(),
    const SettingsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    mainNavigationNotifier.addListener(_handleTabChange);
  }

  @override
  void dispose() {
    mainNavigationNotifier.removeListener(_handleTabChange);
    super.dispose();
  }

  void _handleTabChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: mainNavigationNotifier.value,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: mainNavigationNotifier.value,
          onTap: (i) => mainNavigationNotifier.value = i,
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.white,
          selectedItemColor: AppColors.primary500,
          unselectedItemColor: AppColors.grey400,
          selectedLabelStyle: AppTypography.heading100.copyWith(color: AppColors.primary500),
          unselectedLabelStyle: AppTypography.body100.copyWith(color: AppColors.grey400),
          elevation: 0,
          items: [
            BottomNavigationBarItem(
              icon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Icon(mainNavigationNotifier.value == 0 ? Icons.home_rounded : Icons.home_outlined),
              ),
              label: 'tabHome'.tr(),
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Icon(mainNavigationNotifier.value == 1 ? Icons.search_rounded : Icons.search_outlined),
              ),
              label: 'tabSearch'.tr(),
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Icon(mainNavigationNotifier.value == 2 ? Icons.calendar_today_rounded : Icons.calendar_today_outlined),
              ),
              label: 'tabBookings'.tr(),
            ),
            BottomNavigationBarItem(
              icon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Icon(mainNavigationNotifier.value == 3 ? Icons.person_rounded : Icons.person_outline_rounded),
              ),
              label: 'tabProfile'.tr(),
            ),
          ],
        ),
      ),
    );
  }
}
