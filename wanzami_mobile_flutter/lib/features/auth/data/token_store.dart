import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStore {
  TokenStore(this._storage);

  static const _refreshTokenKey = 'refresh_token';
  final FlutterSecureStorage _storage;

  String? _accessToken;

  String? get accessToken => _accessToken;

  Future<void> save(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> getRefreshToken() {
    return _storage.read(key: _refreshTokenKey);
  }

  Future<void> clear() async {
    _accessToken = null;
    await _storage.delete(key: _refreshTokenKey);
  }
}
