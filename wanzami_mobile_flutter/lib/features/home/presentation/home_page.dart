import 'dart:developer' as developer;

import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/section_image_reveal.dart';
import '../../../core/widgets/wanzami_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

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
        developer.log(
          'Home $label fetch failed: $error',
          name: 'HomePage',
        );
        return <T>[];
      }
    }

    final results = await Future.wait([
      safeFetch<MediaItem>(
          'titles',
          () => widget.repository.fetchTitles(profileId: widget.profileId)),
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

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_HomePayload>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return _HomeLoadingScaffold(
            onOpenSearch: widget.onOpenSearch,
            onOpenProfile: widget.onOpenProfile,
          );
        }

        final items = snapshot.data?.items ?? const <MediaItem>[];
        final live =
            snapshot.data?.liveEvents.where((e) => e.isLive).toList() ??
                const <LiveEvent>[];
        final continueWatching =
            snapshot.data?.continueWatching ?? const <ContinueWatchingItem>[];

        developer.log(
          'Home sections data (items=${items.length}, live=${live.length}, continueWatching=${continueWatching.length}, refreshToken=${widget.refreshToken})',
          name: 'HomePage',
        );

        if (items.isEmpty && continueWatching.isEmpty && live.isEmpty) {
          return const Center(child: Text('No content available yet'));
        }

        final featured = items.isNotEmpty ? items.first : continueWatching.first.item;
        final movies = items.where((e) => !e.isSeries).toList();
        final series = items.where((e) => e.isSeries).toList();

        return CustomScrollView(
          slivers: [
            SliverPersistentHeader(
              pinned: true,
              delegate: _StickyTopBarDelegate(
                onOpenSearch: widget.onOpenSearch,
                onOpenProfile: widget.onOpenProfile,
              ),
            ),
            SliverToBoxAdapter(
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  SectionImageReveal(
                    key: ValueKey('home-hero-${featured.id}'),
                    imageUrls: [featured.bannerUrl],
                    skeleton: const Padding(
                      padding: EdgeInsets.symmetric(
                          horizontal: AppTokens.spacingLg),
                      child: SizedBox(
                        height: 380,
                        child: PulseSkeleton(
                          borderRadius:
                              BorderRadius.all(Radius.circular(AppTokens.radiusXl)),
                        ),
                      ),
                    ),
                    child: HeroBanner(
                      item: featured,
                      height: 380,
                      label: 'Wanzami Original',
                      onPlay: () => widget.onOpen(featured),
                      onInfo: () => widget.onOpen(featured),
                      onAdd: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('Added to My List.')),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (continueWatching.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-continue-watching'),
                      imageUrls: continueWatching
                          .map((e) => e.item.thumbnailUrl)
                          .toList(),
                      skeleton: const _ContinueWatchingSkeleton(
                          title: 'Continue Watching'),
                      child: ContentCarousel(
                        title: 'Continue Watching',
                        height: 234,
                        itemCount: continueWatching.length,
                        itemBuilder: (_, i) {
                          final entry = continueWatching[i];
                          return ContinueWatchingCard(
                            entry: entry,
                            onTap: () => widget.onOpen(entry.item),
                          );
                        },
                      ),
                    ),
                  if (live.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-live'),
                      imageUrls: live.map((e) => e.thumbnailUrl ?? '').toList(),
                      skeleton: const _LiveStripSkeleton(),
                      child: ContentCarousel(
                        title: 'Live Events Happening Now',
                        height: 210,
                        itemCount: live.length,
                        itemBuilder: (_, i) {
                          final event = live[i];
                          return LiveStreamCard(
                            event: event,
                            onTap: () => _openLiveAsItem(event),
                          );
                        },
                      ),
                    ),
                  if (items.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-trending'),
                      imageUrls:
                          items.take(12).map((e) => e.thumbnailUrl).toList(),
                      skeleton: const _PosterRowSkeleton(
                          title: 'Trending in Nigeria'),
                      child: _PosterCarousel(
                        title: 'Trending in Nigeria',
                        items: items.take(12).toList(),
                        onOpen: widget.onOpen,
                      ),
                    ),
                  if (movies.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-originals'),
                      imageUrls:
                          movies.take(8).map((e) => e.thumbnailUrl).toList(),
                      skeleton:
                          const _PosterRowSkeleton(title: 'Wanzami Originals'),
                      child: _PosterCarousel(
                        title: 'Wanzami Originals',
                        items: movies.take(8).toList(),
                        onOpen: widget.onOpen,
                      ),
                    ),
                  if (series.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-series'),
                      imageUrls:
                          series.take(12).map((e) => e.thumbnailUrl).toList(),
                      skeleton:
                          const _PosterRowSkeleton(title: 'Popular Series'),
                      child: _PosterCarousel(
                        title: 'Popular Series',
                        items: series.take(12).toList(),
                        onOpen: widget.onOpen,
                      ),
                    ),
                  if (items.length > 1)
                    SectionImageReveal(
                      key: const ValueKey('home-new'),
                      imageUrls: items
                          .skip(1)
                          .take(12)
                          .map((e) => e.thumbnailUrl)
                          .toList(),
                      skeleton:
                          const _PosterRowSkeleton(title: 'New on Wanzami'),
                      child: _PosterCarousel(
                        title: 'New on Wanzami',
                        items: items.skip(1).take(12).toList(),
                        onOpen: widget.onOpen,
                      ),
                    ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        );
      },
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
}

/// Poster row built on the locked [ContentCarousel] + [PosterCard] kit.
class _PosterCarousel extends StatelessWidget {
  const _PosterCarousel({
    required this.title,
    required this.items,
    required this.onOpen,
  });

  final String title;
  final List<MediaItem> items;
  final ValueChanged<MediaItem> onOpen;

  @override
  Widget build(BuildContext context) {
    return ContentCarousel(
      title: title,
      height: 224,
      itemCount: items.length,
      itemBuilder: (_, index) {
        final item = items[index];
        return PosterCard(item: item, onTap: () => onOpen(item));
      },
    );
  }
}

class _HomeLoadingScaffold extends StatelessWidget {
  const _HomeLoadingScaffold({this.onOpenSearch, this.onOpenProfile});

  final VoidCallback? onOpenSearch;
  final VoidCallback? onOpenProfile;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyTopBarDelegate(
            onOpenSearch: onOpenSearch,
            onOpenProfile: onOpenProfile,
          ),
        ),
        const SliverToBoxAdapter(
          child: Column(
            children: [
              SizedBox(height: 12),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
                child: SizedBox(
                  height: 380,
                  child: PulseSkeleton(
                    borderRadius:
                        BorderRadius.all(Radius.circular(AppTokens.radiusXl)),
                  ),
                ),
              ),
              SizedBox(height: 20),
              _ContinueWatchingSkeleton(title: 'Continue Watching'),
              _LiveStripSkeleton(),
              _PosterRowSkeleton(title: 'Trending in Nigeria'),
              _PosterRowSkeleton(title: 'Wanzami Originals'),
              _PosterRowSkeleton(title: 'Popular Series'),
              SizedBox(height: 100),
            ],
          ),
        ),
      ],
    );
  }
}

class _StickyTopBarDelegate extends SliverPersistentHeaderDelegate {
  _StickyTopBarDelegate({this.onOpenSearch, this.onOpenProfile});

  final VoidCallback? onOpenSearch;
  final VoidCallback? onOpenProfile;

  @override
  double get maxExtent => 116;

  @override
  double get minExtent => 116;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppTokens.background, Color(0x000B0B0F)],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 42, 20, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        borderRadius:
                            BorderRadius.circular(AppTokens.radiusMd),
                        gradient: AppTokens.brandGradient,
                        boxShadow: AppTokens.brandGlow,
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Image.asset('assets/images/wanzami_logo.png',
                          fit: BoxFit.contain),
                    ),
                    const SizedBox(width: 10),
                    const Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'WAN',
                            style: TextStyle(
                              color: AppTokens.brandOrange,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.1,
                            ),
                          ),
                          TextSpan(
                            text: 'ZAMI',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.1,
                            ),
                          ),
                        ],
                      ),
                      style: TextStyle(fontSize: 24, height: 1),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'African Stories  •  Global Stage',
                  style: TextStyle(
                    color: AppTokens.secondaryText,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),
          _HeaderAction(
            icon: Icons.search_rounded,
            onTap: onOpenSearch,
          ),
          const SizedBox(width: 10),
          _HeaderAction(
            icon: Icons.notifications_none_rounded,
            showDot: true,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications coming soon.')),
              );
            },
          ),
          const SizedBox(width: 10),
          Pressable(
            onTap: onOpenProfile,
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppTokens.brandGradient,
                boxShadow: AppTokens.brandGlow,
              ),
              padding: const EdgeInsets.all(2),
              child: Container(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTokens.elevated,
                ),
                child: const Icon(Icons.person, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _StickyTopBarDelegate oldDelegate) => false;
}

class _HeaderAction extends StatelessWidget {
  const _HeaderAction({
    required this.icon,
    this.onTap,
    this.showDot = false,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final bool showDot;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          FrostedIconButton(icon: icon, onTap: onTap, size: 40),
          if (showDot)
            Positioned(
              top: 9,
              right: 9,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppTokens.brandOrange,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTokens.background, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ContinueWatchingSkeleton extends StatelessWidget {
  const _ContinueWatchingSkeleton({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title),
          const SizedBox(height: 12),
          SizedBox(
            height: 234,
            child: ListView.separated(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => Container(
                width: 300,
                decoration: BoxDecoration(
                  color: AppTokens.surface,
                  borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                ),
                clipBehavior: Clip.antiAlias,
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: PulseSkeleton(),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(12, 10, 80, 0),
                      child: SizedBox(
                        height: 14,
                        child: PulseSkeleton(
                          borderRadius: BorderRadius.all(Radius.circular(4)),
                        ),
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(12, 8, 120, 12),
                      child: SizedBox(
                        height: 12,
                        child: PulseSkeleton(
                          borderRadius: BorderRadius.all(Radius.circular(4)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemCount: 4,
            ),
          ),
        ],
      ),
    );
  }
}

class _PosterRowSkeleton extends StatelessWidget {
  const _PosterRowSkeleton({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title),
          const SizedBox(height: 12),
          SizedBox(
            height: 224,
            child: ListView.separated(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => const SizedBox(
                width: 132,
                child: AspectRatio(
                  aspectRatio: 2 / 3,
                  child: PulseSkeleton(
                      borderRadius:
                          BorderRadius.all(Radius.circular(AppTokens.radiusMd))),
                ),
              ),
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemCount: 6,
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveStripSkeleton extends StatelessWidget {
  const _LiveStripSkeleton();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionHeader(title: 'Live Events Happening Now'),
          const SizedBox(height: 12),
          SizedBox(
            height: 210,
            child: ListView.separated(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => const SizedBox(
                width: 280,
                child: PulseSkeleton(
                  borderRadius:
                      BorderRadius.all(Radius.circular(AppTokens.radiusLg)),
                ),
              ),
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemCount: 2,
            ),
          ),
        ],
      ),
    );
  }
}
