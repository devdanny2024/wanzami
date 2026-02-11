import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../core/env/app_env.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/data/token_store.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/home/presentation/home_shell_page.dart';

class WanzamiApp extends StatefulWidget {
  const WanzamiApp({super.key, required this.env});

  final AppEnv env;

  @override
  State<WanzamiApp> createState() => _WanzamiAppState();
}

class _WanzamiAppState extends State<WanzamiApp> with WidgetsBindingObserver {
  late final TokenStore _tokenStore;
  late final AuthRepository _authRepository;
  late final AuthController _authController;

  bool _showRegister = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _tokenStore = TokenStore(const FlutterSecureStorage());
    _authRepository = AuthRepository(client: http.Client(), env: widget.env, tokenStore: _tokenStore);
    _authController = AuthController(_authRepository);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _authController.refreshOnResume();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wanzami',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      home: AnimatedBuilder(
        animation: _authController,
        builder: (_, __) {
          if (_authController.status == AuthStatus.authenticated) {
            return const HomeShellPage();
          }
          if (_showRegister) {
            return RegisterPage(
              controller: _authController,
              onShowLogin: () => setState(() => _showRegister = false),
            );
          }
          return LoginPage(
            controller: _authController,
            onShowRegister: () => setState(() => _showRegister = true),
          );
        },
      ),
    );
  }
}
