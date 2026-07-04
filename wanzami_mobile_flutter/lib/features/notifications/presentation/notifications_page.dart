import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../data/notification_models.dart';
import '../data/notification_repository.dart';

/// Notifications — "production memos" pinned to the call sheet.
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
      backgroundColor: CsTokens.paper,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              decoration: BoxDecoration(
                color: CsTokens.paper,
                border:
                    Border(bottom: CsTokens.side(CsTokens.borderWidthHeavy)),
              ),
              padding: const EdgeInsets.fromLTRB(4, 4, 14, 6),
              child: Row(
                children: [
                  Semantics(
                    button: true,
                    label: 'Back',
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      behavior: HitTestBehavior.opaque,
                      child: SizedBox(
                        width: CsTokens.touchTarget,
                        height: CsTokens.touchTarget,
                        child: Center(
                          child: Text('←',
                              style: CsTokens.mono(
                                  size: 16,
                                  color: CsTokens.ink,
                                  weight: FontWeight.w700)),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text('PRODUCTION MEMOS',
                        style: CsTokens.display(size: 22)),
                  ),
                  if (unreadCount > 0) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(border: CsTokens.border(2)),
                      child: CsSlug('$unreadCount new', color: CsTokens.ink),
                    ),
                    const SizedBox(width: 10),
                    GestureDetector(
                      onTap: _markAllRead,
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Text('MARK ALL',
                            style: CsTokens.mono(
                                size: 10,
                                color: CsTokens.rust,
                                weight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: CsTokens.rust))
                  : _items.isEmpty
                      ? _EmptyState(onRefresh: _load)
                      : RefreshIndicator(
                          color: CsTokens.rust,
                          onRefresh: _load,
                          child: ListView.separated(
                            controller: _scroll,
                            padding:
                                const EdgeInsets.fromLTRB(14, 14, 14, 24),
                            itemCount:
                                _items.length + (_loadingMore ? 1 : 0),
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
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
                                          color: CsTokens.rust),
                                    ),
                                  ),
                                );
                              }
                              final n = _items[i];
                              return _MemoTile(
                                  notification: n,
                                  onTap: () => _markRead(n));
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MemoTile extends StatelessWidget {
  const _MemoTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  String get _kind {
    switch (notification.type) {
      case 'NEW_CONTENT':
        return 'New release';
      case 'RENTAL_EXPIRY':
        return 'Ticket expiry';
      case 'NEW_DEVICE_LOGIN':
        return 'New device';
      default:
        return 'Memo';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = !notification.isRead;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: unread ? CsTokens.panel : CsTokens.paper,
          border: CsTokens.border(2),
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(width: 5, color: unread ? CsTokens.rust : CsTokens.panel),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 11, 12, 11),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CsSlug(_kind, size: 9,
                              color:
                                  unread ? CsTokens.rust : CsTokens.mutedInk),
                          const Spacer(),
                          CsSlug(_formatTime(notification.createdAt), size: 9),
                          if (unread) ...[
                            const SizedBox(width: 8),
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: CsTokens.rust,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        notification.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: unread
                            ? CsTokens.bodyBold
                            : CsTokens.body.copyWith(
                                fontWeight: FontWeight.w600,
                                color: CsTokens.inkSoft),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        notification.body,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: CsTokens.body.copyWith(fontSize: 13),
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
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CsBox(
              color: CsTokens.panel,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CsSlug('Memo board clear'),
                  const SizedBox(height: 6),
                  Text('NO MEMOS YET', style: CsTokens.display(size: 28)),
                  const SizedBox(height: 4),
                  const Text("We'll pin one here when something happens.",
                      style: CsTokens.body),
                ],
              ),
            ),
            const SizedBox(height: 14),
            CsButton('Refresh', primary: false, expand: true, onTap: onRefresh),
          ],
        ),
      ),
    );
  }
}
