import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';

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

  Future<void> _forgotPassword() async {
    final c = TextEditingController(text: _email.text.trim());
    final email = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Forgot password'),
        content: TextField(
          controller: c,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(hintText: 'Enter your email'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, c.text.trim()), child: const Text('Send link')),
        ],
      ),
    );

    if (email == null || email.isEmpty) return;

    await widget.controller.forgotPassword(email);
    if (!mounted) return;

    if (widget.controller.status == AuthStatus.error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(widget.controller.errorMessage ?? 'Unable to send reset email')),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('If that account exists, reset instructions were sent to $email.')),
    );
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _startGoogleSignin() async {
    // Must be the Google OAuth Web client ID from Cloud Console.
    const webClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID', defaultValue: '');

    try {
      final signIn = GoogleSignIn(
        scopes: const ['email', 'profile', 'openid'],
        serverClientId: webClientId.isEmpty ? null : webClientId,
        forceCodeForRefreshToken: true,
      );

      await signIn.signOut();
      final account = await signIn.signIn();
      if (account == null) return;

      final authCode = account.serverAuthCode;
      if (authCode == null || authCode.isEmpty) {
        throw Exception('Google did not return serverAuthCode. Set GOOGLE_WEB_CLIENT_ID for this build.');
      }

      await widget.controller.loginWithGoogleAuthCode(authCode);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google sign-in failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: AppTokens.background,
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0x1AFF6A00), AppTokens.background, AppTokens.background],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: _Appear(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),
                  Center(
                    child: Image.asset('assets/images/wanzami_logo.png', width: 96, height: 96),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Welcome Back',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700, height: 1.1),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Sign in to continue watching',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
                  ),
                  const SizedBox(height: 30),
                  _SocialButton(
                    label: 'Continue with Google',
                    icon: const _GoogleMark(),
                    onTap: _startGoogleSignin,
                  ),
                  const SizedBox(height: 12),
                  _SocialButton(
                    label: 'Continue with Apple',
                    icon: const Icon(Icons.apple, color: Colors.black, size: 22),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Apple sign-in is coming soon.')),
                      );
                    },
                  ),
                  const SizedBox(height: 22),
                  const _OrDivider(),
                  const SizedBox(height: 22),
                  const _FieldLabel('Email'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(hintText: 'your@email.com'),
                  ),
                  const SizedBox(height: 14),
                  const _FieldLabel('Password'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(hintText: '••••••••'),
                  ),
                  const SizedBox(height: 18),
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
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.redAccent),
                              ),
                            ),
                          FilledButton(
                            onPressed: loading
                                ? null
                                : () => widget.controller.login(
                                      _email.text.trim(),
                                      _password.text,
                                    ),
                            child: loading
                                ? const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(strokeWidth: 2),
                                      ),
                                      SizedBox(width: 10),
                                      Text('Signing in...'),
                                    ],
                                  )
                                : const Text('Sign In'),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: _forgotPassword,
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(color: AppTokens.brandOrange, fontSize: 13),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Don\'t have an account? ',
                        style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
                      ),
                      GestureDetector(
                        onTap: widget.onShowRegister,
                        child: const Text(
                          'Sign Up',
                          style: TextStyle(
                            color: AppTokens.brandOrange,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Appear extends StatelessWidget {
  const _Appear({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 420),
      curve: Curves.easeOut,
      builder: (context, value, _) => Opacity(
        opacity: value,
        child: Transform.translate(offset: Offset(0, 12 * (1 - value)), child: child),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(child: Divider(color: AppTokens.elevated, thickness: 1)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: Text('OR', style: TextStyle(color: AppTokens.secondaryText, fontSize: 12)),
        ),
        Expanded(child: Divider(color: AppTokens.elevated, thickness: 1)),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.label, required this.icon, required this.onTap});

  final String label;
  final Widget icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: 10),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ],
        ),
      ),
    );
  }
}

class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GoogleMarkPainter()),
    );
  }
}

class _GoogleMarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stroke = 3.0;
    final rect = Offset.zero & size;
    final p = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;

    p.color = const Color(0xFF4285F4);
    canvas.drawArc(rect.deflate(stroke / 2), -0.2, 1.7, false, p);
    p.color = const Color(0xFFEA4335);
    canvas.drawArc(rect.deflate(stroke / 2), -2.7, 1.1, false, p);
    p.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect.deflate(stroke / 2), 2.4, 1.2, false, p);
    p.color = const Color(0xFF34A853);
    canvas.drawArc(rect.deflate(stroke / 2), 1.1, 1.2, false, p);

    final bar = Paint()
      ..color = const Color(0xFF4285F4)
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(size.width * 0.52, size.height * 0.5),
        Offset(size.width * 0.92, size.height * 0.5), bar);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
