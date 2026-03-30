import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';

class FamilyMembersScreen extends StatefulWidget {
  const FamilyMembersScreen({super.key});

  @override
  State<FamilyMembersScreen> createState() => _FamilyMembersScreenState();
}

class _FamilyMembersScreenState extends State<FamilyMembersScreen> {
  final List<Map<String, dynamic>> _familyMembers = [
    {'id': '1', 'name': 'Sofia Kumar', 'age': '8', 'gender': 'Female'},
    {'id': '2', 'name': 'Arjun Kumar', 'age': '5', 'gender': 'Male'},
  ];

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
    String gender = 'Male';

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
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 24),
              Text('addFamilyMember'.tr(), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
              const SizedBox(height: 24),
              TextField(
                decoration: InputDecoration(
                  labelText: 'fullName'.tr(),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
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
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      keyboardType: TextInputType.number,
                      onChanged: (val) => age = val,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: gender,
                      decoration: InputDecoration(
                        labelText: 'gender'.tr(),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      items: ['Male', 'Female', 'Other'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
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
                    backgroundColor: const Color(0xFFff5a5f),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text('save'.tr(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900)),
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
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('familyMembers'.tr(), style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900)),
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: _familyMembers.isEmpty 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_alt_outlined, size: 80, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                Text('noFamilyMembers'.tr(), style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w700)),
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
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey.shade100),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFFff5a5f).withOpacity(0.1),
                      child: Text(member['name'][0], style: const TextStyle(color: Color(0xFFff5a5f), fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(member['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          Text('${member['age']} years • ${member['gender']}', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600, fontSize: 13)),
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
        backgroundColor: const Color(0xFFff5a5f),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
