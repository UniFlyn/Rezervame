import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Status chips aligned with Web profile reservations (`pending`, `confirmed`, etc.).
class ReservationStatusBadge extends StatelessWidget {
  const ReservationStatusBadge({
    super.key,
    required this.status,
    this.compact = false,
    this.forModal = false,
  });

  final String status;
  final bool compact;
  /// Modal uses "Awaiting Payment" for confirmed; list cards use "Confirmed".
  final bool forModal;

  @override
  Widget build(BuildContext context) {
    final s = status.toLowerCase();
    final style = _styleFor(s);
    final label = _labelFor(s, Localizations.localeOf(context).languageCode);

    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 10 : 14, vertical: compact ? 5 : 7),
      decoration: BoxDecoration(
        color: style.bg,
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: style.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(style.icon, size: compact ? 11 : 13, color: style.fg),
          const SizedBox(width: 5),
          Text(
            label,
            style: AppTypography.body100.copyWith(
              color: style.fg,
              fontWeight: FontWeight.w800,
              fontSize: compact ? 9 : 10,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  String _labelFor(String s, String lang) {
    final en = lang != 'es';
    switch (s) {
      case 'pending':
        return en ? 'Awaiting Approval' : 'Esperando Aprobación';
      case 'confirmed':
        if (forModal) return en ? 'Awaiting Payment' : 'Esperando Pago';
        return en ? 'Confirmed' : 'Confirmada';
      case 'cash_at_venue':
        return en ? 'Pay at Venue' : 'Pago en Local';
      case 'paid':
        return en ? 'Paid' : 'Pagado';
      case 'rescheduled':
        return en ? 'Rescheduled' : 'Reagendada';
      case 'completed':
        return en ? 'Completed' : 'Completado';
      case 'cancelled':
        return en ? 'Cancelled' : 'Cancelado';
      default:
        return s;
    }
  }

  _BadgeStyle _styleFor(String s) {
    switch (s) {
      case 'pending':
        return _BadgeStyle(
          bg: const Color(0xFFFFFBEB),
          fg: const Color(0xFFD97706),
          border: const Color(0xFFFDE68A),
          icon: Icons.schedule_rounded,
        );
      case 'confirmed':
        return _BadgeStyle(
          bg: const Color(0xFFECFDF5),
          fg: const Color(0xFF047857),
          border: const Color(0xFFA7F3D0),
          icon: Icons.check_circle_outline_rounded,
        );
      case 'cash_at_venue':
        return _BadgeStyle(
          bg: const Color(0xFFFFFBEB),
          fg: const Color(0xFFD97706),
          border: const Color(0xFFFDE68A),
          icon: Icons.payments_outlined,
        );
      case 'paid':
        return _BadgeStyle(
          bg: const Color(0xFFEFF6FF),
          fg: const Color(0xFF2563EB),
          border: const Color(0xFFBFDBFE),
          icon: Icons.credit_card_rounded,
        );
      case 'rescheduled':
        return _BadgeStyle(
          bg: const Color(0xFFFFFBEB),
          fg: const Color(0xFFD97706),
          border: const Color(0xFFFDE68A),
          icon: Icons.refresh_rounded,
        );
      case 'completed':
        return _BadgeStyle(
          bg: const Color(0xFFECFDF5),
          fg: const Color(0xFF047857),
          border: const Color(0xFFA7F3D0),
          icon: Icons.check_circle_outline_rounded,
        );
      case 'cancelled':
        return _BadgeStyle(
          bg: const Color(0xFFFEF2F2),
          fg: AppColors.error,
          border: const Color(0xFFFECACA),
          icon: Icons.close_rounded,
        );
      default:
        return _BadgeStyle(
          bg: AppColors.grey50,
          fg: AppColors.grey600,
          border: AppColors.grey200,
          icon: Icons.info_outline_rounded,
        );
    }
  }
}

class _BadgeStyle {
  const _BadgeStyle({
    required this.bg,
    required this.fg,
    required this.border,
    required this.icon,
  });

  final Color bg;
  final Color fg;
  final Color border;
  final IconData icon;
}
