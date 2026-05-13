import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../data/notification_models.dart';
import '../data/notification_repository.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key, required this.repository});

  final NotificationRepository repository;

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<AppNotification> _items = const [];
  bool _loading = true;
  bool _loadingMore = false;
  String? _nextCursor;
  late ScrollController _scroll;

  @override
  void initState() {
    super.initState();
    _scroll = ScrollController()..addListener(_onScroll);
    _load();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 200 &&
        !_loadingMore &&
        _nextCursor != null) {
      _loadMore();
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final result = await widget.repository.fetchNotifications();
      if (mounted) {
        setState(() {
          _items = result.items;
          _nextCursor = result.nextCursor;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadMore() async {
    if (_nextCursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final result =
          await widget.repository.fetchNotifications(cursor: _nextCursor);
      if (mounted) {
        setState(() {
          _items = [..._items, ...result.items];
          _nextCursor = result.nextCursor;
          _loadingMore = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  Future<void> _markRead(AppNotification n) async {
    if (n.isRead) return;
    setState(() {
      _items = _items
          .map((e) => e.id == n.id ? e.copyWith(isRead: true) : e)
          .toList();
    });
    await widget.repository.markRead(n.id);
  }

  Future<void> _markAllRead() async {
    setState(() {
      _items = _items.map((e) => e.copyWith(isRead: true)).toList();
    });
    await widget.repository.markAllRead();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.background,
      appBar: AppBar(
        backgroundColor: AppTokens.surface,
        title: const Text('Notifications',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          if (_items.any((n) => !n.isRead))
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read',
                  style: TextStyle(color: AppTokens.brandOrange)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? _EmptyState(onRefresh: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    controller: _scroll,
                    itemCount: _items.length + (_loadingMore ? 1 : 0),
                    itemBuilder: (context, i) {
                      if (i == _items.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }
                      final n = _items[i];
                      return _NotificationTile(
                          notification: n, onTap: () => _markRead(n));
                    },
                  ),
                ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile(
      {required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  IconData get _icon {
    switch (notification.type) {
      case 'NEW_CONTENT':
        return Icons.movie_outlined;
      case 'RENTAL_EXPIRY':
        return Icons.access_time;
      case 'NEW_DEVICE_LOGIN':
        return Icons.devices_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = !notification.isRead;
    return InkWell(
      onTap: onTap,
      child: Container(
        color: unread
            ? AppTokens.surface.withOpacity(0.6)
            : Colors.transparent,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: unread
                      ? AppTokens.brandOrangeTint
                      : AppTokens.elevated,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(_icon,
                    size: 20,
                    color: unread
                        ? AppTokens.brandOrange
                        : AppTokens.secondaryText),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: TextStyle(
                              fontWeight: unread
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (unread)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(left: 8),
                            decoration: const BoxDecoration(
                              color: AppTokens.brandOrange,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notification.body,
                      style: const TextStyle(
                          color: AppTokens.secondaryText, height: 1.4),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatTime(notification.createdAt),
                      style: const TextStyle(
                          color: AppTokens.mutedText, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRefresh});

  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.notifications_none,
              size: 64, color: AppTokens.secondaryText),
          const SizedBox(height: 16),
          const Text('No notifications yet',
              style: TextStyle(
                  color: AppTokens.secondaryText,
                  fontSize: 16,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          const Text("We'll let you know when something happens",
              style: TextStyle(color: AppTokens.mutedText, fontSize: 14)),
          const SizedBox(height: 24),
          TextButton(
            onPressed: onRefresh,
            child: const Text('Refresh',
                style: TextStyle(color: AppTokens.brandOrange)),
          ),
        ],
      ),
    );
  }
}
