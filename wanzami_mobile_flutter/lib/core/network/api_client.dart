import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/data/token_store.dart';

class ApiClient {
  ApiClient({required this.httpClient, required this.tokenStore, required this.authRepository});

  final http.Client httpClient;
  final TokenStore tokenStore;
  final AuthRepository authRepository;

  Future<http.Response> get(String url, {Map<String, String>? headers}) {
    return _sendWithRetry(
      () => httpClient.get(Uri.parse(url), headers: _authHeaders(headers)),
      () => httpClient.get(Uri.parse(url), headers: _authHeaders(headers)),
    );
  }

  Future<http.Response> post(
    String url, {
    Map<String, String>? headers,
    Object? body,
  }) {
    return _sendWithRetry(
      () => httpClient.post(Uri.parse(url), headers: _authHeaders(headers), body: body),
      () => httpClient.post(Uri.parse(url), headers: _authHeaders(headers), body: body),
    );
  }

  Future<http.Response> patch(
    String url, {
    Map<String, String>? headers,
    Object? body,
  }) {
    return _sendWithRetry(
      () => httpClient.patch(Uri.parse(url), headers: _authHeaders(headers), body: body),
      () => httpClient.patch(Uri.parse(url), headers: _authHeaders(headers), body: body),
    );
  }

  Future<http.Response> delete(
    String url, {
    Map<String, String>? headers,
    Object? body,
  }) {
    return _sendWithRetry(
      () => httpClient.delete(Uri.parse(url), headers: _authHeaders(headers), body: body),
      () => httpClient.delete(Uri.parse(url), headers: _authHeaders(headers), body: body),
    );
  }

  Future<http.Response> _sendWithRetry(
    Future<http.Response> Function() firstCall,
    Future<http.Response> Function() retryCall,
  ) async {
    final first = await firstCall();
    if (first.statusCode != 401) return first;

    final refreshed = await authRepository.tryRefreshSession();
    if (!refreshed) return first;

    // Exactly one retry after refresh
    return retryCall();
  }

  Map<String, String> _authHeaders(Map<String, String>? headers) {
    final map = <String, String>{
      'Content-Type': 'application/json',
      ...?headers,
    };

    final access = tokenStore.accessToken;
    if (access != null && access.isNotEmpty) {
      map['Authorization'] = 'Bearer $access';
    }
    return map;
  }

  static String encodeBody(Map<String, dynamic> data) => jsonEncode(data);
}
