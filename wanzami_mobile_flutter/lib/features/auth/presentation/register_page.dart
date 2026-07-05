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

/// Register — "new crew", FORM W-02 on the call sheet.
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
      backgroundColor: CsTokens.paper,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CsPageHeader(title: 'Wanzami TV', chip: 'Form W-02'),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const CsSlug('New crew intake · INT. Wanzami Cinema'),
                    const SizedBox(height: 8),
                    Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                              text: 'JOIN\nTHE ',
                              style: CsTokens.display(size: 52)),
                          TextSpan(
                            text: 'CREW.',
                            style:
                                CsTokens.display(size: 52, color: CsTokens.rust),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    _CsField(
                      label: 'Full name',
                      controller: _name,
                      hint: 'Ada Obi',
                    ),
                    const SizedBox(height: 12),
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
                                          'Unable to create account')
                                      .toUpperCase(),
                                  style: CsTokens.mono(
                                      size: 10, color: CsTokens.rust),
                                ),
                              ),
                            CsButton(
                              loading ? 'Creating account…' : 'Create account →',
                              expand: true,
                              onTap: loading
                                  ? () {}
                                  : () async {
                                      await widget.controller.register(
                                        _name.text.trim(),
                                        _email.text.trim(),
                                        _password.text,
                                      );
                                      if (!mounted) return;
                                      if (widget.controller.status !=
                                          AuthStatus.error) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                                'Account created. Verify your email before signing in.'),
                                          ),
                                        );
                                        widget.onShowLogin();
                                      }
                                    },
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'BY SIGNING UP YOU AGREE TO OUR TERMS OF SERVICE AND PRIVACY POLICY.',
                      style: CsTokens.mono(size: 8.5),
                    ),
                    const SizedBox(height: 16),
                    const _CsOrDivider(),
                    const SizedBox(height: 14),
                    _CsSocialButton(
                      label: 'Sign up with Google',
                      icon: const _GoogleMark(),
                      onTap: _startGoogleSignup,
                    ),
                    const SizedBox(height: 10),
                    _CsSocialButton(
                      label: 'Sign up with Apple',
                      icon:
                          const Icon(Icons.apple, color: CsTokens.ink, size: 20),
                      onTap: _startAppleSignup,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: widget.onShowLogin,
                          behavior: HitTestBehavior.opaque,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Text(
                              '← ALREADY CREW? SIGN IN',
                              style: CsTokens.mono(
                                size: 11,
                                color: CsTokens.ink,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const CsStamp('New hire'),
                      ],
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
