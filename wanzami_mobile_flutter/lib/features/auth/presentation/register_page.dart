import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../../core/env/app_env.dart';
import '../../../core/platform/ios_web_auth.dart';
import '../../../core/theme/app_tokens.dart';
import 'auth_controller.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({
    super.key,
    required this.controller,
    required this.onShowLogin,
    required this.env,
  });

  final AuthController controller;
  final VoidCallback onShowLogin;
  final AppEnv env;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  Future<void> _startGoogleSignup() async {
    if (Platform.isIOS) {
      await _startGoogleSignupWeb();
    } else {
      await _startGoogleSignupNative();
    }
  }

  Future<void> _startGoogleSignupWeb() async {
    const callbackUri = 'https://api.blvckcode.io/api/auth/google/mobile-callback';
    try {
      final authUrl = await widget.controller.getGoogleAuthUrl(redirectUri: callbackUri);
      if (authUrl.isEmpty) throw Exception('Failed to get Google auth URL.');
      final result = await IosWebAuth.authenticate(
        url: authUrl,
        callbackUrlScheme: 'wanzami',
      );
      final uri = Uri.parse(result);
      final error = uri.queryParameters['error'];
      if (error != null && error.isNotEmpty) throw Exception('Google sign-up cancelled or failed.');
      final code = uri.queryParameters['code'];
      final state = uri.queryParameters['state'];
      if (code == null || code.isEmpty) throw Exception('No authorization code received.');
      await widget.controller.loginWithGoogleCode(
        code: code,
        state: state,
        redirectUri: callbackUri,
      );
    } on PlatformException catch (e) {
      if (!mounted) return;
      if (e.code == 'CANCELED') return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google sign-up failed: ${e.message}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google sign-up failed: $e')),
      );
    }
  }

  Future<void> _startGoogleSignupNative() async {
    final webClientId = widget.env.googleWebClientId;
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
        throw Exception('Google did not return serverAuthCode for the configured client.');
      }
      await widget.controller.loginWithGoogleAuthCode(authCode);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google sign-up failed: $e')),
      );
    }
  }

  Future<void> _startAppleSignup() async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      final identityToken = credential.identityToken;
      if (identityToken == null || identityToken.isEmpty) {
        throw Exception('Apple did not return an identity token.');
      }
      final name = [
        credential.givenName,
        credential.familyName,
      ].where((s) => s != null && s.isNotEmpty).join(' ');

      await widget.controller.loginWithApple(
        identityToken: identityToken,
        name: name.isEmpty ? null : name,
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) return;
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Apple sign-up failed: ${e.message}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Apple sign-up failed: $e')),
      );
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
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
            colors: [Color(0x1AFFB020), AppTokens.background, AppTokens.background],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 440),
              curve: Curves.easeOut,
              builder: (context, value, child) => Opacity(
                opacity: value,
                child: Transform.translate(offset: Offset(0, 12 * (1 - value)), child: child),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 24),
                  Center(
                    child: Image.asset('assets/images/wanzami_logo.png', width: 96, height: 96),
                  ),
                  const SizedBox(height: 22),
                  const Text(
                    'Create Account',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w700, height: 1.1),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Join the WANZAMI community',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
                  ),
                  const SizedBox(height: 30),
                  _SocialButton(
                    label: 'Sign up with Google',
                    icon: const _GoogleMark(),
                    onTap: _startGoogleSignup,
                  ),
                  const SizedBox(height: 12),
                  _SocialButton(
                    label: 'Sign up with Apple',
                    icon: const Icon(Icons.apple, color: Colors.black, size: 22),
                    onTap: _startAppleSignup,
                  ),
                  const SizedBox(height: 22),
                  const _OrDivider(),
                  const SizedBox(height: 22),
                  const _FieldLabel('Full Name'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _name,
                    decoration: const InputDecoration(hintText: 'John Doe'),
                  ),
                  const SizedBox(height: 14),
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
                      return FilledButton(
                        onPressed: loading
                            ? null
                            : () async {
                                await widget.controller.register(
                                  _name.text.trim(),
                                  _email.text.trim(),
                                  _password.text,
                                );
                                if (!mounted) return;
                                if (widget.controller.status != AuthStatus.error) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Account created. Verify your email before signing in.'),
                                    ),
                                  );
                                  widget.onShowLogin();
                                }
                              },
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
                                  Text('Creating account...'),
                                ],
                              )
                            : const Text('Create Account'),
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'By signing up, you agree to our Terms of Service and Privacy Policy',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTokens.mutedText, fontSize: 12, height: 1.35),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Already have an account? ',
                        style: TextStyle(color: AppTokens.secondaryText, fontSize: 14),
                      ),
                      GestureDetector(
                        onTap: widget.onShowLogin,
                        child: const Text(
                          'Sign In',
                          style: TextStyle(color: AppTokens.brandOrange, fontWeight: FontWeight.w700),
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
