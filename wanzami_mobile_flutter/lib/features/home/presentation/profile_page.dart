import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/wanzami_kit.dart';
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
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'W';

    return Scaffold(
      backgroundColor: AppTokens.background,
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTokens.brandOrange),
            )
          : RefreshIndicator(
              color: AppTokens.brandOrange,
              backgroundColor: AppTokens.surface,
              onRefresh: _load,
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _Header(name: name, email: email, initial: initial),
                  const SizedBox(height: AppTokens.spacingLg),
                  _StatsCard(profileCount: _profiles.length),
                  const SizedBox(height: AppTokens.spacingLg),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppTokens.spacingLg),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 4,
                              height: 20,
                              decoration: BoxDecoration(
                                gradient: AppTokens.brandGradient,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Profiles',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 20,
                                color: AppTokens.primaryText,
                              ),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          onPressed: _addProfile,
                          icon: const Icon(Icons.add,
                              size: 18, color: AppTokens.brandOrangeLight),
                          label: const Text(
                            'Add',
                            style: TextStyle(
                                color: AppTokens.brandOrangeLight,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTokens.spacingXs),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppTokens.spacingLg),
                    child: Column(
                      children: [
                        for (final p in _profiles)
                          _ProfileTile(
                            name: (p['name'] ?? 'Profile').toString(),
                            subtitle: (p['kidMode'] == true)
                                ? 'Kids profile'
                                : 'Standard profile',
                            kid: p['kidMode'] == true,
                            onRename: () => _renameProfile(p),
                            onDelete: () => _deleteProfile(p),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTokens.spacingLg),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppTokens.spacingLg),
                    child: _LogoutTile(onTap: widget.onLogout),
                  ),
                  const SizedBox(height: AppTokens.spacingXl),
                  const Center(
                    child: Column(
                      children: [
                        Text(
                          'WANZAMI v2.0.1',
                          style: TextStyle(
                              color: AppTokens.mutedText, fontSize: 12),
                        ),
                        SizedBox(height: 4),
                        Text(
                          '© 2026 Wanzami Entertainment',
                          style: TextStyle(
                              color: AppTokens.mutedText, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.name, required this.email, required this.initial});

  final String name;
  final String email;
  final String initial;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 56, 24, 28),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppTokens.surface, AppTokens.background],
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTokens.brandGradient,
              boxShadow: AppTokens.brandGlow,
            ),
            padding: const EdgeInsets.all(3),
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppTokens.elevated,
              ),
              alignment: Alignment.center,
              child: Text(
                initial,
                style: const TextStyle(
                  color: AppTokens.primaryText,
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            name,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppTokens.primaryText,
            ),
          ),
          if (email.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              email,
              style: const TextStyle(color: AppTokens.secondaryText, fontSize: 14),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatsCard extends StatelessWidget {
  const _StatsCard({required this.profileCount});

  final int profileCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
        decoration: BoxDecoration(
          color: AppTokens.surface,
          borderRadius: BorderRadius.circular(AppTokens.radiusXl),
          border: Border.all(color: AppTokens.border),
          boxShadow: AppTokens.cardShadow,
        ),
        child: Row(
          children: [
            const Expanded(child: _Stat(value: '127', label: 'Hours Watched')),
            Container(width: 1, height: 36, color: AppTokens.border),
            const Expanded(child: _Stat(value: '43', label: 'Completed')),
            Container(width: 1, height: 36, color: AppTokens.border),
            Expanded(
                child: _Stat(value: '$profileCount', label: 'Profiles')),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppTokens.primaryText,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: AppTokens.secondaryText, fontSize: 12),
        ),
      ],
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.name,
    required this.subtitle,
    required this.kid,
    required this.onRename,
    required this.onDelete,
  });

  final String name;
  final String subtitle;
  final bool kid;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppTokens.spacingSm),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTokens.surface,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        border: Border.all(color: AppTokens.border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTokens.brandOrangeTint,
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
            ),
            child: Icon(
              kid ? Icons.child_care_rounded : Icons.person_rounded,
              color: AppTokens.brandOrange,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    color: AppTokens.primaryText,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                      color: AppTokens.secondaryText, fontSize: 13),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppTokens.secondaryText),
            color: AppTokens.elevated,
            onSelected: (v) {
              if (v == 'rename') onRename();
              if (v == 'delete') onDelete();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'rename', child: Text('Rename')),
              PopupMenuItem(value: 'delete', child: Text('Delete')),
            ],
          ),
        ],
      ),
    );
  }
}

class _LogoutTile extends StatelessWidget {
  const _LogoutTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      scale: 0.98,
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTokens.brandOrangeTint,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          border: Border.all(color: AppTokens.brandOrange.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppTokens.brandOrange.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              ),
              child: const Icon(Icons.logout_rounded,
                  color: AppTokens.brandOrange, size: 24),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Logout',
                    style: TextStyle(
                      color: AppTokens.brandOrange,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Sign out of your account',
                    style:
                        TextStyle(color: AppTokens.secondaryText, fontSize: 13),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppTokens.brandOrange),
          ],
        ),
      ),
    );
  }
}
