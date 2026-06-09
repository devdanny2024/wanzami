import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/wanzami_kit.dart';
import 'auth_controller.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key, required this.controller, required this.onDone});

  final AuthController controller;
  final VoidCallback onDone;

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final Set<String> _genres = <String>{};
  final List<String> _allGenres = const [
    'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Fantasy',
  ];
  final List<String> _sources = const ['social', 'friend', 'search', 'ad', 'youtube', 'podcast', 'article', 'other'];
  final _other = TextEditingController();
  String _source = '';

  @override
  void dispose() {
    _other.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_genres.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select at least one genre')));
      return;
    }
    if (_source.isEmpty || (_source == 'other' && _other.text.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tell us how you heard about Wanzami')));
      return;
    }

    await widget.controller.completeOnboarding(
      preferredGenres: _genres.toList(),
      heardFrom: _source == 'other' ? _other.text.trim() : _source,
    );

    if (!mounted) return;
    if (widget.controller.status == AuthStatus.error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.controller.errorMessage ?? 'Failed to save preferences')),
      );
      return;
    }
    widget.onDone();
  }

  @override
  Widget build(BuildContext context) {
    final loading = widget.controller.status == AuthStatus.loading;
    return Scaffold(
      backgroundColor: AppTokens.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Personalize Wanzami'),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0x1AFF6A00), AppTokens.background, AppTokens.background],
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
              AppTokens.spacingLg, AppTokens.spacingXs, AppTokens.spacingLg, AppTokens.spacingLg),
          children: [
            const _SectionTitle('Choose your favorite genres'),
            const SizedBox(height: AppTokens.spacingSm),
            Wrap(
              spacing: AppTokens.spacingXs,
              runSpacing: AppTokens.spacingXs,
              children: _allGenres.map((g) {
                final selected = _genres.contains(g);
                return _SelectChip(
                  label: g,
                  selected: selected,
                  onTap: () => setState(
                      () => selected ? _genres.remove(g) : _genres.add(g)),
                );
              }).toList(),
            ),
            const SizedBox(height: AppTokens.spacingLg),
            const _SectionTitle('How did you hear about us?'),
            const SizedBox(height: AppTokens.spacingSm),
            ..._sources.map((s) => _SourceTile(
                  label: s[0].toUpperCase() + s.substring(1),
                  selected: _source == s,
                  onTap: () => setState(() => _source = s),
                )),
            if (_source == 'other') ...[
              const SizedBox(height: AppTokens.spacingSm),
              TextField(
                controller: _other,
                decoration: const InputDecoration(
                    hintText: 'Tell us where you heard about Wanzami'),
              ),
            ],
            const SizedBox(height: AppTokens.spacingLg),
            _GradientButton(
              onPressed: loading ? null : _save,
              child: Text(loading ? 'Saving...' : 'Finish'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
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
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTokens.primaryText,
            ),
          ),
        ),
      ],
    );
  }
}

class _SelectChip extends StatelessWidget {
  const _SelectChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      scale: 0.95,
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? null : AppTokens.surface,
          gradient: selected ? AppTokens.brandGradient : null,
          borderRadius: BorderRadius.circular(AppTokens.radiusPill),
          border: Border.all(
            color: selected ? Colors.transparent : AppTokens.border,
          ),
          boxShadow: selected ? AppTokens.brandGlow : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppTokens.onBrandOrange : AppTokens.secondaryText,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTokens.spacingXs),
      child: Pressable(
        scale: 0.98,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: AppTokens.surface,
            borderRadius: BorderRadius.circular(AppTokens.radiusMd),
            border: Border.all(
              color: selected ? AppTokens.brandOrange : AppTokens.border,
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    color: selected
                        ? AppTokens.primaryText
                        : AppTokens.secondaryText,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
              ),
              Icon(
                selected
                    ? Icons.radio_button_checked
                    : Icons.radio_button_unchecked,
                color: selected ? AppTokens.brandOrange : AppTokens.mutedText,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Primary CTA with the brand orange sweep + glow.
class _GradientButton extends StatelessWidget {
  const _GradientButton({required this.onPressed, required this.child});

  final VoidCallback? onPressed;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: enabled ? AppTokens.brandGradient : null,
        color: enabled ? null : AppTokens.elevated,
        borderRadius: BorderRadius.circular(AppTokens.radiusMd),
        boxShadow: enabled ? AppTokens.brandGlow : null,
      ),
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: AppTokens.onBrandOrange,
          disabledBackgroundColor: Colors.transparent,
          disabledForegroundColor: AppTokens.onBrandOrange,
          shadowColor: Colors.transparent,
        ),
        child: child,
      ),
    );
  }
}
