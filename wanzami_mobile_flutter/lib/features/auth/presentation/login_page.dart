import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import 'auth_controller.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    required this.controller,
    required this.onShowRegister,
  });

  final AuthController controller;
  final VoidCallback onShowRegister;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _hidePassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppTokens.spacingLg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: const Color(0xFF0D0D0F),
                  borderRadius: BorderRadius.circular(AppTokens.radiusXl),
                  border: Border.all(color: AppTokens.border),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppTokens.spacingLg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Welcome back', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      const Text('Sign in to continue your streaming journey.', style: TextStyle(color: AppTokens.secondaryText)),
                      const SizedBox(height: 24),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(labelText: 'Email', hintText: 'Enter your email'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _password,
                        obscureText: _hidePassword,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          hintText: 'Enter your password',
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _hidePassword = !_hidePassword),
                            icon: Icon(_hidePassword ? Icons.visibility : Icons.visibility_off),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      AnimatedBuilder(
                        animation: widget.controller,
                        builder: (_, __) {
                          final loading = widget.controller.status == AuthStatus.loading;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (widget.controller.status == AuthStatus.error)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Text(
                                    widget.controller.errorMessage ?? 'Unable to sign in',
                                    style: const TextStyle(color: Colors.redAccent),
                                  ),
                                ),
                              FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppTokens.brandOrangeDark,
                                  foregroundColor: Colors.white,
                                  minimumSize: const Size(double.infinity, 48),
                                ),
                                onPressed: loading
                                    ? null
                                    : () => widget.controller.login(_email.text.trim(), _password.text),
                                child: Text(loading ? 'Signing in...' : 'Sign in'),
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text("Don't have an account?", style: TextStyle(color: AppTokens.secondaryText)),
                          TextButton(
                            onPressed: widget.onShowRegister,
                            child: const Text('Sign up', style: TextStyle(color: AppTokens.brandOrange)),
                          ),
                        ],
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
