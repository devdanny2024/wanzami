import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/wanzami_kit.dart';
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

  static const List<Gradient> _avatarGradients = [
    LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppTokens.brandOrangeLight, AppTokens.brandOrange],
    ),
    LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppTokens.brandGold, AppTokens.brandOrange],
    ),
    LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [AppTokens.brandOrange, AppTokens.brandOrangeDark],
    ),
    LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [Color(0xFFFF9F4D), AppTokens.brandOrangeDark],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.background,
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0x1AFF6A00), AppTokens.background, AppTokens.background],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(
                    AppTokens.spacingMd, AppTokens.spacingXs, AppTokens.spacingMd, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    FrostedIconButton(
                      icon: Icons.add,
                      size: 40,
                      onTap: _addProfile,
                    ),
                    const SizedBox(width: AppTokens.spacingXs),
                    FrostedIconButton(
                      icon: Icons.logout,
                      size: 40,
                      onTap: widget.onLogout,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppTokens.spacingXs),
              const Text(
                "Who's watching?",
                style: TextStyle(
                  color: AppTokens.primaryText,
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Select a profile to continue',
                style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
              ),
              const SizedBox(height: AppTokens.spacingLg),
              Expanded(
                child: _loading
                    ? const Center(
                        child: CircularProgressIndicator(
                            color: AppTokens.brandOrange),
                      )
                    : _profiles.isEmpty
                        ? _EmptyState(onCreate: _addProfile)
                        : GridView.builder(
                            padding: const EdgeInsets.all(AppTokens.spacingLg),
                            itemCount: _profiles.length,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: AppTokens.spacingMd,
                              crossAxisSpacing: AppTokens.spacingMd,
                              childAspectRatio: 0.92,
                            ),
                            itemBuilder: (_, i) {
                              final p = _profiles[i];
                              final name = (p['name'] ?? 'Profile').toString();
                              final initial = name.trim().isNotEmpty
                                  ? name.trim()[0].toUpperCase()
                                  : 'W';
                              return _ProfileAvatar(
                                name: name,
                                initial: initial,
                                kid: p['kidMode'] == true,
                                gradient: _avatarGradients[
                                    i % _avatarGradients.length],
                                onTap: () => widget.onPicked(p),
                              );
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar({
    required this.name,
    required this.initial,
    required this.kid,
    required this.gradient,
    required this.onTap,
  });

  final String name;
  final String initial;
  final bool kid;
  final Gradient gradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: AppTokens.brandGradient,
              boxShadow: AppTokens.brandGlow,
            ),
            child: Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: AppTokens.background,
              ),
              padding: const EdgeInsets.all(3),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: gradient,
                ),
                alignment: Alignment.center,
                child: kid
                    ? const Icon(Icons.child_care_rounded,
                        color: Colors.white, size: 40)
                    : Text(
                        initial,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: AppTokens.spacingSm),
          Text(
            name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTokens.primaryText,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppTokens.brandOrangeTint,
              borderRadius: BorderRadius.circular(AppTokens.radiusXl),
            ),
            child: const Icon(Icons.person_add_alt_1_rounded,
                color: AppTokens.brandOrange, size: 34),
          ),
          const SizedBox(height: AppTokens.spacingMd),
          const Text(
            'No profile yet',
            style: TextStyle(
              color: AppTokens.primaryText,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Create a profile to start watching',
            style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
          ),
          const SizedBox(height: AppTokens.spacingLg),
          FilledButton.icon(
            onPressed: onCreate,
            icon: const Icon(Icons.add),
            label: const Text('Create profile'),
          ),
        ],
      ),
    );
  }
}
