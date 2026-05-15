import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import '../utils/app_colors.dart';
import '../utils/app_typography.dart';

class FamilyMembersScreen extends StatefulWidget {
  const FamilyMembersScreen({super.key});

  @override
  State<FamilyMembersScreen> createState() => _FamilyMembersScreenState();
}

class _FamilyMembersScreenState extends State<FamilyMembersScreen> {
  final List<Map<String, dynamic>> _familyMembers = [];

  void _addMember(String name, String age, String gender) {
    setState(() {
      _familyMembers.add({
        'id': DateTime.now().toString(),
        'name': name,
        'age': age,
        'gender': gender,
      });
    });
  }

  void _removeMember(String id) {
    setState(() {
      _familyMembers.removeWhere((m) => m['id'] == id);
    });
  }

  void _showAddMemberModal() {
    String name = '';
    String age = '';
    String gender = 'genderMale';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20, left: 24, right: 24,
          ),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.grey100, borderRadius: BorderRadius.circular(2)))),
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
                      items: ['genderMale', 'genderFemale', 'genderOther'].map((g) => DropdownMenuItem(value: g, child: Text(g.tr()))).toList(),
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
                  onPressed: () {
                    if (name.isNotEmpty && age.isNotEmpty) {
                      _addMember(name, age, gender);
                      Navigator.pop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text('save'.tr(), style: AppTypography.buttonLarge.copyWith(color: AppColors.white)),
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
        leading: IconButton(icon: Icon(Icons.arrow_back, color: AppColors.grey900), onPressed: () => Navigator.pop(context)),
      ),
      body: _familyMembers.isEmpty 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_alt_outlined, size: 80, color: AppColors.grey100),
                const SizedBox(height: 16),
                Text('noFamilyMembers'.tr(), style: AppTypography.heading200.copyWith(color: AppColors.grey400)),
              ],
            ),
          )
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: _familyMembers.length,
            itemBuilder: (context, index) {
              final member = _familyMembers[index];
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
                      child: Text(member['name'][0], style: AppTypography.heading200.copyWith(color: AppColors.primary500)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            member['name'],
                            style: AppTypography.homeSectionTitle.copyWith(
                              color: AppColors.grey900,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text('${member['age']} ${'years'.tr()} • ${member['gender'].toString().tr()}', style: AppTypography.body100.copyWith(color: AppColors.grey500)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                      onPressed: () => _removeMember(member['id']),
                    ),
                  ],
                ),
              );
            },
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
