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
      throw Exception(_extractError(response, fallback: 'Login failed'));
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

  Future<String> getGoogleAuthUrl({required String redirectUri}) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/google/url?redirectUri=${Uri.encodeComponent(redirectUri)}');
    final response = await client.get(uri, headers: {'Content-Type': 'application/json'});

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response, fallback: 'Unable to start Google sign-in'));
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final url = (json['url'] ?? '') as String;
    if (url.isEmpty) {
      throw Exception('Google sign-in URL missing from server response');
    }
    return url;
  }

  Future<SessionTokens> loginWithGoogleCode({
    required String code,
    String? state,
    String? redirectUri,
  }) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/google/callback');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'code': code,
        if (state != null && state.isNotEmpty) 'state': state,
        if (redirectUri != null && redirectUri.isNotEmpty) 'redirectUri': redirectUri,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response, fallback: 'Google sign-in failed'));
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final tokens = SessionTokens(
      accessToken: (json['accessToken'] ?? '') as String,
      refreshToken: (json['refreshToken'] ?? '') as String,
    );

    if (tokens.accessToken.isEmpty || tokens.refreshToken.isEmpty) {
      throw Exception('Google token payload is incomplete');
    }

    await tokenStore.save(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  Future<SessionTokens> loginWithGoogleAuthCode({required String authCode}) {
    // Let backend use its configured GOOGLE_REDIRECT_URI for token exchange.
    return loginWithGoogleCode(code: authCode);
  }

  Future<void> completeOnboarding({
    required List<String> preferredGenres,
    required String heardFrom,
    int? birthYear,
  }) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/complete-onboarding');
    final headers = <String, String>{'Content-Type': 'application/json'};
    final access = tokenStore.accessToken;
    if (access != null && access.isNotEmpty) {
      headers['Authorization'] = 'Bearer $access';
    }

    final response = await client.post(
      uri,
      headers: headers,
      body: jsonEncode({
        'preferredGenres': preferredGenres,
        'heardFrom': heardFrom,
        if (birthYear != null) 'birthYear': birthYear,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response, fallback: 'Unable to save preferences'));
    }
  }

  Future<SessionTokens> loginWithApple({
    required String identityToken,
    String? name,
  }) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/apple/callback');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identityToken': identityToken,
        if (name != null && name.isNotEmpty) 'name': name,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response, fallback: 'Apple sign-in failed'));
    }

    final json = jsonDecode(response.body) as Map<String, dynamic>;
    final tokens = SessionTokens(
      accessToken: (json['accessToken'] ?? '') as String,
      refreshToken: (json['refreshToken'] ?? '') as String,
    );

    if (tokens.accessToken.isEmpty || tokens.refreshToken.isEmpty) {
      throw Exception('Apple token payload is incomplete');
    }

    await tokenStore.save(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  Future<void> forgotPassword(String email) async {
    final uri = Uri.parse('${env.apiBaseUrl}/auth/forgot-password');
    final response = await client.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(_extractError(response, fallback: 'Unable to send reset email'));
    }
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

  Future<bool> hasValidSession() async {
    return tryRefreshSession();
  }

  Future<void> logout() async {
    final refreshToken = await tokenStore.getRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await client.post(
        Uri.parse('${env.apiBaseUrl}/auth/logout'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    }
    await tokenStore.clear();
  }

  String _extractError(http.Response response, {required String fallback}) {
    try {
      final body = jsonDecode(response.body);
      if (body is Map<String, dynamic>) {
        final message = body['message'];
        if (message is String && message.isNotEmpty) {
          return '$message (${response.statusCode})';
        }
        final code = body['code'];
        if (code is String && code.isNotEmpty) {
          return '$code (${response.statusCode})';
        }
      }
    } catch (_) {}
    return '$fallback (${response.statusCode})';
  }
}
