import 'package:flutter/widgets.dart';

import '../data/auth_repository.dart';

enum AuthStatus { unauthenticated, loading, authenticated, error }

class AuthController extends ChangeNotifier {
  AuthController(this._authRepository) {
    bootstrap();
  }

  final AuthRepository _authRepository;

  AuthStatus status = AuthStatus.unauthenticated;
  String? errorMessage;

  Future<String> getGoogleAuthUrl({required String redirectUri}) {
    return _authRepository.getGoogleAuthUrl(redirectUri: redirectUri);
  }

  Future<void> login(String email, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.login(email: email, password: password);
      status = AuthStatus.authenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> loginWithGoogleCode({
    required String code,
    String? state,
    required String redirectUri,
  }) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.loginWithGoogleCode(
        code: code,
        state: state,
        redirectUri: redirectUri,
      );
      status = AuthStatus.authenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> loginWithGoogleAuthCode(String authCode) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.loginWithGoogleAuthCode(authCode: authCode);
      status = AuthStatus.authenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> completeOnboarding({
    required List<String> preferredGenres,
    required String heardFrom,
    int? birthYear,
  }) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.completeOnboarding(
        preferredGenres: preferredGenres,
        heardFrom: heardFrom,
        birthYear: birthYear,
      );
      status = AuthStatus.authenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> loginWithApple({
    required String identityToken,
    String? name,
  }) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.loginWithApple(identityToken: identityToken, name: name);
      status = AuthStatus.authenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> forgotPassword(String email) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.forgotPassword(email);
      status = AuthStatus.unauthenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> register(String name, String email, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      await _authRepository.register(name: name, email: email, password: password);
      // lock to verification flow policy (requires verified email before app access)
      status = AuthStatus.unauthenticated;
    } catch (e) {
      status = AuthStatus.error;
      errorMessage = e.toString();
    }

    notifyListeners();
  }

  Future<void> bootstrap() async {
    final valid = await _authRepository.hasValidSession();
    status = valid ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> refreshOnResume() async {
    final valid = await _authRepository.hasValidSession();
    status = valid ? AuthStatus.authenticated : AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> logout() async {
    await _authRepository.logout();
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
