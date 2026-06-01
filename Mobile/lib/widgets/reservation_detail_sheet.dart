import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/booking_utils.dart';
import '../utils/cancellation_policy.dart';
import '../utils/payment_config.dart';
import '../utils/payment_method.dart';
import 'chained_network_image.dart';
import 'reservation_status_badge.dart';
import '../screens/invoices_screen.dart';
import 'review_experience_sheet.dart';

enum _PaymentView { none, select, done }

/// Web profile reservation detail modal — pay, cancel, complete, reschedule (no QR).
Future<bool?> showReservationDetailSheet(
  BuildContext context, {
  required Map<String, dynamic> reservation,
  VoidCallback? onChanged,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _ReservationDetailSheet(
      reservation: reservation,
      onChanged: onChanged,
    ),
  );
}

class _ReservationDetailSheet extends StatefulWidget {
  const _ReservationDetailSheet({
    required this.reservation,
    this.onChanged,
  });

  final Map<String, dynamic> reservation;
  final VoidCallback? onChanged;

  @override
  State<_ReservationDetailSheet> createState() => _ReservationDetailSheetState();
}

class _ReservationDetailSheetState extends State<_ReservationDetailSheet> {
  final _api = ApiRepository();
  late Map<String, dynamic> _res;
  bool _loading = true;
  bool _busy = false;
  _PaymentView _paymentView = _PaymentView.none;
  String _payMethod = 'pay_at_venue';
  double _commissionPercent = 15;
  List<Map<String, dynamic>> _payMethods = [
    {'id': 'wompi', 'label': 'Card', 'enabled': false},
    {'id': 'yappy', 'label': 'Yappy', 'enabled': false},
    {'id': 'pay_at_venue', 'label': 'Pay by visit', 'enabled': true},
  ];

  bool get _isEn => Localizations.localeOf(context).languageCode.startsWith('en');

  @override
  void initState() {
    super.initState();
    _res = Map<String, dynamic>.from(widget.reservation);
    _loadPaymentConfig();
    _loadGroup();
  }

  Future<void> _loadPaymentConfig() async {
    try {
      final raw = await _api.fetchPaymentConfig();
      if (!mounted) return;
      final cfg = normalizePaymentConfig(raw);
      final methods = (cfg['methods'] as List<dynamic>?)
              ?.whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList() ??
          _payMethods;
      final selectable = selectablePaymentMethods(methods);
      setState(() {
        _payMethods = selectable.isNotEmpty ? selectable : methods;
        _commissionPercent = (cfg['defaultCommission'] as num?)?.toDouble() ?? 15;
        _payMethod = pickDefaultPaymentMethodId(methods);
      });
    } catch (_) {}
  }

  bool _methodEnabled(String id) {
    final m = _payMethods.where((x) => '${x['id']}' == id).toList();
    if (m.isEmpty) return true;
    return isPaymentMethodSelectable(m.first);
  }

  Future<void> _loadGroup() async {
    final id = '${_res['id'] ?? ''}';
    if (id.isEmpty) {
      setState(() => _loading = false);
      return;
    }
    try {
      final group = await _api.fetchBookingGroup(id);
      if (mounted && group.isNotEmpty) {
        final locale = Localizations.localeOf(context).languageCode;
        setState(() {
          _res = mapUserBookingGroup(group, locale: locale, commissionPercent: _commissionPercent);
          _loading = false;
        });
      } else if (mounted) {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  List<String> get _heroUrls {
    final img = '${_res['img'] ?? _res['imageUrl'] ?? ''}';
    if (img.isNotEmpty) return ChainedNetworkImage.chainFrom(img, null, w: 800);
    return ChainedNetworkImage.urlsForUnsplashId('', w: 800);
  }

  List<Map<String, dynamic>> get _items =>
      ((_res['items'] as List<dynamic>?) ?? []).cast<Map<String, dynamic>>();

  String get _status => '${_res['status'] ?? ''}'.toLowerCase();

  double get _subtotal => (_res['subtotal'] as num?)?.toDouble() ?? 0;
  double get _taxAmount => (_res['taxAmount'] as num?)?.toDouble() ?? 0;
  double get _taxPercentValue => (_res['taxPercentage'] as num?)?.toDouble() ?? 0;
  double get _total => (_res['totalPrice'] as num?)?.toDouble() ?? _subtotal + _taxAmount;

  bool get _canCancelAll {
    if (_res['canCancelAny'] == true) return true;
    return _items.any((i) => i['canCancel'] == true);
  }

  bool _isCancellableItem(Map<String, dynamic> item) {
    if (item['canCancel'] == true) return true;
    final policy = CancellationPolicyConfig(
      allowed: _res['cancellationAllowed'] != false,
      hoursBefore: (_res['cancellationHoursBefore'] as num?)?.toInt() ?? 24,
    );
    final appt = DateTime.tryParse('${item['appointmentAt'] ?? ''}');
    return canCustomerCancelBooking(
      rawStatus: '${item['rawStatus'] ?? item['status']}',
      appointmentAt: appt,
      transactionId: item['transactionId']?.toString(),
      policy: policy,
    );
  }

  String get _cancellationPolicyMessage {
    final msg = '${_res['cancellationPolicyMessage'] ?? ''}'.trim();
    if (msg.isNotEmpty) return msg;
    final policy = CancellationPolicyConfig(
      allowed: _res['cancellationAllowed'] != false,
      hoursBefore: (_res['cancellationHoursBefore'] as num?)?.toInt() ?? 24,
    );
    return formatCancellationPolicyMessage(policy, isEn: _isEn);
  }

  Future<bool> _confirm({
    required String title,
    required String message,
    required String confirmLabel,
    bool danger = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title, style: AppTypography.heading200),
        content: Text(message, style: AppTypography.body200),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(_isEn ? 'Go Back' : 'Volver')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: danger ? AppColors.error : AppColors.primary500),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _cancelItem(String bookingId) async {
    final ok = await _confirm(
      title: _isEn ? 'Cancel Service' : 'Cancelar Servicio',
      message: _isEn ? 'Are you sure you want to cancel this service?' : '¿Seguro que deseas cancelar este servicio?',
      confirmLabel: _isEn ? 'Cancel' : 'Cancelar',
      danger: true,
    );
    if (!ok) return;
    setState(() => _busy = true);
    try {
      await _api.cancelBooking(bookingId);
      await _loadGroup();
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancelAllConfirmed() async {
    final cancellable = _items.where(_isCancellableItem).toList();
    if (cancellable.isEmpty) return;
    final ok = await _confirm(
      title: _isEn ? 'Cancel All Services' : 'Cancelar Todos los Servicios',
      message: _isEn
          ? 'This will cancel all ${cancellable.length} service(s) in this booking. No individual confirmations will be asked.'
          : 'Se cancelarán los ${cancellable.length} servicio(s) de esta reserva. No se pedirán confirmaciones individuales.',
      confirmLabel: _isEn ? 'Cancel All' : 'Cancelar Todo',
      danger: true,
    );
    if (!ok) return;
    setState(() => _busy = true);
    try {
      final ids = cancellable.map((i) => '${i['id']}').toList();
      await _api.cancelBookingGroup(ids);
      await _loadGroup();
      widget.onChanged?.call();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _payNow() async {
    final payableIds = _items
        .where((i) {
          final s = '${i['status']}';
          return s == 'confirmed' || s == 'rescheduled';
        })
        .map((i) => '${i['id']}')
        .toList();
    if (payableIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEn
                ? 'There are no services awaiting payment in this reservation.'
                : 'No hay servicios pendientes de pago en esta reserva.',
          ),
        ),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final method = apiPaymentMethodForPayTab(_payMethod);
      if (_payMethod != 'cash' && _payMethod != 'pay_at_venue') {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _isEn
                    ? 'Online payment is not available yet. Please try again later.'
                    : 'El pago en línea no está disponible todavía. Inténtalo más tarde.',
              ),
            ),
          );
        }
        return;
      }

      setState(() => _paymentView = _PaymentView.done);
      await _loadGroup();
      widget.onChanged?.call();
      if (mounted && (_payMethod == 'cash' || _payMethod == 'pay_at_venue')) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEn
                  ? 'Please bring \$${_total.toStringAsFixed(2)} in cash to your appointment.'
                  : 'Lleva \$${_total.toStringAsFixed(2)} en efectivo a tu cita.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _acceptReschedule() async {
    setState(() => _busy = true);
    try {
      for (final item in _items) {
        await _api.acceptReschedule('${item['id']}');
      }
      await _loadGroup();
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _markCompleted() async {
    setState(() => _busy = true);
    try {
      for (final item in _items) {
        await _api.completeBooking('${item['id']}');
      }
      await _loadGroup();
      widget.onChanged?.call();
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.sizeOf(context).height * 0.92;
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
      ),
      child: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
          : Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: Container(
                    color: const Color(0xFFF8FAFC),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          _buildHeroCard(),
                          const SizedBox(height: 16),
                          _buildPaymentPanel(),
                          const SizedBox(height: 16),
                          _buildSafetyPanel(),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
      child: Row(
        children: [
          TextButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.chevron_left_rounded, size: 22),
            label: Text(_isEn ? 'Back' : 'Volver', style: AppTypography.body200.copyWith(fontWeight: FontWeight.w700)),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  '${_res['venueName']}',
                  style: AppTypography.body100.copyWith(fontWeight: FontWeight.w900, letterSpacing: 1),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text('#${_res['refNumber']}', style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 10)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded, color: AppColors.grey400),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.grey100),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 180,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ChainedNetworkImage(urls: _heroUrls, fit: BoxFit.cover),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Color(0xCC0F172A), Colors.transparent],
                    ),
                  ),
                ),
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_res['venueName']}',
                        style: AppTypography.heading200.copyWith(color: Colors.white, fontWeight: FontWeight.w900),
                      ),
                      if ('${_res['address'] ?? ''}'.isNotEmpty)
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, color: Colors.white70, size: 14),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                '${_res['address']}',
                                style: AppTypography.body100.copyWith(color: Colors.white70),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.grey25,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.grey100),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.grey100),
                        ),
                        child: const Icon(Icons.calendar_today_outlined, color: AppColors.primary500, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isEn ? 'Date & Time' : 'Fecha y Hora',
                              style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800, fontSize: 10),
                            ),
                            Text(
                              '${_res['date']} at ${_res['time']}',
                              style: AppTypography.body200.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                      ReservationStatusBadge(status: _status, forModal: true),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  _isEn ? 'Service Details' : 'Detalles del Servicio',
                  style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800, letterSpacing: 1.5),
                ),
                const SizedBox(height: 12),
                ..._items.map(_buildServiceRow),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceRow(Map<String, dynamic> item) {
    final status = '${item['status']}';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.grey25,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.grey100),
            ),
            child: Text(
              () {
                final name = '${item['name']}';
                return name.isNotEmpty ? name[0].toUpperCase() : 'S';
              }(),
              style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w900),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${item['name']}', style: AppTypography.body200.copyWith(fontWeight: FontWeight.w800)),
                Text(
                  '${item['customerName'] ?? _res['customerName'] ?? 'Customer'} • ${item['staffName'] ?? 'Staff'}',
                  style: AppTypography.body100.copyWith(color: AppColors.grey400, fontSize: 9, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          Text('\$${item['price']}', style: AppTypography.body200.copyWith(fontWeight: FontWeight.w900)),
          const SizedBox(width: 8),
          if (status == 'paid')
            _itemStatusChip(_isEn ? 'Paid' : 'Pagado', const Color(0xFF0891B2), Icons.credit_card_rounded)
          else if (status == 'cash_at_venue')
            _itemStatusChip(_isEn ? 'Pay at Venue' : 'Pago en Local', const Color(0xFFD97706), Icons.payments_outlined)
          else if (_isCancellableItem(item))
            TextButton(
              onPressed: _busy ? null : () => _cancelItem('${item['id']}'),
              child: Text(
                _isEn ? 'Cancel' : 'Cancelar',
                style: AppTypography.body100.copyWith(color: AppColors.error, fontWeight: FontWeight.w800, fontSize: 9),
              ),
            )
          else if (status == 'completed' && item['isReviewed'] == true)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle_outline, size: 14, color: AppColors.success),
                const SizedBox(width: 4),
                Text(
                  _isEn ? 'Reviewed' : 'Calificado',
                  style: AppTypography.body100.copyWith(color: AppColors.success, fontSize: 9, fontWeight: FontWeight.w800),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _itemStatusChip(String label, Color color, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 4),
        Text(
          label.toUpperCase(),
          style: AppTypography.body100.copyWith(color: color, fontWeight: FontWeight.w800, fontSize: 9, letterSpacing: 0.5),
        ),
      ],
    );
  }

  Widget _buildPaymentPanel() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.grey100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _isEn ? 'Payment Summary' : 'Resumen de Pago',
            style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800, letterSpacing: 1.5),
          ),
          const SizedBox(height: 16),
          _summaryRow(_isEn ? 'Services' : 'Servicios', '\$${_subtotal.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _summaryRow(
            _taxPercentValue > 0
                ? (_isEn ? 'Tax (${_taxPercentValue.toStringAsFixed(0)}%)' : 'Impuesto (${_taxPercentValue.toStringAsFixed(0)}%)')
                : (_isEn ? 'Tax' : 'Impuesto'),
            '\$${_taxAmount.toStringAsFixed(2)}',
          ),
          const Divider(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(_isEn ? 'Total' : 'Total', style: AppTypography.heading200.copyWith(fontWeight: FontWeight.w900)),
              Text(
                '\$${_total.toStringAsFixed(2)}',
                style: AppTypography.heading200.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w900),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_paymentView == _PaymentView.done) _buildPaidSuccess(),
          if (_paymentView == _PaymentView.none) ..._buildStatusActions(),
          if (_paymentView == _PaymentView.select) _buildPaymentSelect(),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w700)),
        Text(value, style: AppTypography.body200.copyWith(fontWeight: FontWeight.w800)),
      ],
    );
  }

  List<Widget> _buildStatusActions() {
    switch (_status) {
      case 'confirmed':
        return [
          _infoBox(
            _isEn ? 'Approved' : 'Aprobado',
            _isEn ? 'Your booking is approved. Please pay online to confirm.' : 'Tu cita está aprobada. Por favor paga online para confirmar.',
            const Color(0xFFECFDF5),
            const Color(0xFF047857),
          ),
          const SizedBox(height: 12),
          _primaryButton(
            _isEn ? 'Review & Pay' : 'Revisar y Pagar',
            () => setState(() => _paymentView = _PaymentView.select),
          ),
          if (_canCancelAll) ...[
            const SizedBox(height: 10),
            _cancelAllButton(compact: false),
          ],
        ];
      case 'rescheduled':
        return [
          _infoBox(
            _isEn ? 'Reschedule Proposed' : 'Reagendamiento Propuesto',
            _isEn ? 'The venue has proposed a new time. Do you accept?' : 'El establecimiento ha propuesto un nuevo horario. ¿Aceptas?',
            const Color(0xFFFFFBEB),
            const Color(0xFFD97706),
          ),
          const SizedBox(height: 12),
          _primaryButton(_isEn ? 'Accept New Time' : 'Aceptar Nuevo Horario', _acceptReschedule),
        ];
      case 'cash_at_venue':
        return [
          _infoBox(
            _isEn ? 'Pay at the venue' : 'Pago en el local',
            _isEn
                ? 'Your booking is confirmed. Please bring \$${_total.toStringAsFixed(2)} in cash when you arrive.\n\nThe venue will confirm your cash payment when you complete the service.'
                : 'Tu reserva está confirmada. Lleva \$${_total.toStringAsFixed(2)} en efectivo cuando llegues.\n\nEl local confirmará tu pago en efectivo al completar el servicio.',
            const Color(0xFFFFFBEB),
            const Color(0xFFD97706),
          ),
        ];
      case 'paid':
        return [
          _infoBox(
            _isEn ? 'Payment Confirmed' : 'Pago Confirmado',
            _isEn ? 'Your appointment is ready. Mark as completed after the service.' : 'Tu cita está lista. Márcala como completada después del servicio.',
            const Color(0xFFECFEFF),
            const Color(0xFF0891B2),
          ),
          const SizedBox(height: 12),
          _darkButton(_isEn ? 'Mark as Completed' : 'Marcar como Completado', _markCompleted),
        ];
      case 'completed':
        if (_res['isReviewed'] == true) return [];
        return [
          _infoBox(
            _isEn ? 'Service Completed' : 'Servicio Completado',
            _isEn ? 'How was your experience today?' : '¿Cómo fue tu experiencia hoy?',
            const Color(0xFFEFF6FF),
            const Color(0xFF2563EB),
            center: true,
          ),
          const SizedBox(height: 12),
          _primaryButton(_isEn ? 'Rate Experience' : 'Calificar Experiencia', () async {
            final ok = await showReviewExperienceSheet(context, reservation: _res);
            if (ok) {
              await _loadGroup();
              widget.onChanged?.call();
              if (mounted) Navigator.pop(context, true);
            }
          }),
        ];
      case 'pending':
        return [
          _infoBox(
            _isEn ? 'Waiting for Venue' : 'Esperando al Establecimiento',
            _isEn
                ? 'You can cancel anytime before the venue accepts.'
                : 'Puedes cancelar en cualquier momento antes de que el local acepte.',
            AppColors.grey25,
            AppColors.grey500,
            center: true,
          ),
          const SizedBox(height: 12),
          _cancelAllButton(compact: false, label: _isEn ? 'Cancel Reservation' : 'Cancelar Reserva'),
        ];
      default:
        return [];
    }
  }

  Widget _buildPaymentSelect() {
    final tabs = ['card', 'yappy', 'cash'].where(_methodEnabled).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: tabs.map((id) {
            final selected = _payMethod == id;
            String label;
            IconData icon;
            switch (id) {
              case 'yappy':
                label = _isEn ? 'Yappy' : 'Yappy';
                icon = Icons.account_balance_wallet_outlined;
                break;
              case 'cash':
                label = _isEn ? 'Cash' : 'Efectivo';
                icon = Icons.payments_outlined;
                break;
              default:
                label = _isEn ? 'Card' : 'Tarjeta';
                icon = Icons.credit_card_rounded;
            }
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: id != tabs.last ? 8 : 0),
                child: InkWell(
                  onTap: () => setState(() => _payMethod = id),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: selected ? AppColors.primary500 : AppColors.grey100,
                        width: selected ? 2 : 1,
                      ),
                      color: selected ? AppColors.primary50 : AppColors.white,
                    ),
                    child: Column(
                      children: [
                        Icon(icon, color: AppColors.primary500, size: 22),
                        const SizedBox(height: 4),
                        Text(
                          label,
                          style: AppTypography.body100.copyWith(
                            fontWeight: FontWeight.w800,
                            color: selected ? AppColors.primary500 : AppColors.grey500,
                            fontSize: 9,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        if (_payMethod == 'yappy') ...[
          const SizedBox(height: 12),
          _infoBox(
            _isEn ? 'Yappy' : 'Yappy',
            _isEn
                ? 'Complete transfer in the Yappy app, then confirm payment here.'
                : 'Completa la transferencia en Yappy y luego confirma el pago aquí.',
            const Color(0xFFEFF6FF),
            const Color(0xFF2563EB),
          ),
        ],
        if (_payMethod == 'cash') ...[
          const SizedBox(height: 12),
          _infoBox(
            _isEn ? 'Cash at venue' : 'Efectivo en el local',
            _isEn
                ? 'Cash payment is collected at the venue when you arrive for your appointment.'
                : 'El pago en efectivo se recoge en el local cuando llegues a tu cita.',
            const Color(0xFFFFFBEB),
            const Color(0xFFD97706),
          ),
        ],
        const SizedBox(height: 12),
        _darkButton(
          _busy ? (_isEn ? 'Processing...' : 'Procesando...') : (_isEn ? 'Pay \$${_total.toStringAsFixed(2)}' : 'Pagar \$${_total.toStringAsFixed(2)}'),
          _busy ? null : _payNow,
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            if (_canCancelAll) Expanded(child: _cancelAllButton(compact: true)),
            if (_canCancelAll) const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _paymentView = _PaymentView.none),
                child: Text(_isEn ? 'Back' : 'Volver', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPaidSuccess() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA7F3D0)),
      ),
      child: Column(
        children: [
          const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 32),
          const SizedBox(height: 8),
          Text(
            _isEn ? 'Paid Successfully!' : '¡Pago Exitoso!',
            style: AppTypography.body200.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push<void>(
                context,
                MaterialPageRoute<void>(builder: (_) => const InvoicesScreen()),
              );
            },
            child: Text(
              _isEn ? 'View Invoices' : 'Ver Facturas',
              style: AppTypography.body100.copyWith(
                color: AppColors.success,
                fontWeight: FontWeight.w800,
                decoration: TextDecoration.underline,
                decorationColor: AppColors.success,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _cancelAllButton({required bool compact, String? label}) {
    final text = label ?? (_isEn ? 'Cancel All' : 'Cancelar Todo');
    if (compact) {
      return OutlinedButton(
        onPressed: _busy ? null : _cancelAllConfirmed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          side: const BorderSide(color: Color(0xFFFECACA)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        child: Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
      );
    }
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: _busy ? null : _cancelAllConfirmed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.error,
          backgroundColor: const Color(0xFFFEF2F2),
          side: const BorderSide(color: Color(0xFFFECACA)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: Text(
          text,
          style: AppTypography.buttonMedium.copyWith(color: AppColors.error, fontSize: 11, letterSpacing: 0.8),
        ),
      ),
    );
  }

  Widget _buildSafetyPanel() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.grey900,
        borderRadius: BorderRadius.circular(32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _isEn ? 'Safety & Policy' : 'Seguridad y Políticas',
            style: AppTypography.body100.copyWith(color: Colors.white38, fontWeight: FontWeight.w800, letterSpacing: 1.5),
          ),
          const SizedBox(height: 16),
          _policyRow(
            _status == 'cash_at_venue' ? Icons.payments_outlined : Icons.shield_outlined,
            _status == 'cash_at_venue'
                ? (_isEn
                    ? 'Cash payment is collected at the venue when you arrive for your appointment.'
                    : 'El pago en efectivo se recoge en el local cuando llegues a tu cita.')
                : (_isEn
                    ? 'Secure encrypted payments powered by Rezervame.'
                    : 'Pagos seguros y encriptados por Rezervame.'),
          ),
          const SizedBox(height: 12),
          _policyRow(
            Icons.schedule_rounded,
            _cancellationPolicyMessage,
          ),
        ],
      ),
    );
  }

  Widget _policyRow(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.primary500, size: 18),
        const SizedBox(width: 12),
        Expanded(child: Text(text, style: AppTypography.body100.copyWith(color: Colors.white70, height: 1.4))),
      ],
    );
  }

  Widget _infoBox(String title, String body, Color bg, Color fg, {bool center = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: fg.withValues(alpha: 0.2)),
      ),
      child: center
          ? Column(
              children: [
                Text(title, style: AppTypography.body100.copyWith(color: fg, fontWeight: FontWeight.w900, fontSize: 10)),
                const SizedBox(height: 4),
                Text(body, textAlign: TextAlign.center, style: AppTypography.body100.copyWith(color: fg.withValues(alpha: 0.85))),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.body100.copyWith(color: fg, fontWeight: FontWeight.w900, fontSize: 10)),
                const SizedBox(height: 4),
                Text(body, style: AppTypography.body100.copyWith(color: fg.withValues(alpha: 0.85))),
              ],
            ),
    );
  }

  Widget _primaryButton(String label, VoidCallback? onPressed) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _busy ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary500,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: Text(label, style: AppTypography.buttonMedium.copyWith(color: AppColors.white, letterSpacing: 0.8)),
      ),
    );
  }

  Widget _darkButton(String label, VoidCallback? onPressed) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _busy ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.grey900,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: _busy
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(label, style: AppTypography.buttonMedium.copyWith(color: AppColors.white, letterSpacing: 0.8)),
      ),
    );
  }
}
