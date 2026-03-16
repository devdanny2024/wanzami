import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
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
      appBar: AppBar(title: const Text('Personalize Wanzami')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Choose your favorite genres', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _allGenres.map((g) {
              final selected = _genres.contains(g);
              return FilterChip(
                selected: selected,
                label: Text(g),
                onSelected: (_) => setState(() => selected ? _genres.remove(g) : _genres.add(g)),
              );
            }).toList(),
          ),
          const SizedBox(height: 22),
          const Text('How did you hear about us?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ..._sources.map((s) => RadioListTile<String>(
                value: s,
                groupValue: _source,
                onChanged: (v) => setState(() => _source = v ?? ''),
                title: Text(s[0].toUpperCase() + s.substring(1)),
              )),
          if (_source == 'other')
            TextField(
              controller: _other,
              decoration: const InputDecoration(hintText: 'Tell us where you heard about Wanzami'),
            ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: loading ? null : _save,
            child: Text(loading ? 'Saving...' : 'Finish'),
          ),
        ],
      ),
    );
  }
}
