import 'dart:convert';

import '../../../core/env/app_env.dart';
import '../../../core/network/api_client.dart';
import 'notification_models.dart';

class NotificationRepository {
  NotificationRepository({required this.apiClient, required this.env});

  final ApiClient apiClient;
  final AppEnv env;

  Future<({List<AppNotification> items, int unreadCount, String? nextCursor})>
      fetchNotifications({String? cursor}) async {
    final uri = StringBuffer('${env.apiBaseUrl}/notifications?limit=30');
    if (cursor != null) uri.write('&cursor=${Uri.encodeQueryComponent(cursor)}');

    final res = await apiClient.get(uri.toString());
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return (items: const <AppNotification>[], unreadCount: 0, nextCursor: null);
    }
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    final items = ((json['notifications'] as List?) ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(AppNotification.fromJson)
        .toList();
    final unreadCount =
        int.tryParse((json['unreadCount'] ?? 0).toString()) ?? 0;
    final nextCursor = json['nextCursor']?.toString();
    return (items: items, unreadCount: unreadCount, nextCursor: nextCursor);
  }

  Future<int> fetchUnreadCount() async {
    final res =
        await apiClient.get('${env.apiBaseUrl}/notifications/unread-count');
    if (res.statusCode < 200 || res.statusCode >= 300) return 0;
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    return int.tryParse((json['count'] ?? 0).toString()) ?? 0;
  }

  Future<void> markRead(String id) async {
    await apiClient.post(
      '${env.apiBaseUrl}/notifications/$id/read',
      body: '',
    );
  }

  Future<void> markAllRead() async {
    await apiClient.post(
      '${env.apiBaseUrl}/notifications/read-all',
      body: '',
    );
  }

  Future<void> registerDeviceToken(String token, String platform) async {
    await apiClient.post(
      '${env.apiBaseUrl}/notifications/device-token',
      body: jsonEncode({'token': token, 'platform': platform}),
    );
  }
}
