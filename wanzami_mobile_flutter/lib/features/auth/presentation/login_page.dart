import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../../core/env/app_env.dart';
import '../../../core/platform/ios_web_auth.dart';
import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import 'auth_controller.dart';

/// Login — "crew sign-in", FORM W-01 on the call sheet.
class LoginPage extends StatefulWidget {
  const LoginPage({
    super.key,
    required this.controller,
    required this.onShowRegister,
    required this.env,
    this.onBrowseAsGuest,
  });

  final AuthController controller;
  final VoidCallback onShowRegister;
  final AppEnv env;
  final VoidCallback? onBrowseAsGuest;

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
        backgroundColor: CsTokens.paper,
        shape: Border.fromBorderSide(CsTokens.side(CsTokens.borderWidthHeavy)),
        title: Text('REQUEST A REPRINT',
            style: CsTokens.display(size: 24)),
        content: TextField(
          controller: c,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: CsTokens.ink),
          cursorColor: CsTokens.ink,
          decoration: InputDecoration(
            hintText: 'Enter your email',
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
            child: Text('SEND LINK',
                style: CsTokens.mono(
                    size: 12, color: CsTokens.rust, weight: FontWeight.w700)),
          ),
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
    if (Platform.isIOS) {
      await _startGoogleSigninWeb();
    } else {
      await _startGoogleSigninNative();
    }
  }

  // iOS: use ASWebAuthenticationSession via native channel.
  // Google redirects to the backend HTTPS bridge which forwards code+state
  // back to the wanzami:// scheme captured by ASWebAuthenticationSession.
  Future<void> _startGoogleSigninWeb() async {
    const callbackUri = 'https://api.wanzami.tv/api/auth/google/mobile-callback';
    try {
      final authUrl = await widget.controller.getGoogleAuthUrl(redirectUri: callbackUri);
      if (authUrl.isEmpty) throw Exception('Failed to get Google auth URL.');
      final result = await IosWebAuth.authenticate(
        url: authUrl,
        callbackUrlScheme: 'wanzami',
      );
      final uri = Uri.parse(result);
      final error = uri.queryParameters['error'];
      if (error != null && error.isNotEmpty) throw Exception('Google sign-in cancelled or failed.');
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
        SnackBar(content: Text('Google sign-in failed: ${e.message}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google sign-in failed: $e')),
      );
    }
  }

  Future<void> _startAppleSignin() async {
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
        SnackBar(content: Text('Apple sign-in failed: ${e.message}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Apple sign-in failed: $e')),
      );
    }
  }

  // Android: native Google Sign-In SDK
  Future<void> _startGoogleSigninNative() async {
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
        SnackBar(content: Text('Google sign-in failed: $e')),
      );
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
            const CsPageHeader(title: 'Wanzami TV', chip: 'Form W-01'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
                child: _Appear(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const CsSlug('Crew sign-in · INT. Wanzami Cinema'),
                      const SizedBox(height: 8),
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                                text: 'WELCOME TO\n',
                                style: CsTokens.display(size: 40)),
                            TextSpan(
                              text: 'CINEMA\nREIMAGINED.',
                              style: CsTokens.display(
                                  size: 40, color: CsTokens.rust),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 22),
                      _CsField(
                        label: 'Email',
                        controller: _email,
                        hint: 'you@setlife.com',
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 12),
                      _CsField(
                        label: 'Password',
                        controller: _password,
                        hint: '••••••••',
                        obscure: true,
                      ),
                      const SizedBox(height: 16),
                      AnimatedBuilder(
                        animation: widget.controller,
                        builder: (_, __) {
                          final loading =
                              widget.controller.status == AuthStatus.loading;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (widget.controller.status == AuthStatus.error)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: Text(
                                    (widget.controller.errorMessage ??
                                            'Unable to sign in')
                                        .toUpperCase(),
                                    style: CsTokens.mono(
                                        size: 10, color: CsTokens.rust),
                                  ),
                                ),
                              CsButton(
                                loading ? 'Signing in…' : 'Sign in →',
                                expand: true,
                                onTap: loading
                                    ? () {}
                                    : () => widget.controller.login(
                                          _email.text.trim(),
                                          _password.text,
                                        ),
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: _forgotPassword,
                        behavior: HitTestBehavior.opaque,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            'FORGOT PASSWORD · REQUEST A REPRINT',
                            style: CsTokens.mono(size: 10)
                                .copyWith(decoration: TextDecoration.underline),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const _CsOrDivider(),
                      const SizedBox(height: 14),
                      _CsSocialButton(
                        label: 'Continue with Google',
                        icon: const _GoogleMark(),
                        onTap: _startGoogleSignin,
                      ),
                      const SizedBox(height: 10),
                      _CsSocialButton(
                        label: 'Continue with Apple',
                        icon: const Icon(Icons.apple,
                            color: CsTokens.ink, size: 20),
                        onTap: _startAppleSignin,
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: widget.onShowRegister,
                            behavior: HitTestBehavior.opaque,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: Text(
                                'NEW CREW? REGISTER →',
                                style: CsTokens.mono(
                                  size: 11,
                                  color: CsTokens.ink,
                                  weight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                          const CsStamp('Approved'),
                        ],
                      ),
                      if (widget.onBrowseAsGuest != null) ...[
                        const SizedBox(height: 6),
                        Center(
                          child: GestureDetector(
                            onTap: widget.onBrowseAsGuest,
                            behavior: HitTestBehavior.opaque,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              child: Text(
                                'BROWSE WITHOUT AN ACCOUNT',
                                style: CsTokens.mono(size: 11, color: CsTokens.mutedInk)
                                    .copyWith(decoration: TextDecoration.underline),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ],
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

/// Ink-bordered field with the mono label printed inside the frame.
class _CsField extends StatelessWidget {
  const _CsField({
    required this.label,
    required this.controller,
    required this.hint,
    this.obscure = false,
    this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final bool obscure;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
      decoration: BoxDecoration(
        color: CsTokens.paper,
        border: CsTokens.border(),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CsSlug(label, size: 9),
          TextField(
            controller: controller,
            obscureText: obscure,
            keyboardType: keyboardType,
            style: const TextStyle(color: CsTokens.ink, fontSize: 15),
            cursorColor: CsTokens.ink,
            decoration: InputDecoration(
              isDense: true,
              border: InputBorder.none,
              hintText: hint,
              hintStyle:
                  const TextStyle(color: CsTokens.mutedInk, fontSize: 15),
            ),
          ),
        ],
      ),
    );
  }
}

class _CsOrDivider extends StatelessWidget {
  const _CsOrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: _HDash()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: CsSlug('or', size: 10),
        ),
        const Expanded(child: _HDash()),
      ],
    );
  }
}

class _HDash extends StatelessWidget {
  const _HDash();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(double.infinity, 2),
      painter: _HDashPainter(),
    );
  }
}

class _HDashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = CsTokens.ink
      ..strokeWidth = 2;
    const dash = 6.0;
    const gap = 5.0;
    var x = 0.0;
    final y = size.height / 2;
    while (x < size.width) {
      final end = (x + dash) > size.width ? size.width : (x + dash);
      canvas.drawLine(Offset(x, y), Offset(end, y), paint);
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _CsSocialButton extends StatelessWidget {
  const _CsSocialButton({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final Widget icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: CsTokens.touchTarget),
          decoration: BoxDecoration(
            color: CsTokens.paper,
            border: CsTokens.border(),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              const SizedBox(width: 10),
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  color: CsTokens.ink,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                ),
              ),
            ],
          ),
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
