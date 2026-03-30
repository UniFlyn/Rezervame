import 'package:flutter/material.dart';

class StaticInfoScreen extends StatelessWidget {
  final String title;
  final String content;

  const StaticInfoScreen({
    super.key,
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(title, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 18)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1),
            ),
            const SizedBox(height: 24),
            Text(
              content,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey.shade700,
                height: 1.6,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFFff5a5f).withOpacity(0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFff5a5f).withOpacity(0.1)),
              ),
              child: Column(
                children: [
                  const Text(
                    'Need more help?',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Contact our support team for any custom inquiries or technical issues.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Contact Support', style: TextStyle(color: Colors.white)),
                  )
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
