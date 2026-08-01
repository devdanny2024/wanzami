import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../core/env/app_env.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/data/auth_repository.dart';
import '../features/auth/data/token_store.dart';
import '../features/auth/presentation/auth_controller.dart';
import '../features/auth/presentation/login_page.dart';
import '../features/auth/presentation/register_page.dart';
import '../features/auth/presentation/splash_page.dart';
import '../features/auth/presentation/onboarding_page.dart';
import '../features/content/data/content_repository.dart';
import '../features/home/presentation/home_shell_page.dart';
import '../features/notifications/data/notification_repository.dart';
import '../features/profile/data/profile_repository.dart';
import '../features/profile/presentation/profile_picker_page.dart';

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
  late final ApiClient _apiClient;
  late final ContentRepository _contentRepository;
  late final ProfileRepository _profileRepository;
  late final NotificationRepository _notificationRepository;

  // CI-only: boots straight into guest browse for App Store screenshot capture.
  // Off by default; only set via --dart-define=CS_SCREENSHOT_MODE=true.
  static const bool _screenshotMode =
      bool.fromEnvironment('CS_SCREENSHOT_MODE', defaultValue: false);

  bool _showRegister = false;
  bool _showSplash = true;
  bool _browsingAsGuest = _screenshotMode;
  bool _checkingOnboarding = false;
  bool _needsOnboarding = false;
  Map<String, dynamic>? _activeProfile;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _tokenStore = TokenStore(const FlutterSecureStorage());
    _authRepository = AuthRepository(
      client: http.Client(),
      env: widget.env,
      tokenStore: _tokenStore,
    );
    _authController = AuthController(_authRepository);
    _apiClient = ApiClient(httpClient: http.Client(), tokenStore: _tokenStore, authRepository: _authRepository);
    _contentRepository = ContentRepository(apiClient: _apiClient, env: widget.env);
    _profileRepository = ProfileRepository(apiClient: _apiClient, env: widget.env);
    _notificationRepository = NotificationRepository(apiClient: _apiClient, env: widget.env);

    _authController.addListener(_handleAuthStateChange);

    Timer(const Duration(milliseconds: 2500), () {
      if (mounted) setState(() => _showSplash = false);
    });
  }

  void _handleAuthStateChange() {
    _syncAuthState();
  }

  Future<void> _syncAuthState() async {
    if (_authController.status != AuthStatus.authenticated) {
      if (mounted && (_activeProfile != null || _needsOnboarding || _checkingOnboarding)) {
        setState(() {
          _activeProfile = null;
          _needsOnboarding = false;
          _checkingOnboarding = false;
        });
      }
      return;
    }

    if (mounted && _browsingAsGuest) {
      setState(() => _browsingAsGuest = false);
    }

    if (_checkingOnboarding || _activeProfile != null) return;

    setState(() => _checkingOnboarding = true);
    try {
      final me = await _profileRepository.me();
      final profiles = (me['profiles'] as List?)?.whereType<Map<String, dynamic>>().toList() ?? const [];
      final first = profiles.isNotEmpty ? profiles.first : const <String, dynamic>{};
      final prefs = (first['preferences'] is Map<String, dynamic>)
          ? (first['preferences'] as Map<String, dynamic>)
          : const <String, dynamic>{};
      final preferred = (prefs['preferredGenres'] as List?) ?? const [];
      final heard = (prefs['heardFrom'] ?? '').toString();
      final needs = preferred.isEmpty || heard.isEmpty;
      if (!mounted) return;
      setState(() {
        _needsOnboarding = needs;
        _checkingOnboarding = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _needsOnboarding = false;
        _checkingOnboarding = false;
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _authController.removeListener(_handleAuthStateChange);
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
          if (_authController.status != AuthStatus.authenticated && _activeProfile != null) {
            _activeProfile = null;
          }

          Widget page;
          if (_showSplash) {
            page = const SplashPage(key: ValueKey('splash'));
          } else if (_authController.status == AuthStatus.authenticated) {
            if (_checkingOnboarding) {
              page = const SplashPage(key: ValueKey('checking-onboarding'));
            } else if (_needsOnboarding) {
              page = OnboardingPage(
                key: const ValueKey('onboarding'),
                controller: _authController,
                onDone: () => setState(() => _needsOnboarding = false),
              );
            } else if (_activeProfile == null) {
              page = ProfilePickerPage(
                key: const ValueKey('profile-picker'),
                profileRepository: _profileRepository,
                onLogout: _authController.logout,
                onPicked: (profile) => setState(() => _activeProfile = profile),
              );
            } else {
              page = HomeShellPage(
                key: ValueKey('home-${_activeProfile!['id'] ?? 'picked'}'),
                onLogout: () {
                  setState(() => _activeProfile = null);
                  _authController.logout();
                },
                onDeleteAccount: () async {
                  await _authController.deleteAccount();
                  if (mounted) setState(() => _activeProfile = null);
                },
                contentRepository: _contentRepository,
                profileRepository: _profileRepository,
                notificationRepository: _notificationRepository,
                activeProfileId: (_activeProfile!['id'] ?? '').toString(),
                initialTabIndex: 0,
              );
            }
          } else if (_browsingAsGuest) {
            page = HomeShellPage(
              key: const ValueKey('guest-home'),
              onLogout: () => setState(() => _browsingAsGuest = false),
              contentRepository: _contentRepository,
              profileRepository: _profileRepository,
              notificationRepository: _notificationRepository,
              activeProfileId: '',
              initialTabIndex: 0,
              isGuest: true,
              onRequireLogin: () => setState(() => _browsingAsGuest = false),
            );
          } else if (_showRegister) {
            page = RegisterPage(
              key: const ValueKey('register'),
              controller: _authController,
              onShowLogin: () => setState(() => _showRegister = false),
              env: widget.env,
            );
          } else {
            page = LoginPage(
              key: const ValueKey('login'),
              controller: _authController,
              onShowRegister: () => setState(() => _showRegister = true),
              env: widget.env,
              onBrowseAsGuest: () => setState(() => _browsingAsGuest = true),
            );
          }

          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              final offset = Tween<Offset>(
                begin: const Offset(0, 0.03),
                end: Offset.zero,
              ).animate(animation);
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(position: offset, child: child),
              );
            },
            child: page,
          );
        },
      ),
    );
  }
}
