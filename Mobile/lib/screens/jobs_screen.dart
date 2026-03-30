import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class JobsScreen extends StatelessWidget {
  const JobsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'jobsTitle'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withOpacity(0.2),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'jobsWhyWork'.tr(),
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, height: 1.2, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'jobsSub'.tr(),
                    style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),
            Text(
              'jobsOpenPositions'.tr().toUpperCase(),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFff5a5f), letterSpacing: 1.5),
            ),
            const SizedBox(height: 24),
            _buildJobCard(context, 'jobTitle1'.tr(), 'jobInfo1'.tr()),
            _buildJobCard(context, 'jobTitle2'.tr(), 'jobInfo2'.tr()),
            _buildJobCard(context, 'jobDesigner'.tr(), 'jobPanamaFull'.tr()),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildJobCard(BuildContext context, String title, String meta) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -0.2),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      meta,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 0),
            ),
            child: Text(
              'jobApply'.tr(),
              style: const TextStyle(
                color: Color(0xFFff5a5f),
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
