import 'dart:convert';

import '../../../core/env/app_env.dart';
import '../../../core/network/api_client.dart';

class ProfileRepository {
  ProfileRepository({required this.apiClient, required this.env});

  final ApiClient apiClient;
  final AppEnv env;

  Future<Map<String, dynamic>> me() async {
    final response = await apiClient.get('${env.apiBaseUrl}/auth/me');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load profile (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<List<Map<String, dynamic>>> profiles() async {
    final response = await apiClient.get('${env.apiBaseUrl}/user/profiles');
    if (response.statusCode < 200 || response.statusCode >= 300) return const [];
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ((json['profiles'] as List?) ?? const []).whereType<Map<String, dynamic>>().toList();
  }

  Future<Map<String, dynamic>> createProfile({required String name, bool kidMode = false}) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/user/profiles',
      body: jsonEncode({'name': name, 'kidMode': kidMode}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to create profile (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<void> updateProfile(String id, {String? name, bool? kidMode, String? language}) async {
    final response = await apiClient.patch(
      '${env.apiBaseUrl}/user/profiles/$id',
      body: jsonEncode({'name': name, 'kidMode': kidMode, 'language': language}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to update profile (${response.statusCode})');
    }
  }

  Future<void> deleteProfile(String id) async {
    final response = await apiClient.delete('${env.apiBaseUrl}/user/profiles/$id');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to delete profile (${response.statusCode})');
    }
  }

  Future<List<Map<String, dynamic>>> devices() async {
    final response = await apiClient.get('${env.apiBaseUrl}/user/devices');
    if (response.statusCode < 200 || response.statusCode >= 300) return const [];
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    return ((json['devices'] as List?) ?? const []).whereType<Map<String, dynamic>>().toList();
  }

  Future<void> assignDeviceProfile({required String deviceId, required String profileId}) async {
    final response = await apiClient.post(
      '${env.apiBaseUrl}/user/devices/$deviceId/profile',
      body: jsonEncode({'profileId': profileId}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to assign profile (${response.statusCode})');
    }
  }
}
