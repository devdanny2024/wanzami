import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';
import '../../notifications/data/notification_repository.dart';
import '../../notifications/presentation/notifications_page.dart';
import '../../profile/data/profile_repository.dart';
import 'browse_pages.dart';
import 'cs_browse_page.dart';
import 'home_page.dart';
import 'live_page.dart';
import 'profile_page.dart';
import 'tickets_page.dart';

class HomeShellPage extends StatefulWidget {
  const HomeShellPage({
    super.key,
    required this.onLogout,
    required this.contentRepository,
    required this.profileRepository,
    required this.notificationRepository,
    required this.activeProfileId,
    this.initialTabIndex = 0,
    this.isGuest = false,
    this.onRequireLogin,
  });

  final VoidCallback onLogout;
  final ContentRepository contentRepository;
  final ProfileRepository profileRepository;
  final NotificationRepository notificationRepository;
  final String activeProfileId;
  final int initialTabIndex;
  final bool isGuest;
  final VoidCallback? onRequireLogin;

  @override
  State<HomeShellPage> createState() => _HomeShellPageState();
}

class _HomeShellPageState extends State<HomeShellPage> {
  late int _tabIndex;
  int _homeRefreshToken = 0;
  bool _playbackEndedSinceDetailOpen = false;
  int _unreadCount = 0;
  Timer? _notifTimer;

  int get _tabCount => widget.isGuest ? 3 : 5;

  @override
  void initState() {
    super.initState();
    _tabIndex = widget.initialTabIndex.clamp(0, _tabCount - 1).toInt();
    if (!widget.isGuest) {
      _fetchUnreadCount();
      _notifTimer = Timer.periodic(
        const Duration(minutes: 2),
        (_) => _fetchUnreadCount(),
      );
    }
  }

  @override
  void dispose() {
    _notifTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchUnreadCount() async {
    try {
      final count = await widget.notificationRepository.fetchUnreadCount();
      if (mounted) setState(() => _unreadCount = count);
    } catch (_) {}
  }

  Future<void> _openNotifications() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => NotificationsPage(
        repository: widget.notificationRepository,
      ),
    ));
    _fetchUnreadCount();
  }

  Future<void> _play(MediaItem item, MediaEpisode? episode) async {
    if (widget.isGuest) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Sign in to watch this title.')));
      widget.onRequireLogin?.call();
      return;
    }
    developer.log(
      'Playback open requested (titleId=${item.id}, episodeId=${episode?.id ?? 'none'})',
      name: 'HomeShellPage',
    );
    await Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => PlayerPage(
              item: item,
              episode: episode,
              contentRepository: widget.contentRepository,
              profileId: widget.activeProfileId,
            )));
    _playbackEndedSinceDetailOpen = true;
    developer.log(
      'Playback returned; mark home refresh pending',
      name: 'HomeShellPage',
    );
  }

  Future<void> _openDetail(MediaItem item) async {
    developer.log(
      'Opening detail (titleId=${item.id}, profileIdSet=${widget.activeProfileId.isNotEmpty})',
      name: 'HomeShellPage',
    );
    final detail = await widget.contentRepository
        .fetchTitleDetail(item.id, profileId: widget.activeProfileId);
    if (!mounted) return;

    _playbackEndedSinceDetailOpen = false;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => DetailPage(
          item: detail,
          onPlay: _play,
          repository: widget.contentRepository,
          profileId: widget.activeProfileId,
          isGuest: widget.isGuest,
          onRequireLogin: widget.onRequireLogin,
        ),
      ),
    );

    if (mounted && _playbackEndedSinceDetailOpen) {
      setState(() => _homeRefreshToken++);
      developer.log(
        'Home refresh token incremented to $_homeRefreshToken after playback',
        name: 'HomeShellPage',
      );
      _playbackEndedSinceDetailOpen = false;
    } else {
      developer.log(
        'Detail closed without playback; home refresh token unchanged ($_homeRefreshToken)',
        name: 'HomeShellPage',
      );
    }
  }

  Future<void> _openSearch() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: CsTokens.paper,
          body: SearchPage(
            repository: widget.contentRepository,
            onOpen: (item) => _openDetail(item),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      HomePage(
        repository: widget.contentRepository,
        profileId: widget.activeProfileId,
        refreshToken: _homeRefreshToken,
        onOpen: (item) => _openDetail(item),
        onOpenSearch: _openSearch,
        onOpenProfile: widget.isGuest
            ? (widget.onRequireLogin ?? () {})
            : () => setState(() => _tabIndex = 4),
      ),
      CsBrowsePage(
        repository: widget.contentRepository,
        profileId: widget.activeProfileId,
        onOpen: (item) => _openDetail(item),
      ),
      LivePage(
        repository: widget.contentRepository,
        profileId: widget.activeProfileId,
        onOpen: (event) => Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => PlayerPage(
              item: MediaItem(
                id: event.id,
                title: event.title,
                description: '',
                type: 'LIVE',
                thumbnailUrl: event.thumbnailUrl ?? '',
                bannerUrl: event.thumbnailUrl ?? '',
                playbackUrl: event.playbackUrl,
              ),
              contentRepository: widget.contentRepository,
              liveEventId: event.id,
            ),
          ),
        ),
      ),
      if (!widget.isGuest) ...[
        TicketsPage(
          repository: widget.contentRepository,
          profileId: widget.activeProfileId,
          onOpen: (item) => _openDetail(item),
        ),
        ProfilePage(
            onLogout: widget.onLogout,
            profileRepository: widget.profileRepository),
      ],
    ];

    return Scaffold(
      backgroundColor: CsTokens.paper,
      body: Stack(
        children: [
          pages[_tabIndex],
          if (widget.isGuest)
            Positioned(
              top: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8, top: 8),
                  child: GestureDetector(
                    onTap: widget.onRequireLogin,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: CsTokens.paper,
                        border: CsTokens.border(2),
                      ),
                      child: Text(
                        'SIGN IN',
                        style: CsTokens.mono(size: 11, weight: FontWeight.w800),
                      ),
                    ),
                  ),
                ),
              ),
            )
          else
            Positioned(
            top: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(right: 8, top: 2),
                child: Semantics(
                  button: true,
                  label: 'Notifications',
                  child: GestureDetector(
                    onTap: _openNotifications,
                    behavior: HitTestBehavior.opaque,
                    child: SizedBox(
                      width: CsTokens.touchTarget,
                      height: CsTokens.touchTarget,
                      child: Center(
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: CsTokens.paper,
                                border: CsTokens.border(2),
                              ),
                              child: const Icon(
                                Icons.notifications_outlined,
                                size: 18,
                                color: CsTokens.ink,
                              ),
                            ),
                            if (_unreadCount > 0)
                              Positioned(
                                top: -6,
                                right: -6,
                                child: Container(
                                  padding: const EdgeInsets.all(3),
                                  decoration: const BoxDecoration(
                                    color: CsTokens.rust,
                                    shape: BoxShape.circle,
                                  ),
                                  constraints: const BoxConstraints(
                                      minWidth: 16, minHeight: 16),
                                  child: Text(
                                    _unreadCount > 99 ? '99+' : '$_unreadCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: CsNavBar(
        selectedIndex: _tabIndex,
        onSelect: (value) => setState(() => _tabIndex = value),
        items: [
          const CsNavItem(Icons.home_outlined, Icons.home_rounded, 'Home'),
          const CsNavItem(Icons.menu_book_outlined, Icons.menu_book_rounded, 'Catalogue'),
          const CsNavItem(Icons.sensors_outlined, Icons.sensors_rounded, 'Live'),
          if (!widget.isGuest) ...[
            const CsNavItem(
                Icons.local_activity_outlined, Icons.local_activity_rounded, 'Tickets'),
            const CsNavItem(Icons.person_outline, Icons.person_rounded, 'Profile'),
          ],
        ],
      ),
    );
  }
}
