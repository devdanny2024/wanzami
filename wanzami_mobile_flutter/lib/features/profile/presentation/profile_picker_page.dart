import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../data/profile_repository.dart';

/// Profile picker — "casting call": pick who's watching from the cast board.
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
        backgroundColor: CsTokens.paper,
        shape: Border.fromBorderSide(CsTokens.side(CsTokens.borderWidthHeavy)),
        title: Text('NEW CAST MEMBER', style: CsTokens.display(size: 22)),
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
            onPressed: () => Navigator.pop(context, false),
            child: Text('CANCEL',
                style: CsTokens.mono(size: 12, color: CsTokens.mutedInk)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('CREATE',
                style: CsTokens.mono(
                    size: 12, color: CsTokens.rust, weight: FontWeight.w700)),
          ),
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
      backgroundColor: CsTokens.paper,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CsPageHeader(
              title: 'Crew Show',
              chip: 'Take 01',
              trailing: Semantics(
                button: true,
                label: 'Sign out',
                child: GestureDetector(
                  onTap: widget.onLogout,
                  behavior: HitTestBehavior.opaque,
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: Center(
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(border: CsTokens.border(2)),
                        child: const Icon(Icons.logout,
                            size: 16, color: CsTokens.ink),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 22, 16, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CsSlug('Scene 00 · Character profile'),
                  const SizedBox(height: 4),
                  Text("WHO'S\nWATCHING?", style: CsTokens.display(size: 44)),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: CsTokens.rust),
                    )
                  : _profiles.isEmpty
                      ? _EmptyCast(onCreate: _addProfile)
                      : GridView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: _profiles.length + 1,
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 18,
                            crossAxisSpacing: 16,
                            childAspectRatio: 0.95,
                          ),
                          itemBuilder: (_, i) {
                            if (i == _profiles.length) {
                              return _AddCastCard(onTap: _addProfile);
                            }
                            final p = _profiles[i];
                            final name = (p['name'] ?? 'Profile').toString();
                            final initial = name.trim().isNotEmpty
                                ? name.trim()[0].toUpperCase()
                                : 'W';
                            return _CastCard(
                              name: name,
                              initial: initial,
                              kid: p['kidMode'] == true,
                              onTap: () => widget.onPicked(p),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CastCard extends StatelessWidget {
  const _CastCard({
    required this.name,
    required this.initial,
    required this.kid,
    required this.onTap,
  });

  final String name;
  final String initial;
  final bool kid;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Watch as $name',
      child: GestureDetector(
        onTap: onTap,
        child: CsBox(
          shadow: 4,
          color: CsTokens.panel,
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                color: CsTokens.ink,
                alignment: Alignment.center,
                child: kid
                    ? const Icon(Icons.child_care_rounded,
                        color: CsTokens.brand, size: 36)
                    : Text(
                        initial,
                        style:
                            CsTokens.display(size: 40, color: CsTokens.brand),
                      ),
              ),
              const SizedBox(height: 10),
              Text(
                name.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: CsTokens.mono(
                    size: 11, color: CsTokens.ink, weight: FontWeight.w700),
              ),
              if (kid) ...[
                const SizedBox(height: 4),
                CsSlug('Kids', size: 9),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _AddCastCard extends StatelessWidget {
  const _AddCastCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Add profile',
      child: GestureDetector(
        onTap: onTap,
        child: CustomPaint(
          foregroundPainter: _DashedRectPainter(),
          child: Container(
            color: CsTokens.paper,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.add, size: 34, color: CsTokens.mutedInk),
                const SizedBox(height: 8),
                CsSlug('Add cast member', size: 10),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DashedRectPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = CsTokens.ink
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    const dash = 7.0;
    const gap = 5.0;

    void dashedLine(Offset a, Offset b) {
      final total = (b - a).distance;
      final dir = (b - a) / total;
      var d = 0.0;
      while (d < total) {
        final end = (d + dash) > total ? total : (d + dash);
        canvas.drawLine(a + dir * d, a + dir * end, paint);
        d += dash + gap;
      }
    }

    dashedLine(Offset.zero, Offset(size.width, 0));
    dashedLine(Offset(size.width, 0), Offset(size.width, size.height));
    dashedLine(Offset(size.width, size.height), Offset(0, size.height));
    dashedLine(Offset(0, size.height), Offset.zero);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _EmptyCast extends StatelessWidget {
  const _EmptyCast({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CsBox(
              color: CsTokens.panel,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CsSlug('Open casting'),
                  const SizedBox(height: 6),
                  Text('NO CAST YET', style: CsTokens.display(size: 30)),
                  const SizedBox(height: 6),
                  const Text(
                    'Create a profile to start watching.',
                    style: CsTokens.body,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            CsButton('Create profile', expand: true, onTap: onCreate),
          ],
        ),
      ),
    );
  }
}
