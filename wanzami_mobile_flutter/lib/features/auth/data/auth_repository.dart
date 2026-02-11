import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../../core/env/app_env.dart';
import '../domain/session_tokens.dart';
import 'token_store.dart';

class AuthRepository {
  AuthRepository({required this.client, required this.env, required this.tokenStore});

  final http.Client client;
  final AppEnv env;
  final TokenStore tokenStore;

  Future<SessionTokens> login({required String email, required String password}) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/login');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Login failed (${response.statusCode})');
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final tokens = SessionTokens(
      accessToken: (json['accessToken'] ?? '') as String,
      refreshToken: (json['refreshToken'] ?? '') as String,
    );

    if (tokens.accessToken.isEmpty || tokens.refreshToken.isEmpty) {
      throw Exception('Token payload is incomplete');
    }

    await tokenStore.save(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  Future<void> register({required String name, required String email, required String password}) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/signup');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Registration failed (${response.statusCode})');
    }
  }

  Future<bool> tryRefreshSession() async {
    final refreshToken = await tokenStore.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    final uri = Uri.parse('${env.apiBaseUrl}/auth/refresh');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      await tokenStore.clear();
      return false;
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final newAccessToken = (json['accessToken'] ?? '') as String;
    final newRefreshToken = (json['refreshToken'] ?? refreshToken) as String;

    if (newAccessToken.isEmpty) {
      return false;
    }

    await tokenStore.save(newAccessToken, newRefreshToken);
    return true;
  }

  Future<void> logout() => tokenStore.clear();
}
