import 'package:flutter/widgets.dart';

import '../data/auth_repository.dart';

enum AuthStatus { unauthenticated, loading, authenticated, error }

class AuthController extends ChangeNotifier {
  AuthController(this._authRepository);

  final AuthRepository _authRepository;

  AuthStatus status = AuthStatus.unauthenticated;
  String? errorMessage;

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

  Future<void> refreshOnResume() async {
    await _authRepository.tryRefreshSession();
  }

  Future<void> logout() async {
    await _authRepository.logout();
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }
}
