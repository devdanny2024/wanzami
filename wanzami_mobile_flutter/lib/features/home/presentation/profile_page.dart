import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../profile/data/profile_repository.dart';

/// Profile — "cast & crew": your account as a laminated crew card, profiles
/// as the who's-watching list, and sign-out as the wrap call.
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

  Future<String?> _promptName({required String title, String initial = ''}) {
    final c = TextEditingController(text: initial);
    return showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: CsTokens.paper,
        shape: Border.fromBorderSide(CsTokens.side(CsTokens.borderWidthHeavy)),
        title: Text(title.toUpperCase(), style: CsTokens.display(size: 22)),
        content: TextField(
          controller: c,
          style: const TextStyle(color: CsTokens.ink),
          cursorColor: CsTokens.ink,
          decoration: InputDecoration(
            hintText: 'Profile name',
            hintStyle: const TextStyle(color: CsTokens.mutedInk),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: CsTokens.side(2),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: CsTokens.side(2.5),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('CANCEL',
                style: CsTokens.mono(size: 12, color: CsTokens.mutedInk)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, c.text.trim()),
            child: Text('SAVE',
                style: CsTokens.mono(
                    size: 12, color: CsTokens.rust, weight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Future<void> _addProfile() async {
    final name = await _promptName(title: 'New cast member');
    if (name != null && name.isNotEmpty) {
      await widget.profileRepository.createProfile(name: name);
      await _load();
    }
  }

  Future<void> _renameProfile(Map<String, dynamic> p) async {
    final name = await _promptName(
        title: 'Rename', initial: (p['name'] ?? '').toString());
    if (name != null) {
      await widget.profileRepository.updateProfile((p['id']).toString(), name: name);
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
    final name = (userPayload['name'] ??
            userPayload['displayName'] ??
            userPayload['username'] ??
            'Wanzami User')
        .toString();
    final email = (userPayload['email'] ?? _me['email'] ?? '').toString();
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'W';

    return Scaffold(
      backgroundColor: CsTokens.paper,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CsPageHeader(title: 'Cast & crew', chip: 'Crew file'),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: CsTokens.rust),
                    )
                  : RefreshIndicator(
                      color: CsTokens.rust,
                      onRefresh: _load,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(14, 16, 14, 110),
                        children: [
                          // Crew card.
                          CsBox(
                            color: CsTokens.panel,
                            shadow: 5,
                            borderWidth: CsTokens.borderWidthHeavy,
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  color: CsTokens.ink,
                                  alignment: Alignment.center,
                                  child: Text(
                                    initial,
                                    style: CsTokens.display(
                                        size: 32, color: CsTokens.brand),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name.toUpperCase(),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: CsTokens.display(size: 24),
                                      ),
                                      if (email.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          email.toUpperCase(),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: CsTokens.mono(size: 9),
                                        ),
                                      ],
                                      const SizedBox(height: 8),
                                      const CsStamp('Crew member'),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 22),

                          // Profiles.
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const CsSlug("Profiles · who's watching"),
                              GestureDetector(
                                onTap: _addProfile,
                                behavior: HitTestBehavior.opaque,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 8),
                                  child: Text(
                                    '+ ADD',
                                    style: CsTokens.mono(
                                      size: 11,
                                      color: CsTokens.rust,
                                      weight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          for (final p in _profiles)
                            _CrewRow(
                              name: (p['name'] ?? 'Profile').toString(),
                              kid: p['kidMode'] == true,
                              onRename: () => _renameProfile(p),
                              onDelete: () => _deleteProfile(p),
                            ),
                          if (_profiles.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration:
                                  BoxDecoration(border: CsTokens.border(2)),
                              child: Center(
                                child:
                                    CsSlug('No profiles on the sheet yet'),
                              ),
                            ),
                          const SizedBox(height: 26),

                          // Sign out — the wrap call.
                          Semantics(
                            button: true,
                            label: 'Sign out',
                            child: GestureDetector(
                              onTap: widget.onLogout,
                              child: Container(
                                constraints: const BoxConstraints(
                                    minHeight: CsTokens.touchTarget),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: CsTokens.rust, width: 2.5),
                                ),
                                child: const Text(
                                  "THAT'S A WRAP · SIGN OUT",
                                  style: TextStyle(
                                    color: CsTokens.rust,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 26),
                          Center(
                            child: CsSlug(
                                'Wanzami v1.0.5 · © 2026 Wanzami Entertainment',
                                size: 9),
                          ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CrewRow extends StatelessWidget {
  const _CrewRow({
    required this.name,
    required this.kid,
    required this.onRename,
    required this.onDelete,
  });

  final String name;
  final bool kid;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 9),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      constraints: const BoxConstraints(minHeight: 54),
      decoration: BoxDecoration(
        color: CsTokens.panel,
        border: CsTokens.border(2),
      ),
      child: Row(
        children: [
          Icon(
            kid ? Icons.child_care_rounded : Icons.person_rounded,
            size: 20,
            color: CsTokens.ink,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: CsTokens.bodyBold,
            ),
          ),
          if (kid)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: CsSlug('Kids', size: 9),
            ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: CsTokens.ink),
            color: CsTokens.paper,
            shape: Border.fromBorderSide(CsTokens.side(2)),
            onSelected: (v) {
              if (v == 'rename') onRename();
              if (v == 'delete') onDelete();
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'rename',
                child: Text('Rename',
                    style: const TextStyle(color: CsTokens.ink)),
              ),
              PopupMenuItem(
                value: 'delete',
                child: Text('Delete',
                    style: const TextStyle(color: CsTokens.rust)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
