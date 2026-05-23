import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

/// Shared prev/next control for paginated lists.
class ListPaginationBar extends StatelessWidget {
  const ListPaginationBar({
    super.key,
    required this.page,
    required this.totalPages,
    required this.onPageChange,
    this.total,
  });

  final int page;
  final int totalPages;
  final int? total;
  final ValueChanged<int> onPageChange;

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: page > 1 ? () => onPageChange(page - 1) : null,
            icon: const Icon(Icons.chevron_left_rounded),
          ),
          Text(
            '$page / $totalPages',
            style: AppTypography.body200.copyWith(fontWeight: FontWeight.w700),
          ),
          if (total != null && total! > 0)
            Text(
              '  ($total)',
              style: AppTypography.body100.copyWith(color: AppColors.grey400),
            ),
          IconButton(
            onPressed: page < totalPages ? () => onPageChange(page + 1) : null,
            icon: const Icon(Icons.chevron_right_rounded),
          ),
        ],
      ),
    );
  }
}
