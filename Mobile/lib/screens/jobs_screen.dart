import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';
import '../widgets/list_pagination_bar.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final ApiRepository _repo = ApiRepository();
  List<Map<String, dynamic>> _jobs = [];
  bool _loading = true;
  String? _error;
  int _page = 1;
  int _totalPages = 1;
  int _total = 0;
  static const int _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({int? page}) async {
    final nextPage = page ?? _page;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _repo.fetchJobs(page: nextPage, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _page = nextPage;
        _jobs = (res['data'] as List<Map<String, dynamic>>?) ?? [];
        _total = (res['total'] as int?) ?? _jobs.length;
        _totalPages = (res['totalPages'] as int?) ?? 1;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
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
          'jobsTitle'.tr(),
          style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        color: AppColors.primary500,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary500))
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      Text('jobsLoadError'.tr(), style: AppTypography.body200.copyWith(color: AppColors.grey500)),
                      const SizedBox(height: 8),
                      Text(_error!, style: AppTypography.body100.copyWith(color: AppColors.grey400)),
                    ],
                  )
                : CustomScrollView(
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.all(24),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [AppColors.grey900, AppColors.grey800],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.grey900.withValues(alpha: 0.2),
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
                                    style: AppTypography.screenTitle.copyWith(color: AppColors.white),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'jobsSub'.tr(),
                                    style: AppTypography.screenSubtitle.copyWith(color: Colors.white70, height: 1.5),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 48),
                            Text(
                              'jobsOpenPositions'.tr(),
                              style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 0.2),
                            ),
                            const SizedBox(height: 24),
                          ]),
                        ),
                      ),
                      if (_jobs.isEmpty)
                        SliverFillRemaining(
                          hasScrollBody: false,
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              child: Text(
                                'jobsEmpty'.tr(),
                                textAlign: TextAlign.center,
                                style: AppTypography.body200.copyWith(color: AppColors.grey500),
                              ),
                            ),
                          ),
                        )
                      else ...[
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildJobCard(context, _jobs[index]),
                              childCount: _jobs.length,
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: ListPaginationBar(
                            page: _page,
                            totalPages: _totalPages,
                            total: _total,
                            onPageChange: (p) => _load(page: p),
                          ),
                        ),
                      ],
                    ],
                  ),
      ),
    );
  }

  Future<void> _applyToJob(Map<String, dynamic> job) async {
    final applyUrl = '${job['applyUrl'] ?? job['applicationUrl'] ?? ''}'.trim();
    if (applyUrl.isNotEmpty) {
      final uri = Uri.tryParse(applyUrl);
      if (uri != null && await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        return;
      }
    }
    final title = '${job['title'] ?? 'Position'}';
    final mailUri = Uri(
      scheme: 'mailto',
      path: 'careers@rezervame.com',
      queryParameters: {'subject': 'Application: $title'},
    );
    if (await canLaunchUrl(mailUri)) {
      await launchUrl(mailUri);
      return;
    }
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Email careers@rezervame.com to apply.'), behavior: SnackBarBehavior.floating),
    );
  }

  Widget _buildJobCard(BuildContext context, Map<String, dynamic> job) {
    final title = '${job['title'] ?? ''}';
    final location = '${job['location'] ?? ''}';
    final desc = '${job['description'] ?? ''}'.trim();
    final excerpt = desc.length > 160 ? '${desc.substring(0, 160)}…' : desc;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.grey50, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
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
                    Text(
                      title,
                      style: AppTypography.sectionTitle.copyWith(color: AppColors.grey900),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 14, color: AppColors.grey300),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            location,
                            style: AppTypography.body100.copyWith(color: AppColors.grey500),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => _applyToJob(job),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 0),
                ),
                child: Text(
                  'jobApply'.tr(),
                  style: AppTypography.heading100.copyWith(color: AppColors.primary500, letterSpacing: 1),
                ),
              ),
            ],
          ),
          if (excerpt.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              excerpt,
              style: AppTypography.body100.copyWith(color: AppColors.grey400, height: 1.35),
            ),
          ],
        ],
      ),
    );
  }
}
