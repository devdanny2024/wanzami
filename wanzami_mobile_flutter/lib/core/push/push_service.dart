import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../../features/notifications/data/notification_repository.dart';

/// Wires the device into Wanzami's admin broadcast channel. Every step is
/// best-effort: Firebase config isn't in the repo yet (it comes from a
/// per-environment GoogleService-Info.plist / google-services.json), so
/// failures here must never take down login or browsing.
class PushService {
  PushService({required this.notificationRepository});

  final NotificationRepository notificationRepository;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const _channel = AndroidNotificationChannel(
    'broadcast',
    'Announcements',
    description: 'New content and Wanzami announcements',
    importance: Importance.high,
  );

  bool _ready = false;

  Future<void> init() async {
    if (_ready) return;
    try {
      await Firebase.initializeApp();
      await _localNotifications.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(),
        ),
      );
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
      FirebaseMessaging.onMessage.listen(_showForegroundNotification);
      _ready = true;
    } catch (_) {
      // No Firebase config bundled for this environment yet — push stays off.
    }
  }

  Future<void> registerDevice() async {
    if (!_ready) return;
    try {
      final messaging = FirebaseMessaging.instance;
      if (Platform.isIOS) {
        await messaging.requestPermission(alert: true, badge: true, sound: true);
      }
      final token = await messaging.getToken();
      if (token != null) await _sendToken(token);
      messaging.onTokenRefresh.listen(_sendToken);
    } catch (_) {
      // Device just won't receive broadcasts this session.
    }
  }

  Future<void> _sendToken(String token) async {
    try {
      await notificationRepository.registerDeviceToken(
        token,
        Platform.isIOS ? 'IOS' : 'ANDROID',
      );
    } catch (_) {
      // Best-effort: a failed registration means this device misses the
      // next broadcast, not a reason to disrupt the session.
    }
  }

  void _showForegroundNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }
}
