import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/wanzami_kit.dart';
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
    final unreadCount = _items.where((n) => !n.isRead).length;
    return Scaffold(
      backgroundColor: AppTokens.background,
      appBar: AppBar(
        backgroundColor: AppTokens.surface,
        title: Row(
          children: [
            const Text('Notifications',
                style: TextStyle(fontWeight: FontWeight.w700)),
            if (unreadCount > 0) ...[
              const SizedBox(width: 10),
              BrandPill(label: '$unreadCount new'),
            ],
          ],
        ),
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all,
                  size: 18, color: AppTokens.brandOrange),
              label: const Text('Mark all read',
                  style: TextStyle(
                      color: AppTokens.brandOrange,
                      fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? _EmptyState(onRefresh: _load)
              : RefreshIndicator(
                  color: AppTokens.brandOrange,
                  backgroundColor: AppTokens.elevated,
                  onRefresh: _load,
                  child: ListView.separated(
                    controller: _scroll,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: _items.length + (_loadingMore ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      if (i == _items.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.4,
                                  color: AppTokens.brandOrange),
                            ),
                          ),
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
    return Pressable(
      onTap: onTap,
      scale: 0.985,
      child: Container(
        decoration: BoxDecoration(
          color: unread ? AppTokens.surface : AppTokens.surface.withOpacity(0.5),
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          border: Border.all(
            color: unread ? AppTokens.brandOrangeTint : AppTokens.border,
          ),
          boxShadow: unread ? AppTokens.cardShadow : null,
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Orange accent bar for unread items.
              Container(
                width: 4,
                decoration: BoxDecoration(
                  gradient: unread ? AppTokens.brandGradient : null,
                  color: unread ? null : Colors.transparent,
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: unread
                              ? AppTokens.brandOrangeTint
                              : AppTokens.elevated,
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          boxShadow: unread ? AppTokens.brandGlow : null,
                        ),
                        child: Icon(_icon,
                            size: 21,
                            color: unread
                                ? AppTokens.brandOrange
                                : AppTokens.secondaryText),
                      ),
                      const SizedBox(width: 14),
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
                                      fontSize: 15,
                                      color: AppTokens.primaryText,
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
                                    width: 9,
                                    height: 9,
                                    margin: const EdgeInsets.only(left: 8),
                                    decoration: const BoxDecoration(
                                      color: AppTokens.brandOrange,
                                      shape: BoxShape.circle,
                                      boxShadow: AppTokens.brandGlow,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 5),
                            Text(
                              notification.body,
                              style: const TextStyle(
                                  color: AppTokens.secondaryText,
                                  height: 1.4,
                                  fontSize: 13),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.schedule,
                                    size: 13, color: AppTokens.mutedText),
                                const SizedBox(width: 5),
                                Text(
                                  _formatTime(notification.createdAt),
                                  style: const TextStyle(
                                      color: AppTokens.mutedText,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
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
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              color: AppTokens.surface,
              shape: BoxShape.circle,
              border: Border.all(color: AppTokens.brandOrangeTint),
              boxShadow: AppTokens.brandGlow,
            ),
            child: const Icon(Icons.notifications_none_rounded,
                size: 44, color: AppTokens.brandOrange),
          ),
          const SizedBox(height: 24),
          const Text('No notifications yet',
              style: TextStyle(
                  color: AppTokens.primaryText,
                  fontSize: 18,
                  fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          const Text("We'll let you know when something happens",
              style: TextStyle(color: AppTokens.secondaryText, fontSize: 14)),
          const SizedBox(height: 26),
          OutlinedButton.icon(
            onPressed: onRefresh,
            style: OutlinedButton.styleFrom(
              foregroundColor: AppTokens.brandOrange,
              side: const BorderSide(color: AppTokens.brandOrange),
              shape: const StadiumBorder(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
            ),
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Refresh',
                style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
