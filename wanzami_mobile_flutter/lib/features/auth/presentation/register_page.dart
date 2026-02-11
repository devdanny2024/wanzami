import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import 'auth_controller.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({
    super.key,
    required this.controller,
    required this.onShowLogin,
  });

  final AuthController controller;
  final VoidCallback onShowLogin;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppTokens.spacingLg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: AppTokens.surface,
                  borderRadius: BorderRadius.circular(AppTokens.radiusXl),
                  border: Border.all(color: AppTokens.border),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppTokens.spacingLg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Create account', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      const Text('Let\'s customize your movie experience.', style: TextStyle(color: AppTokens.secondaryText)),
                      const SizedBox(height: 24),
                      TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
                      const SizedBox(height: 12),
                      TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
                      const SizedBox(height: 12),
                      TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
                      const SizedBox(height: 16),
                      AnimatedBuilder(
                        animation: widget.controller,
                        builder: (_, __) {
                          final loading = widget.controller.status == AuthStatus.loading;
                          return FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: AppTokens.brandOrange,
                              minimumSize: const Size(double.infinity, 48),
                            ),
                            onPressed: loading
                                ? null
                                : () async {
                                    await widget.controller.register(
                                      _name.text.trim(),
                                      _email.text.trim(),
                                      _password.text,
                                    );
                                    if (!mounted) return;
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Account created. Verify your email before signing in.'),
                                      ),
                                    );
                                    widget.onShowLogin();
                                  },
                            child: Text(loading ? 'Creating account...' : 'Continue'),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: widget.onShowLogin,
                        child: const Text('Already have an account? Login', style: TextStyle(color: AppTokens.brandOrange)),
                      )
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
