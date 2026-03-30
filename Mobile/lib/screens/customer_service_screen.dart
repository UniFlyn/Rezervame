import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class CustomerServiceScreen extends StatelessWidget {
  const CustomerServiceScreen({super.key});

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
          'customerServiceTitle'.tr(),
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'customerServiceSub'.tr(),
              style: TextStyle(fontSize: 15, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(child: _buildContactCard(context, 'chatSupport'.tr(), Icons.message_rounded, const Color(0xFFff5a5f))),
                const SizedBox(width: 16),
                Expanded(child: _buildContactCard(context, 'callUs'.tr(), Icons.phone_rounded, const Color(0xFF0F172A))),
              ],
            ),
            const SizedBox(height: 48),
            Text(
              'faqTitle'.tr(),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 24),
            _buildFaqItem('faq1Question'.tr(), 'faq1Answer'.tr()),
            _buildFaqItem('faq2Question'.tr(), 'faq2Answer'.tr()),
            _buildFaqItem('faq3Question'.tr(), 'faq3Answer'.tr()),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard(BuildContext context, String title, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        ],
      ),
    );
  }

  Widget _buildFaqItem(String question, String answer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ExpansionTile(
        title: Text(question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        expandedAlignment: Alignment.topLeft,
        shape: const RoundedRectangleBorder(side: BorderSide.none),
        children: [
          Text(answer, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey, height: 1.5)),
        ],
      ),
    );
  }
}
