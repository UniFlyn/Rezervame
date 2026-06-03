import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../data/api_repository.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class FamilyMembersScreen extends StatefulWidget {
  const FamilyMembersScreen({super.key});

  @override
  State<FamilyMembersScreen> createState() => _FamilyMembersScreenState();
}

class _FamilyMembersScreenState extends State<FamilyMembersScreen> {
  final ApiRepository _api = ApiRepository();
  List<Map<String, dynamic>> _familyMembers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    setState(() => _loading = true);
    try {
      final members = await _api.fetchFamilyMembers();
      setState(() {
        _familyMembers = members;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load family members: ${e.toString().replaceAll('Exception: ', '')}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _addMember(String name, String ageStr, String genderKey) async {
    final age = int.tryParse(ageStr) ?? 0;
    if (name.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name cannot be empty'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    try {
      // Send the translated gender string to backend, e.g. "Male" or "Masculino" depending on the current locale
      final genderVal = genderKey.tr();
      await _api.createFamilyMember(
        name: name,
        age: age,
        gender: genderVal,
      );
      await _loadMembers();
    } catch (e) {
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Error'),
          content: Text(e.toString().replaceAll('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  Future<void> _removeMember(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('deleteFamilyMember'.tr()),
        content: const Text('Are you sure you want to delete this family member?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('cancel'.tr()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
            child: Text('deleteFamilyMember'.tr()),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      await _api.deleteFamilyMember(id);
      await _loadMembers();
    } catch (e) {
      setState(() => _loading = false);
      if (!mounted) return;
      showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Error'),
          content: Text(e.toString().replaceAll('Exception: ', '')),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  void _showEditMemberModal(Map<String, dynamic> member) {
    String name = '${member['name'] ?? ''}';
    String age = '${member['age'] ?? ''}';
    String gender = 'genderMale';
    final g = '${member['gender'] ?? ''}'.toLowerCase();
    if (g.contains('fem') || g.contains('mujer')) {
      gender = 'genderFemale';
    } else if (g.contains('other') || g.contains('otr')) {
      gender = 'genderOther';
    }
    bool submitting = false;
    final id = '${member['id']}';

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
            left: 24,
            right: 24,
          ),
          decoration: const BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit family member', style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
              const SizedBox(height: 24),
              TextField(
                decoration: InputDecoration(labelText: 'fullName'.tr(), filled: true, fillColor: AppColors.grey25),
                controller: TextEditingController(text: name),
                onChanged: (val) => name = val,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(labelText: 'age'.tr(), filled: true, fillColor: AppColors.grey25),
                      keyboardType: TextInputType.number,
                      controller: TextEditingController(text: age),
                      onChanged: (val) => age = val,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: gender,
                      decoration: InputDecoration(labelText: 'gender'.tr(), filled: true, fillColor: AppColors.grey25),
                      items: ['genderMale', 'genderFemale', 'genderOther']
                          .map((g) => DropdownMenuItem(value: g, child: Text(g.tr())))
                          .toList(),
                      onChanged: (val) => setModalState(() => gender = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          setModalState(() => submitting = true);
                          try {
                            await _api.updateFamilyMember(
                              id: id,
                              name: name,
                              age: int.tryParse(age) ?? 0,
                              gender: gender.tr(),
                            );
                            await _loadMembers();
                            if (context.mounted) Navigator.pop(context);
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
                              );
                            }
                          } finally {
                            setModalState(() => submitting = false);
                          }
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary500),
                  child: Text('save'.tr()),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddMemberModal() {
    String name = '';
    String age = '';
    String gender = 'genderMale';
    bool submitting = false;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
            left: 24,
            right: 24,
          ),
          decoration: const BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.grey100, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 24),
              Text('addFamilyMember'.tr(), style: AppTypography.screenTitle.copyWith(color: AppColors.grey900)),
              const SizedBox(height: 24),
              TextField(
                decoration: InputDecoration(
                  labelText: 'fullName'.tr(),
                  filled: true,
                  fillColor: AppColors.grey25,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                onChanged: (val) => name = val,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        labelText: 'age'.tr(),
                        filled: true,
                        fillColor: AppColors.grey25,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (val) => age = val,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: gender,
                      decoration: InputDecoration(
                        labelText: 'gender'.tr(),
                        filled: true,
                        fillColor: AppColors.grey25,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      items: ['genderMale', 'genderFemale', 'genderOther']
                          .map((g) => DropdownMenuItem(value: g, child: Text(g.tr())))
                          .toList(),
                      onChanged: (val) => setModalState(() => gender = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: submitting
                      ? null
                      : () async {
                          if (name.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Name is required'), behavior: SnackBarBehavior.floating),
                            );
                            return;
                          }
                          if (age.trim().isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Age is required'), behavior: SnackBarBehavior.floating),
                            );
                            return;
                          }
                          setModalState(() => submitting = true);
                          await _addMember(name, age, gender);
                          if (context.mounted) {
                            Navigator.pop(context);
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: submitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: AppColors.white, strokeWidth: 2),
                        )
                      : Text('save'.tr(), style: AppTypography.buttonLarge.copyWith(color: AppColors.white)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text('familyMembers'.tr(), style: AppTypography.appBarTitle.copyWith(color: AppColors.grey900)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.grey900),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                color: AppColors.primary500,
              ),
            )
          : _familyMembers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.people_alt_outlined, size: 80, color: AppColors.grey100),
                      const SizedBox(height: 16),
                      Text('noFamilyMembers'.tr(), style: AppTypography.heading200.copyWith(color: AppColors.grey400)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMembers,
                  color: AppColors.primary500,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _familyMembers.length,
                    itemBuilder: (context, index) {
                      final member = _familyMembers[index];
                      final name = member['name'] ?? '';
                      final age = member['age'] ?? 0;
                      final gender = member['gender'] ?? '';
                      final id = member['id'] ?? '';
                      final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.grey25,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.grey50),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: AppColors.primary500.withValues(alpha: 0.1),
                              child: Text(initial, style: AppTypography.heading200.copyWith(color: AppColors.primary500)),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    style: AppTypography.homeSectionTitle.copyWith(
                                      color: AppColors.grey900,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    '$age ${'years'.tr()} • $gender',
                                    style: AppTypography.body100.copyWith(color: AppColors.grey500),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, color: AppColors.primary500),
                              onPressed: () => _showEditMemberModal(member),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                              onPressed: () => _removeMember(id),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddMemberModal,
        backgroundColor: AppColors.primary500,
        elevation: 4,
        child: const Icon(Icons.add, color: AppColors.white),
      ),
    );
  }
}
