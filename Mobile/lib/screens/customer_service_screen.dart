import 'dart:convert';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../data/api_repository.dart';
import '../data/auth_session.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import 'login_screen.dart';

class CustomerServiceScreen extends StatefulWidget {
  const CustomerServiceScreen({super.key});

  @override
  State<CustomerServiceScreen> createState() => _CustomerServiceScreenState();
}

class _CustomerServiceScreenState extends State<CustomerServiceScreen> {
  final _api = ApiRepository();
  final _subjectCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  final _replyCtrl = TextEditingController();

  List<Map<String, dynamic>> _faqs = [];
  List<Map<String, dynamic>> _tickets = [];
  Map<String, dynamic>? _selected;
  bool _faqsLoading = true;
  bool _ticketsLoading = false;
  bool _showNew = false;
  bool _submitting = false;
  String _category = 'booking';
  String? _screenshotDataUrl;
  bool _loggedIn = false;

  static const _categories = [
    ('booking', 'Bookings & reservations'),
    ('payment', 'Payments & refunds'),
    ('account', 'Account & profile'),
    ('technical', 'Technical issue'),
    ('other', 'Other'),
  ];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _messageCtrl.dispose();
    _replyCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final token = await AuthSession.getToken();
    setState(() => _loggedIn = token != null && token.isNotEmpty);
    await Future.wait([_loadFaqs(), if (_loggedIn) _loadTickets()]);
  }

  Future<void> _loadFaqs() async {
    setState(() => _faqsLoading = true);
    try {
      final rows = await _api.fetchCustomerFaqs();
      if (mounted) setState(() => _faqs = rows);
    } finally {
      if (mounted) setState(() => _faqsLoading = false);
    }
  }

  Future<void> _loadTickets() async {
    setState(() => _ticketsLoading = true);
    try {
      final rows = await _api.fetchSupportTickets();
      if (mounted) setState(() => _tickets = rows);
    } finally {
      if (mounted) setState(() => _ticketsLoading = false);
    }
  }

  Future<void> _openTicket(String id) async {
    final row = await _api.fetchSupportTicket(id);
    if (!mounted || row == null) return;
    setState(() {
      _selected = row;
      _replyCtrl.clear();
      _showNew = false;
    });
  }

  Future<void> _pickScreenshot() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1200, imageQuality: 85);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    if (bytes.length > 1_200_000) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Screenshot must be under 1.2MB')),
      );
      return;
    }
    final mime = file.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    setState(() => _screenshotDataUrl = 'data:$mime;base64,${base64Encode(bytes)}');
  }

  Future<void> _createTicket() async {
    if (_subjectCtrl.text.trim().length < 3 || _messageCtrl.text.trim().length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Subject (3+ chars) and message (8+ chars) required.')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      await _api.createSupportTicket(
        subject: _subjectCtrl.text,
        message: _messageCtrl.text,
        category: _category,
        screenshotUrl: _screenshotDataUrl,
      );
      _subjectCtrl.clear();
      _messageCtrl.clear();
      setState(() {
        _showNew = false;
        _screenshotDataUrl = null;
      });
      await _loadTickets();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ticket created. We will respond when available.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _sendReply() async {
    if (_selected == null || _replyCtrl.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      await _api.replySupportTicket(
        ticketId: '${_selected!['id']}',
        message: _replyCtrl.text,
      );
      _replyCtrl.clear();
      await _openTicket('${_selected!['id']}');
      await _loadTickets();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _faqText(Map<String, dynamic> faq, {required bool question}) {
    final lang = context.locale.languageCode;
    if (question) {
      return lang == 'es' ? '${faq['questionEs'] ?? faq['questionEn']}' : '${faq['questionEn'] ?? faq['questionEs']}';
    }
    return lang == 'es' ? '${faq['answerEs'] ?? faq['answerEn']}' : '${faq['answerEn'] ?? faq['answerEs']}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: AppColors.grey900, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'customerServiceTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'customerServiceSub'.tr(),
              style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5),
            ),
            const SizedBox(height: 24),
            if (!_loggedIn) _buildAuthGate() else ...[
              _buildTicketsSection(),
              const SizedBox(height: 32),
            ],
            Text('faqTitle'.tr(), style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
            const SizedBox(height: 16),
            if (_faqsLoading)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
            else if (_faqs.isEmpty)
              _buildStaticFaqs()
            else
              ..._faqs.map((f) => _buildFaqItem(_faqText(f, question: true), _faqText(f, question: false))),
          ],
        ),
      ),
    );
  }

  Widget _buildAuthGate() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        children: [
          const Icon(Icons.support_agent_rounded, color: AppColors.primary500, size: 40),
          const SizedBox(height: 12),
          Text(
            'Sign in to get support',
            style: AppTypography.heading200.copyWith(color: AppColors.grey900),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Open support tickets, attach screenshots, and track replies from our team.',
            style: AppTypography.body200.copyWith(color: AppColors.grey500, height: 1.4),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                await Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
                );
                await _bootstrap();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.grey900,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Sign in'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Your tickets', style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900)),
            TextButton.icon(
              onPressed: () => setState(() {
                _showNew = true;
                _selected = null;
              }),
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New'),
            ),
          ],
        ),
        if (_showNew) ...[
          const SizedBox(height: 12),
          _buildNewTicketForm(),
        ],
        if (_ticketsLoading)
          const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()))
        else if (_tickets.isEmpty && !_showNew)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text('No tickets yet. Create one to get help.', style: AppTypography.body200.copyWith(color: AppColors.grey500)),
          )
        else
          ..._tickets.map(_buildTicketTile),
        if (_selected != null) ...[
          const SizedBox(height: 20),
          _buildTicketDetail(),
        ],
      ],
    );
  }

  Widget _buildNewTicketForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.grey25,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _subjectCtrl,
            decoration: const InputDecoration(labelText: 'Subject'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(labelText: 'Category'),
            items: _categories
                .map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2)))
                .toList(),
            onChanged: (v) => setState(() => _category = v ?? 'booking'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _messageCtrl,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Message'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickScreenshot,
            icon: const Icon(Icons.attach_file),
            label: Text(_screenshotDataUrl == null ? 'Attach screenshot' : 'Screenshot attached'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _submitting ? null : _createTicket,
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary500, foregroundColor: AppColors.white),
            child: _submitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Submit ticket'),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketTile(Map<String, dynamic> t) {
    final selected = _selected?['id'] == t['id'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: selected ? AppColors.primary50 : AppColors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: () => _openTicket('${t['id']}'),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: selected ? AppColors.primary500 : AppColors.grey100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${t['ticketRef']}', style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 10)),
                Text('${t['subject']}', style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
                Text('${t['status']}'.replaceAll('_', ' '), style: AppTypography.body100.copyWith(color: AppColors.grey500, fontSize: 10)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTicketDetail() {
    final messages = (_selected!['messages'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${_selected!['ticketRef']}', style: AppTypography.body100.copyWith(color: AppColors.grey400)),
          Text('${_selected!['subject']}', style: AppTypography.heading200),
          const SizedBox(height: 12),
          ...messages.map((m) {
            final isAdmin = '${m['senderRole']}' == 'ADMIN';
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isAdmin ? const Color(0xFFEFF6FF) : AppColors.grey25,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${m['senderName'] ?? m['senderRole']}', style: AppTypography.body100.copyWith(fontWeight: FontWeight.w800, fontSize: 10)),
                  const SizedBox(height: 4),
                  Text('${m['body']}', style: AppTypography.body200),
                ],
              ),
            );
          }),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _replyCtrl,
                  decoration: const InputDecoration(hintText: 'Add a reply...'),
                  maxLines: 2,
                ),
              ),
              IconButton(
                onPressed: _submitting ? null : _sendReply,
                icon: const Icon(Icons.send_rounded, color: AppColors.primary500),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStaticFaqs() {
    return Column(
      children: [
        _buildFaqItem('faq1Question'.tr(), 'faq1Answer'.tr()),
        _buildFaqItem('faq2Question'.tr(), 'faq2Answer'.tr()),
        _buildFaqItem('faq3Question'.tr(), 'faq3Answer'.tr()),
      ],
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
        title: Text(question, style: AppTypography.heading200.copyWith(color: AppColors.grey900)),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(answer, style: AppTypography.screenSubtitle.copyWith(color: AppColors.grey500, height: 1.5)),
          ),
        ],
      ),
    );
  }
}
