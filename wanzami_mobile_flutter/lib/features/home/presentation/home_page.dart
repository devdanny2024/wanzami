import 'dart:developer' as developer;

import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/widgets/callsheet_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

/// Home — "the daily programme". Lights-on paper surface: premiere hero,
/// continue watching, on-air strip, and film-strip rails of the catalog.
class HomePage extends StatefulWidget {
  const HomePage({
    super.key,
    required this.repository,
    required this.onOpen,
    required this.profileId,
    this.onOpenSearch,
    this.onOpenProfile,
    this.refreshToken = 0,
  });

  final ContentRepository repository;
  final ValueChanged<MediaItem> onOpen;
  final String profileId;
  final VoidCallback? onOpenSearch;
  final VoidCallback? onOpenProfile;
  final int refreshToken;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePayload {
  const _HomePayload({
    required this.items,
    required this.liveEvents,
    required this.continueWatching,
  });

  final List<MediaItem> items;
  final List<LiveEvent> liveEvents;
  final List<ContinueWatchingItem> continueWatching;
}

class _HomePageState extends State<HomePage> {
  late Future<_HomePayload> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void didUpdateWidget(covariant HomePage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profileId != widget.profileId ||
        oldWidget.refreshToken != widget.refreshToken) {
      setState(() => _future = _load());
    }
  }

  Future<_HomePayload> _load() async {
    Future<List<T>> safeFetch<T>(
      String label,
      Future<List<T>> Function() call,
    ) async {
      try {
        return await call();
      } catch (error) {
        developer.log('Home $label fetch failed: $error', name: 'HomePage');
        return <T>[];
      }
    }

    final results = await Future.wait([
      safeFetch<MediaItem>(
          'titles', () => widget.repository.fetchTitles(profileId: widget.profileId)),
      safeFetch<LiveEvent>('live events',
          () => widget.repository.fetchLiveEvents(profileId: widget.profileId)),
      safeFetch<ContinueWatchingItem>(
        'continue watching',
        () => widget.repository.fetchContinueWatching(profileId: widget.profileId),
      ),
    ]);
    return _HomePayload(
      items: results[0] as List<MediaItem>,
      liveEvents: results[1] as List<LiveEvent>,
      continueWatching: results[2] as List<ContinueWatchingItem>,
    );
  }

  void _openLiveAsItem(LiveEvent event) {
    widget.onOpen(
      MediaItem(
        id: event.id,
        title: event.title,
        description: event.status,
        type: 'LIVE',
        thumbnailUrl: event.thumbnailUrl ?? '',
        bannerUrl: event.thumbnailUrl ?? '',
        playbackUrl: event.playbackUrl,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: CsTokens.paper,
      child: FutureBuilder<_HomePayload>(
        future: _future,
        builder: (context, snapshot) {
          final loading = snapshot.connectionState == ConnectionState.waiting;
          final items = snapshot.data?.items ?? const <MediaItem>[];
          final live = snapshot.data?.liveEvents.where((e) => e.isLive).toList() ??
              const <LiveEvent>[];
          final continueWatching =
              snapshot.data?.continueWatching ?? const <ContinueWatchingItem>[];

          return CustomScrollView(
            slivers: [
              SliverPersistentHeader(
                pinned: true,
                delegate: _CsTopBarDelegate(
                  onOpenSearch: widget.onOpenSearch,
                  onOpenProfile: widget.onOpenProfile,
                ),
              ),
              if (loading)
                const SliverToBoxAdapter(child: _CsHomeSkeleton())
              else if (items.isEmpty && continueWatching.isEmpty && live.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: CsSlug('Nothing on the call sheet yet'),
                  ),
                )
              else
                SliverToBoxAdapter(
                  child: _CsHomeBody(
                    items: items,
                    live: live,
                    continueWatching: continueWatching,
                    onOpen: widget.onOpen,
                    onOpenLive: _openLiveAsItem,
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _CsHomeBody extends StatelessWidget {
  const _CsHomeBody({
    required this.items,
    required this.live,
    required this.continueWatching,
    required this.onOpen,
    required this.onOpenLive,
  });

  final List<MediaItem> items;
  final List<LiveEvent> live;
  final List<ContinueWatchingItem> continueWatching;
  final ValueChanged<MediaItem> onOpen;
  final ValueChanged<LiveEvent> onOpenLive;

  @override
  Widget build(BuildContext context) {
    final featured =
        items.isNotEmpty ? items.first : continueWatching.first.item;
    final movies = items.where((e) => !e.isSeries).toList();
    final series = items.where((e) => e.isSeries).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Featured presentation.
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 16, 14, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CsSlug('Scene 01 · Feature presentation'),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: () => onOpen(featured),
                child: CsBox(
                  shadow: 5,
                  borderWidth: CsTokens.borderWidthHeavy,
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        NetworkImageWithSkeleton(url: featured.bannerUrl),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.transparent,
                                Color(0xD9000000),
                              ],
                              stops: [0.0, 0.55, 1.0],
                            ),
                          ),
                        ),
                        Positioned(
                          top: 8,
                          left: 8,
                          child: CsSticker(
                            featured.isPpv ? 'Now selling' : 'Now showing',
                          ),
                        ),
                        Positioned(
                          left: 10,
                          right: 10,
                          bottom: 8,
                          child: Text(
                            featured.title.toUpperCase(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: CsTokens.display(size: 30, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Continue watching.
        if (continueWatching.isNotEmpty) ...[
          const SizedBox(height: 22),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14),
            child: CsSlug('Continue watching'),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 128,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: continueWatching.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final entry = continueWatching[i];
                return _ResumeCard(entry: entry, onTap: () => onOpen(entry.item));
              },
            ),
          ),
        ],

        // Live now.
        if (live.isNotEmpty) ...[
          const SizedBox(height: 22),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 14),
            child: CsSlug('On air · live now'),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 140,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: live.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final event = live[i];
                return _LiveCard(event: event, onTap: () => onOpenLive(event));
              },
            ),
          ),
        ],

        // Trending film strip.
        if (items.isNotEmpty) ...[
          const SizedBox(height: 24),
          CsFilmStrip(
            caption: 'Reel A · Trending now',
            height: 92,
            itemCount: items.take(12).length,
            itemBuilder: (_, i) {
              final item = items[i];
              return _FilmFrame(item: item, onTap: () => onOpen(item));
            },
          ),
        ],

        // The slate.
        if (movies.isNotEmpty)
          _PosterRail(
            slug: 'The slate · Films',
            items: movies.take(12).toList(),
            onOpen: onOpen,
          ),
        if (series.isNotEmpty)
          _PosterRail(
            slug: 'The slate · Series',
            items: series.take(12).toList(),
            onOpen: onOpen,
          ),
        if (items.length > 1)
          _PosterRail(
            slug: 'Fresh prints · New on Wanzami',
            items: items.skip(1).take(12).toList(),
            onOpen: onOpen,
          ),

        const SizedBox(height: 28),
        Center(
          child: CsSlug('End of programme · roll credits', size: 10),
        ),
        const SizedBox(height: 96),
      ],
    );
  }
}

class _ResumeCard extends StatelessWidget {
  const _ResumeCard({required this.entry, required this.onTap});

  final ContinueWatchingItem entry;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final percent = entry.completionPercent.clamp(0.02, 1.0);
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 176,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CsBox(
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    NetworkImageWithSkeleton(url: entry.item.thumbnailUrl),
                    Align(
                      alignment: Alignment.bottomLeft,
                      child: FractionallySizedBox(
                        widthFactor: percent.toDouble(),
                        child: Container(height: 4, color: CsTokens.brand),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 5),
            Text(
              entry.item.title.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: CsTokens.mono(size: 10, color: CsTokens.ink),
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveCard extends StatelessWidget {
  const _LiveCard({required this.event, required this.onTap});

  final LiveEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 220,
        child: CsBox(
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(
              fit: StackFit.expand,
              children: [
                NetworkImageWithSkeleton(url: event.thumbnailUrl ?? ''),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xCC000000)],
                      stops: [0.5, 1.0],
                    ),
                  ),
                ),
                Positioned(
                  top: 7,
                  left: 7,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    color: CsTokens.rust,
                    child: const Text(
                      'ON AIR',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 8,
                  right: 8,
                  bottom: 6,
                  child: Text(
                    event.title.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: CsTokens.display(size: 16, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilmFrame extends StatelessWidget {
  const _FilmFrame({required this.item, required this.onTap});

  final MediaItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 156,
        child: Stack(
          fit: StackFit.expand,
          children: [
            NetworkImageWithSkeleton(url: item.thumbnailUrl),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xCC000000)],
                  stops: [0.55, 1.0],
                ),
              ),
            ),
            Positioned(
              left: 6,
              right: 6,
              bottom: 4,
              child: Text(
                item.title.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: CsTokens.mono(
                  size: 9,
                  color: Colors.white,
                  weight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PosterRail extends StatelessWidget {
  const _PosterRail({
    required this.slug,
    required this.items,
    required this.onOpen,
  });

  final String slug;
  final List<MediaItem> items;
  final ValueChanged<MediaItem> onOpen;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 22),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: CsSlug(slug),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 196,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final item = items[i];
              return GestureDetector(
                onTap: () => onOpen(item),
                child: SizedBox(
                  width: 118,
                  child: CsBox(
                    borderWidth: 2,
                    child: AspectRatio(
                      aspectRatio: 2 / 3,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          NetworkImageWithSkeleton(url: item.thumbnailUrl),
                          const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Color(0xCC000000)],
                                stops: [0.6, 1.0],
                              ),
                            ),
                          ),
                          Positioned(
                            left: 6,
                            right: 6,
                            bottom: 5,
                            child: Text(
                              item.title.toUpperCase(),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: CsTokens.mono(
                                size: 9,
                                color: Colors.white,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _CsTopBarDelegate extends SliverPersistentHeaderDelegate {
  _CsTopBarDelegate({this.onOpenSearch, this.onOpenProfile});

  final VoidCallback? onOpenSearch;
  final VoidCallback? onOpenProfile;

  @override
  double get maxExtent => 100;

  @override
  double get minExtent => 100;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      decoration: BoxDecoration(
        color: CsTokens.paper,
        border: Border(bottom: CsTokens.side(CsTokens.borderWidthHeavy)),
      ),
      padding: const EdgeInsets.fromLTRB(14, 44, 8, 0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'WANZAMI · DAILY PROGRAMME',
                  style: CsTokens.mono(
                      size: 12, color: CsTokens.ink, weight: FontWeight.w700),
                ),
                const SizedBox(height: 3),
                CsSlug('Call sheet № 001', size: 9),
              ],
            ),
          ),
          _InkIconButton(icon: Icons.search, label: 'Search', onTap: onOpenSearch),
          _InkIconButton(
              icon: Icons.person_outline, label: 'Profile', onTap: onOpenProfile),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _CsTopBarDelegate oldDelegate) => false;
}

class _InkIconButton extends StatelessWidget {
  const _InkIconButton({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: CsTokens.touchTarget,
          height: CsTokens.touchTarget,
          child: Center(
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(border: CsTokens.border(2)),
              child: Icon(icon, size: 18, color: CsTokens.ink),
            ),
          ),
        ),
      ),
    );
  }
}

class _CsHomeSkeleton extends StatelessWidget {
  const _CsHomeSkeleton();

  @override
  Widget build(BuildContext context) {
    Widget block(double height, {double? width}) => Container(
          height: height,
          width: width,
          decoration: BoxDecoration(
            color: CsTokens.panel,
            border: CsTokens.border(2),
          ),
        );

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          block(14, width: 180),
          const SizedBox(height: 10),
          AspectRatio(aspectRatio: 16 / 9, child: block(10)),
          const SizedBox(height: 24),
          block(14, width: 140),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: AspectRatio(aspectRatio: 16 / 9, child: block(10))),
              const SizedBox(width: 10),
              Expanded(child: AspectRatio(aspectRatio: 16 / 9, child: block(10))),
            ],
          ),
          const SizedBox(height: 24),
          block(120),
        ],
      ),
    );
  }
}
