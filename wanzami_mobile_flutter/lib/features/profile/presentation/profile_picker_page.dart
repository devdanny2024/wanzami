import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../data/profile_repository.dart';

class ProfilePickerPage extends StatefulWidget {
  const ProfilePickerPage({
    super.key,
    required this.profileRepository,
    required this.onPicked,
    required this.onLogout,
  });

  final ProfileRepository profileRepository;
  final ValueChanged<Map<String, dynamic>> onPicked;
  final VoidCallback onLogout;

  @override
  State<ProfilePickerPage> createState() => _ProfilePickerPageState();
}

class _ProfilePickerPageState extends State<ProfilePickerPage> {
  bool _loading = true;
  List<Map<String, dynamic>> _profiles = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final profiles = await widget.profileRepository.profiles();
      if (!mounted) return;
      setState(() {
        _profiles = profiles;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _addProfile() async {
    final c = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Create profile'),
        content: TextField(controller: c, decoration: const InputDecoration(hintText: 'Profile name')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Create')),
        ],
      ),
    );
    if (ok == true && c.text.trim().isNotEmpty) {
      await widget.profileRepository.createProfile(name: c.text.trim());
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.background,
      appBar: AppBar(
        title: const Text('Who is watching?'),
        actions: [
          IconButton(onPressed: _addProfile, icon: const Icon(Icons.add)),
          IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _profiles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('No profile yet'),
                      const SizedBox(height: 12),
                      FilledButton.icon(onPressed: _addProfile, icon: const Icon(Icons.add), label: const Text('Create profile')),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _profiles.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.25,
                  ),
                  itemBuilder: (_, i) {
                    final p = _profiles[i];
                    final name = (p['name'] ?? 'Profile').toString();
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => widget.onPicked(p),
                      child: Ink(
                        decoration: BoxDecoration(
                          color: AppTokens.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTokens.elevated),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const CircleAvatar(radius: 28, child: Icon(Icons.person, size: 30)),
                            const SizedBox(height: 10),
                            Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
