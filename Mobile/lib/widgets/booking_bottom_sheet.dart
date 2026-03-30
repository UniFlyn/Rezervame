import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../screens/booking_confirmation_screen.dart';

enum BookingStep { schedule, summary, staffList, professionalDetail, paymentWarning, checkout }

class BookingBottomSheet extends StatefulWidget {
  final List<Map<String, dynamic>> selectedServices;
  final List<Map<String, dynamic>> teamMembers;
  final Map<String, dynamic> venue;

  const BookingBottomSheet({
    super.key,
    required this.selectedServices,
    required this.teamMembers,
    required this.venue,
  });

  @override
  State<BookingBottomSheet> createState() => _BookingBottomSheetState();
}

class _BookingBottomSheetState extends State<BookingBottomSheet> {
  BookingStep _step = BookingStep.schedule;
  
  // State for Schedule
  int _selectedDate = 4;
  String _selectedTime = "10:30 AM";
  String _timePeriodKey = "morning";

  // State for Professional routing
  Map<String, dynamic>? _selectedProfForDetail;
  int? _activeServiceIdForChange;
  Map<int, int> _assignments = {};

  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    // Initialize default assignments
    for (var service in widget.selectedServices) {
      if (widget.teamMembers.isNotEmpty) {
        _assignments[service['id']] = widget.teamMembers.first['id'];
      }
    }
  }

  double get _totalPrice {
    double total = 0;
    for (var s in widget.selectedServices) {
      String priceStr = s['price'].toString().replaceAll('\$', '').trim();
      total += double.tryParse(priceStr) ?? 0;
    }
    return total;
  }

  void _handleCloseAttempt() {
    if (_step != BookingStep.schedule) {
      _showDiscardModal();
    } else {
      Navigator.pop(context);
    }
  }

  void _showDiscardModal() {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.6),
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('bookingDiscardTitle'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text('bookingDiscardSub'.tr(), style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFff5a5f),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('continue'.tr().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.white, letterSpacing: 1.5)),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pop(this.context);
                  },
                  child: Text('yesDiscard'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF0F172A), letterSpacing: 1)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSchedule() {
    return Column(
      children: [
        Text('November 2025', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 24),
        // Calendar Strip
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(icon: const Icon(Icons.chevron_left, color: Colors.grey), onPressed: () {}),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [2, 3, 4, 5, 6, 7, 8].map((day) {
                    bool isSelected = _selectedDate == day;
                    // Actually, date formatting should be dynamic, but for mock:
                    List<String> dayNames = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
                    String dayName = dayNames[(day - 2) % 7];
                    return GestureDetector(
                      onTap: () => setState(() => _selectedDate = day),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: 55,
                        height: 75,
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFff5a5f) : Colors.white,
                          border: Border.all(color: isSelected ? const Color(0xFFff5a5f) : Colors.grey.shade200),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: isSelected ? [BoxShadow(color: const Color(0xFFff5a5f).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(dayName.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isSelected ? Colors.white : Colors.grey, letterSpacing: 1)),
                            const SizedBox(height: 4),
                            Text(day.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: isSelected ? Colors.white : const Color(0xFF0F172A))),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            IconButton(icon: const Icon(Icons.chevron_right, color: Colors.grey), onPressed: () {}),
          ],
        ),
        const SizedBox(height: 24),
        // Time Periods
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              {"key": "morning", "label": "morning".tr()},
              {"key": "afternoon", "label": "afternoon".tr()},
              {"key": "evening", "label": "evening".tr()},
            ].map((p) {
              bool isSelected = _timePeriodKey == p['key'];
              return GestureDetector(
                onTap: () => setState(() => _timePeriodKey = p['key']!),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: isSelected ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
                  ),
                  child: Text(p['label']!.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFF0F172A) : Colors.grey, letterSpacing: 1)),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 24),
        // Time Slots
        Wrap(
          spacing: 12,
          runSpacing: 12,
          alignment: WrapAlignment.center,
          children: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"].map((t) {
            bool isSelected = _selectedTime == t;
            return GestureDetector(
              onTap: () => setState(() => _selectedTime = t),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFff5a5f).withOpacity(0.05) : Colors.white,
                  border: Border.all(color: isSelected ? const Color(0xFFff5a5f) : Colors.grey.shade200, width: 2),
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Text(t, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isSelected ? const Color(0xFFff5a5f) : Colors.grey.shade600)),
              ),
            );
          }).toList(),
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => setState(() => _step = BookingStep.summary),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFff5a5f),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: const Text('CONTINUAR', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildSummary() {
    return Column(
      children: [
        Text('bookingSummaryTitle'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 24),
        Expanded(
          child: ListView.builder(
            itemCount: widget.selectedServices.length,
            itemBuilder: (context, index) {
              final service = widget.selectedServices[index];
              int proId = _assignments[service['id']] ?? widget.teamMembers.first['id'];
              final pro = widget.teamMembers.firstWhere((p) => p['id'] == proId, orElse: () => widget.teamMembers.first);

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(service['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                              const SizedBox(height: 4),
                              Text('$_selectedDate Nov • $_selectedTime', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1)),
                            ],
                          ),
                        ),
                        Text(service['price'].toString(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                      ],
                    ),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 16), child: Divider(height: 1)),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedProfForDetail = pro;
                              _step = BookingStep.professionalDetail;
                            });
                          },
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundImage: NetworkImage('https://images.unsplash.com/photo-${pro['img']}?q=80&w=150&fit=crop'),
                                radius: 20,
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('bookingProfessionalLabel'.tr(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                                  Row(
                                    children: [
                                      Text(pro['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                                      const SizedBox(width: 8),
                                      Text('bookingAvailable'.tr(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.green)),
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _activeServiceIdForChange = service['id'];
                              _step = BookingStep.staffList;
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFFff5a5f),
                            side: const BorderSide(color: Colors.grey),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text('bookingChange'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const Divider(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${'total'.tr().toUpperCase()}:', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                Text('\$${_totalPrice.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
              ],
            ),
            ElevatedButton(
              onPressed: () => setState(() => _step = BookingStep.paymentWarning),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFff5a5f),
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
              ),
              child: Text('continue'.tr().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 2)),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStaffList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: () => setState(() => _step = BookingStep.summary),
          child: Row(
            children: [
              const Icon(Icons.chevron_left, color: Colors.grey, size: 20),
              const SizedBox(width: 4),
              Text('bookingBackToSummary'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('bookingSelectProfessional'.tr(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 24),
        Expanded(
          child: ListView.builder(
            itemCount: widget.teamMembers.length,
            itemBuilder: (context, index) {
              final pro = widget.teamMembers[index];
              bool isSelected = _assignments[_activeServiceIdForChange] == pro['id'];

              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (_activeServiceIdForChange != null) {
                      _assignments[_activeServiceIdForChange!] = pro['id'];
                    }
                    _step = BookingStep.summary;
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFff5a5f).withOpacity(0.05) : Colors.grey.shade50,
                    border: Border.all(color: isSelected ? const Color(0xFFff5a5f) : Colors.grey.shade200, width: 2),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundImage: NetworkImage('https://images.unsplash.com/photo-${pro['img']}?q=80&w=150&fit=crop'),
                        radius: 24,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pro['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                            Text(pro['role'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 12),
                                const SizedBox(width: 4),
                                Text(pro['rating'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.info_outline, color: Colors.grey),
                        onPressed: () {
                          setState(() {
                            _selectedProfForDetail = pro;
                            _step = BookingStep.professionalDetail;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildProfessionalDetail() {
    if (_selectedProfForDetail == null) return const SizedBox();
    return Column(
      children: [
        Row(
          children: [
            GestureDetector(
              onTap: () => setState(() => _step = BookingStep.summary),
              child: Row(
                children: [
                  const Icon(Icons.chevron_left, color: Colors.grey, size: 20),
                  const SizedBox(width: 4),
                  Text('bookingBackToSummary'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Expanded(
          child: Column(
            children: [
              CircleAvatar(
                backgroundImage: NetworkImage('https://images.unsplash.com/photo-${_selectedProfForDetail!['img']}?q=80&w=300&fit=crop'),
                radius: 50,
              ),
              const SizedBox(height: 16),
              Text(_selectedProfForDetail!['name'], style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
              Text(_selectedProfForDetail!['role'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFff5a5f), letterSpacing: 2)),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStat(_selectedProfForDetail!['rating'], 'Rating'),
                  _buildStat('250+', 'clients'.tr()),
                  _buildStat('8+', 'yearsExp'.tr()),
                ],
              ),
            ],
          ),
        ),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => setState(() => _step = BookingStep.summary),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: Text('bookingSelectProfButton'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildStat(String val, String label) {
    return Column(
      children: [
        Text(val, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
      ],
    );
  }

  Widget _buildPaymentWarning() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 32),
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(color: const Color(0xFFff5a5f).withOpacity(0.1), borderRadius: BorderRadius.circular(24)),
          child: const Icon(Icons.info_outline, color: Color(0xFFff5a5f), size: 40),
        ),
        const SizedBox(height: 24),
        Text('bookingImportant'.tr(), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 16),
        RichText(
          textAlign: TextAlign.center,
          text: TextSpan(
            style: const TextStyle(color: Colors.grey, fontSize: 14, height: 1.5, fontWeight: FontWeight.bold),
            children: [
              TextSpan(text: 'bookingPaymentWarning'.tr(args: ['\$${_totalPrice.toStringAsFixed(2)} USD'])),
            ],
          ),
        ),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => setState(() => _step = BookingStep.checkout),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFff5a5f),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: Text('bookingContinuePay'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 2)),
          ),
        ),
        const SizedBox(height: 16),
        TextButton(
          onPressed: () => setState(() => _step = BookingStep.summary),
          child: Text('cancel'.tr().toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.grey, letterSpacing: 2)),
        ),
      ],
    );
  }

  Widget _buildCheckout() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('bookingSecurePayment'.tr(), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
          child: Row(
            children: [
              const Icon(Icons.credit_card, color: Color(0xFFff5a5f)),
              const SizedBox(width: 12),
              Text('bookingCreditDebit'.tr(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('cardNumber'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 8),
        TextField(
          decoration: InputDecoration(
            hintText: '1234 5678 9012 3456',
            filled: true,
            fillColor: Colors.grey.shade50,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('expiryDate'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'MM/YY',
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('cvv'.tr(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  TextField(
                    decoration: InputDecoration(
                      hintText: '123',
                      filled: true,
                      fillColor: Colors.grey.shade50,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const Spacer(),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _isProcessing ? null : () {
              setState(() => _isProcessing = true);
              Future.delayed(const Duration(seconds: 2), () {
                if (!mounted) return;
                final nav = Navigator.of(context);
                nav.pop();
                nav.push(MaterialPageRoute(builder: (_) => BookingConfirmationScreen(
                  bookingDetails: {
                    'venueName': widget.venue['name'] ?? 'Luxe Hair Studio',
                    'date': '$_selectedDate Nov',
                    'time': _selectedTime,
                    'professional': 'assignedStaff'.tr(),
                    'service': widget.selectedServices.map((s) => s['name']).join(', '),
                  },
                )));
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFff5a5f),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 4,
            ),
            child: _isProcessing 
              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text('payAmount'.tr(args: ['\$${_totalPrice.toStringAsFixed(2)}']), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.white, letterSpacing: 2)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        margin: const EdgeInsets.only(top: 100),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(icon: const Icon(Icons.close, color: Colors.grey), onPressed: _handleCloseAttempt),
              ],
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: SingleChildScrollView(
                  key: ValueKey(_step),
                  child: SizedBox(
                    height: MediaQuery.of(context).size.height * 0.7,
                    child: _buildCurrentStep(),
                  )
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_step) {
      case BookingStep.schedule: return _buildSchedule();
      case BookingStep.summary: return _buildSummary();
      case BookingStep.staffList: return _buildStaffList();
      case BookingStep.professionalDetail: return _buildProfessionalDetail();
      case BookingStep.paymentWarning: return _buildPaymentWarning();
      case BookingStep.checkout: return _buildCheckout();
    }
  }
}
