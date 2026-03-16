import 'dart:developer' as developer;

import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/theme/section_image_reveal.dart';
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
                      padding: EdgeInsets.symmetric(horizontal: 24),
                      child: SizedBox(
                        height: 236,
                        child: PulseSkeleton(
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                        ),
                      ),
                    ),
                    child: _HeroBanner(
                        item: featured, onTap: () => widget.onOpen(featured)),
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
                      child: _ContinueWatchingRow(
                        title: 'Continue Watching',
                        items: continueWatching,
                        onOpen: (entry) => widget.onOpen(entry.item),
                      ),
                    ),
                  if (live.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-live'),
                      imageUrls: live.map((e) => e.thumbnailUrl ?? '').toList(),
                      skeleton: const _LiveStripSkeleton(),
                      child: _LiveStrip(
                        events: live,
                        onOpen: (event) => _openLiveAsItem(event),
                      ),
                    ),
                  if (items.isNotEmpty)
                    SectionImageReveal(
                      key: const ValueKey('home-trending'),
                      imageUrls:
                          items.take(12).map((e) => e.thumbnailUrl).toList(),
                      skeleton: const _PosterRowSkeleton(
                          title: 'Trending in Nigeria'),
                      child: _PosterRow(
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
                      child: _PosterRow(
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
                      child: _PosterRow(
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
                      child: _PosterRow(
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
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: SizedBox(
                  height: 236,
                  child: PulseSkeleton(
                    borderRadius: BorderRadius.all(Radius.circular(24)),
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
                    Image.asset('assets/images/wanzami_logo.png',
                        width: 28, height: 28),
                    const SizedBox(width: 8),
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
                  'African Stories • Global Stage',
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
            icon: Icons.search,
            onTap: onOpenSearch,
          ),
          const SizedBox(width: 10),
          _HeaderAction(
            icon: Icons.notifications_none,
            showDot: true,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Notifications coming soon.')),
              );
            },
          ),
          const SizedBox(width: 10),
          InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: onOpenProfile,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTokens.brandOrange, width: 2),
                color: AppTokens.elevated,
              ),
              child: const Icon(Icons.person, size: 20),
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
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: const BoxDecoration(
          color: AppTokens.surface,
          shape: BoxShape.circle,
        ),
        child: Stack(
          children: [
            Center(child: Icon(icon, size: 21)),
            if (showDot)
              Positioned(
                top: 11,
                right: 11,
                child: Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(
                    color: AppTokens.brandOrange,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.item, required this.onTap});

  final MediaItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: GestureDetector(
        onTap: onTap,
        child: SizedBox(
          height: 236,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (item.bannerUrl.isNotEmpty)
                  NetworkImageWithSkeleton(
                      url: item.bannerUrl, fit: BoxFit.cover)
                else
                  Container(color: AppTokens.surface),
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0xD9000000)],
                    ),
                  ),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTokens.brandOrange,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: const Text('Wanzami Original',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTokens.onBrandOrange)),
                      ),
                      const SizedBox(height: 10),
                      Text(item.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 24, fontWeight: FontWeight.w800)),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        onPressed: onTap,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTokens.brandOrange,
                          foregroundColor: AppTokens.onBrandOrange,
                          minimumSize: const Size(132, 44),
                        ),
                        icon: const Icon(Icons.play_arrow),
                        label: const Text('Play'),
                      ),
                    ],
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

class _ContinueWatchingRow extends StatelessWidget {
  const _ContinueWatchingRow({
    required this.title,
    required this.items,
    required this.onOpen,
  });

  final String title;
  final List<ContinueWatchingItem> items;
  final ValueChanged<ContinueWatchingItem> onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 228,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, i) {
                final entry = items[i];
                final item = entry.item;
                return GestureDetector(
                  onTap: () => onOpen(entry),
                  child: Container(
                    width: 320,
                    decoration: BoxDecoration(
                      color: AppTokens.surface,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AspectRatio(
                          aspectRatio: 16 / 9,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              item.bannerUrl.isNotEmpty
                                  ? NetworkImageWithSkeleton(
                                      url: item.bannerUrl,
                                      fit: BoxFit.cover,
                                    )
                                  : item.thumbnailUrl.isNotEmpty
                                      ? NetworkImageWithSkeleton(
                                          url: item.thumbnailUrl,
                                          fit: BoxFit.cover,
                                        )
                                      : Container(color: AppTokens.elevated),
                              const DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [Colors.transparent, Color(0x88000000)],
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 0,
                                right: 0,
                                bottom: 0,
                                child: Container(
                                  height: 4,
                                  color: AppTokens.elevated,
                                  child: FractionallySizedBox(
                                    alignment: Alignment.centerLeft,
                                    widthFactor:
                                        entry.completionPercent.clamp(0, 1).toDouble(),
                                    child: Container(color: AppTokens.brandOrange),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                          child: Text(
                            '${entry.watchedPercent}% watched • ${entry.remainingText}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppTokens.secondaryText,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemCount: items.length,
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 228,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => Container(
                width: 320,
                decoration: BoxDecoration(
                  color: AppTokens.surface,
                  borderRadius: BorderRadius.circular(14),
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

class _PosterRow extends StatelessWidget {
  const _PosterRow(
      {required this.title, required this.items, required this.onOpen});

  final String title;
  final List<MediaItem> items;
  final ValueChanged<MediaItem> onOpen;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 208,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, index) {
                final item = items[index];
                return GestureDetector(
                  onTap: () => onOpen(item),
                  child: SizedBox(
                    width: 132,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: item.thumbnailUrl.isNotEmpty
                                ? NetworkImageWithSkeleton(
                                    url: item.thumbnailUrl, fit: BoxFit.cover)
                                : Container(color: AppTokens.surface),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(item.title,
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemCount: items.length,
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveStrip extends StatelessWidget {
  const _LiveStrip({required this.events, required this.onOpen});

  final List<LiveEvent> events;
  final ValueChanged<LiveEvent> onOpen;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text('Live Events Happening Now',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 160,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, i) {
                final event = events[i];
                return GestureDetector(
                  onTap: () => onOpen(event),
                  child: SizedBox(
                    width: 270,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if ((event.thumbnailUrl ?? '').isNotEmpty)
                            NetworkImageWithSkeleton(
                                url: event.thumbnailUrl!, fit: BoxFit.cover)
                          else
                            Container(color: AppTokens.surface),
                          Positioned(
                            top: 10,
                            left: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                  color: AppTokens.brandOrange,
                                  borderRadius: BorderRadius.circular(999)),
                              child: const Text('LIVE',
                                  style: TextStyle(
                                      color: AppTokens.onBrandOrange,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11)),
                            ),
                          ),
                          Positioned(
                            left: 10,
                            right: 10,
                            bottom: 10,
                            child: Text(event.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemCount: events.length,
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 208,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => const SizedBox(
                width: 132,
                child: PulseSkeleton(
                    borderRadius: BorderRadius.all(Radius.circular(12))),
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
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text('Live Events Happening Now',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 160,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemBuilder: (_, __) => const SizedBox(
                width: 270,
                child: PulseSkeleton(
                  borderRadius: BorderRadius.all(Radius.circular(16)),
                ),
              ),
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemCount: 2,
            ),
          ),
        ],
      ),
    );
  }
}
