import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
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
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFFff5a5f),
          unselectedItemColor: Colors.grey.shade400,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
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
