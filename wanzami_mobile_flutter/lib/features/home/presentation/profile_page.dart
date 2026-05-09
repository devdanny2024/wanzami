import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../profile/data/profile_repository.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.onLogout, required this.profileRepository});

  final VoidCallback onLogout;
  final ProfileRepository profileRepository;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _loading = true;
  Map<String, dynamic> _me = const {};
  List<Map<String, dynamic>> _profiles = const [];
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final me = await widget.profileRepository.me();
      final profiles = await widget.profileRepository.profiles();
      if (mounted) {
        setState(() {
          _me = me;
          _profiles = profiles;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
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

  Future<void> _renameProfile(Map<String, dynamic> p) async {
    final c = TextEditingController(text: (p['name'] ?? '').toString());
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Rename profile'),
        content: TextField(controller: c),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok == true) {
      await widget.profileRepository.updateProfile((p['id']).toString(), name: c.text.trim());
      await _load();
    }
  }

  Future<void> _deleteProfile(Map<String, dynamic> p) async {
    await widget.profileRepository.deleteProfile((p['id']).toString());
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    final userPayload = (_me['user'] is Map<String, dynamic>)
        ? _me['user'] as Map<String, dynamic>
        : _me;
    final name = (userPayload['name'] ?? userPayload['displayName'] ?? userPayload['username'] ?? 'Wanzami User').toString();
    final email = (userPayload['email'] ?? _me['email'] ?? '').toString();

    return Scaffold(
      backgroundColor: AppTokens.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                children: [
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 54, 24, 24),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [AppTokens.surface, AppTokens.background],
                      ),
                    ),
                    child: Column(
                      children: [
                        const CircleAvatar(radius: 44, child: Icon(Icons.person, size: 40)),
                        const SizedBox(height: 12),
                        Text(name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                        Text(email, style: const TextStyle(color: AppTokens.secondaryText)),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Profiles', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                        TextButton.icon(onPressed: _addProfile, icon: const Icon(Icons.add), label: const Text('Add')),
                      ],
                    ),
                  ),
                  ..._profiles.map(
                    (p) => ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                      title: Text((p['name'] ?? 'Profile').toString()),
                      subtitle: Text((p['kidMode'] == true) ? 'Kids profile' : 'Standard profile'),
                      trailing: PopupMenuButton<String>(
                        onSelected: (v) {
                          if (v == 'rename') _renameProfile(p);
                          if (v == 'delete') _deleteProfile(p);
                        },
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'rename', child: Text('Rename')),
                          PopupMenuItem(value: 'delete', child: Text('Delete')),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: FilledButton.icon(
                      onPressed: widget.onLogout,
                      icon: const Icon(Icons.logout),
                      label: const Text('Logout'),
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
    );
  }
}
