import 'package:flutter/material.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../utils/booking_utils.dart';
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
  String _payMethod = 'card';

  bool get _isEn => true;

  @override
  void initState() {
    super.initState();
    _res = Map<String, dynamic>.from(widget.reservation);
    _loadGroup();
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
          _res = mapUserBookingGroup(group, locale: locale);
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
  double get _total => (_res['totalPrice'] as num?)?.toDouble() ?? _subtotal + _taxAmount;

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
    final confirmed = _items.where((i) => '${i['status']}' == 'confirmed').toList();
    if (confirmed.isEmpty) return;
    final ok = await _confirm(
      title: _isEn ? 'Cancel All Services' : 'Cancelar Todos los Servicios',
      message: _isEn
          ? 'This will cancel all ${confirmed.length} service(s) in this booking. No individual confirmations will be asked.'
          : 'Se cancelarán los ${confirmed.length} servicio(s) de esta reserva. No se pedirán confirmaciones individuales.',
      confirmLabel: _isEn ? 'Cancel All' : 'Cancelar Todo',
      danger: true,
    );
    if (!ok) return;
    setState(() => _busy = true);
    try {
      for (final item in confirmed) {
        try {
          await _api.cancelBooking('${item['id']}');
        } catch (_) {}
      }
      await _loadGroup();
      widget.onChanged?.call();
      if (mounted) Navigator.pop(context, true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _payNow() async {
    final confirmedIds = _items.where((i) => '${i['status']}' == 'confirmed').map((i) => '${i['id']}').toList();
    if (confirmedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEn ? 'These bookings are already completed.' : 'Estas reservas ya están completadas.')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final method = _payMethod == 'card' ? 'Card Payment' : 'Cash Payment';
      await _api.payBookingGroup(
        bookingIds: confirmedIds,
        paymentMethod: method,
        businessId: '${_res['businessId'] ?? ''}',
      );
      setState(() => _paymentView = _PaymentView.done);
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
          if (status == 'confirmed')
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
          _summaryRow(_isEn ? 'Subtotal' : 'Subtotal', '\$${_subtotal.toStringAsFixed(2)}'),
          const SizedBox(height: 8),
          _summaryRow(_isEn ? 'Tax' : 'Impuesto', '\$${_taxAmount.toStringAsFixed(2)}'),
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
            _isEn ? 'Pay Online Now' : 'Pagar Online Ahora',
            () => setState(() => _paymentView = _PaymentView.select),
          ),
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
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.grey25,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.grey100),
            ),
            child: Center(
              child: Text(
                _isEn ? 'Waiting for Venue' : 'Esperando al Establecimiento',
                style: AppTypography.body100.copyWith(color: AppColors.grey400, fontWeight: FontWeight.w800, letterSpacing: 1),
              ),
            ),
          ),
        ];
      default:
        return [];
    }
  }

  Widget _buildPaymentSelect() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          onTap: () => setState(() => _payMethod = _payMethod == 'card' ? 'cash' : 'card'),
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primary500, width: 2),
              color: AppColors.primary50,
            ),
            child: Column(
              children: [
                Icon(
                  _payMethod == 'card' ? Icons.credit_card_rounded : Icons.payments_rounded,
                  color: AppColors.primary500,
                  size: 28,
                ),
                const SizedBox(height: 6),
                Text(
                  _payMethod == 'card'
                      ? (_isEn ? 'Pay with Card' : 'Pagar con Tarjeta')
                      : (_isEn ? 'Pay with Cash' : 'Pagar en Efectivo'),
                  style: AppTypography.body100.copyWith(color: AppColors.primary500, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        _darkButton(
          _busy ? (_isEn ? 'Processing...' : 'Procesando...') : (_isEn ? 'Confirm & Pay' : 'Confirmar y Pagar'),
          _busy ? null : _payNow,
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            if (_status == 'confirmed')
              Expanded(
                child: OutlinedButton(
                  onPressed: _busy ? null : _cancelAllConfirmed,
                  style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: Color(0xFFFECACA))),
                  child: Text(_isEn ? 'Cancel All' : 'Cancelar Todo', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800)),
                ),
              ),
            if (_status == 'confirmed') const SizedBox(width: 8),
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
            Icons.shield_outlined,
            _isEn ? 'Secure encrypted payments powered by Rezervame.' : 'Pagos seguros y encriptados por Rezervame.',
          ),
          const SizedBox(height: 12),
          _policyRow(
            Icons.schedule_rounded,
            _isEn ? 'Cancellations must be done 24h before.' : 'Cancelaciones deben hacerse 24h antes.',
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
