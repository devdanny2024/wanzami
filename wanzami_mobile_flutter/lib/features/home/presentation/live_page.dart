import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/theme/section_image_reveal.dart';
import '../../../core/widgets/wanzami_kit.dart';
import '../../content/data/content_models.dart';
import '../../content/data/content_repository.dart';

class LivePage extends StatefulWidget {
  const LivePage(
      {super.key,
      required this.repository,
      required this.onOpen,
      required this.profileId});

  final ContentRepository repository;
  final ValueChanged<LiveEvent> onOpen;
  final String profileId;

  @override
  State<LivePage> createState() => _LivePageState();
}

class _LivePageState extends State<LivePage> {
  late Future<List<LiveEvent>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.fetchLiveEvents(profileId: widget.profileId);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<LiveEvent>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const _LiveLoadingPage();
        }

        final events = snapshot.data ?? const <LiveEvent>[];
        final liveNow = events.where((e) => e.isLive).toList();
        final upcoming = events.where((e) => !e.isLive).toList();
        final watchParties = events
            .where((e) => e.title.toLowerCase().contains('watch'))
            .take(4)
            .toList();
        final totalWatching = liveNow.fold<int>(
            0, (sum, e) => sum + (e.viewers ?? 0));

        return Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(24, 56, 24, 110),
              children: [
                const _LiveHeader(),
                const SizedBox(height: 22),
                if (liveNow.isNotEmpty)
                  SectionImageReveal(
                    key: const ValueKey('live-featured'),
                    imageUrls: [(liveNow.first.thumbnailUrl ?? '')],
                    skeleton: const _FeaturedLiveSkeleton(),
                    child: _FeaturedLiveCard(
                        event: liveNow.first,
                        watching: totalWatching,
                        onTap: () => widget.onOpen(liveNow.first)),
                  ),
                if (liveNow.length > 1) ...[
                  const SizedBox(height: 26),
                  SectionImageReveal(
                    key: const ValueKey('live-more'),
                    imageUrls: liveNow
                        .skip(1)
                        .map((e) => e.thumbnailUrl ?? '')
                        .toList(),
                    skeleton:
                        const _LiveTileListSkeleton(title: 'More Live Events'),
                    child: _LiveSection(
                      title: 'More Live Events',
                      children: liveNow
                          .skip(1)
                          .map((e) => _LiveTile(
                              event: e, onTap: () => widget.onOpen(e)))
                          .toList(),
                    ),
                  ),
                ],
                if (upcoming.isNotEmpty) ...[
                  const SizedBox(height: 26),
                  SectionImageReveal(
                    key: const ValueKey('live-upcoming'),
                    imageUrls:
                        upcoming.map((e) => e.thumbnailUrl ?? '').toList(),
                    skeleton: const _LiveTileListSkeleton(
                        title: 'Upcoming Premieres'),
                    child: _LiveSection(
                      title: 'Upcoming Premieres',
                      children: upcoming
                          .map((e) => _LiveTile(
                              event: e, onTap: () => widget.onOpen(e)))
                          .toList(),
                    ),
                  ),
                ],
                if (watchParties.isNotEmpty) ...[
                  const SizedBox(height: 28),
                  SectionImageReveal(
                    key: const ValueKey('live-watch-parties'),
                    imageUrls:
                        watchParties.map((e) => e.thumbnailUrl ?? '').toList(),
                    skeleton: const _WatchPartySkeleton(),
                    child: _LiveSection(
                      title: 'Popular Watch Parties',
                      children: [
                        GridView.builder(
                          itemCount: watchParties.length,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 1.16,
                          ),
                          itemBuilder: (_, i) {
                            final event = watchParties[i];
                            return _WatchPartyTile(
                                event: event,
                                onTap: () => widget.onOpen(event));
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            Positioned(
              right: 20,
              bottom: 110,
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  borderRadius: BorderRadius.all(Radius.circular(28)),
                  boxShadow: AppTokens.brandGlow,
                ),
                child: FloatingActionButton.extended(
                  onPressed: () => _showGoLiveSheet(context),
                  backgroundColor: AppTokens.brandOrange,
                  foregroundColor: AppTokens.onBrandOrange,
                  icon: const Icon(Icons.videocam),
                  label: const Text('Go Live',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showGoLiveSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Row(
              children: [
                Icon(Icons.videocam, color: AppTokens.brandOrange, size: 28),
                SizedBox(width: 12),
                Text('Go Live on Wanzami',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              'Want to stream a live event, premiere, or show on Wanzami? Reach out to the Wanzami team to get set up as a live broadcaster.',
              style: TextStyle(color: AppTokens.secondaryText, height: 1.5),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => Navigator.pop(context),
              style: FilledButton.styleFrom(
                backgroundColor: AppTokens.brandOrange,
                foregroundColor: AppTokens.onBrandOrange,
                minimumSize: const Size(double.infinity, 48),
              ),
              icon: const Icon(Icons.mail_outline),
              label: const Text('Contact Us to Go Live'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Animated "Live" heading with pulsing brand dot and subtitle.
class _LiveHeader extends StatelessWidget {
  const _LiveHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const _PulseDot(),
            const SizedBox(width: 12),
            const Text('Live',
                style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5)),
          ],
        ),
        const SizedBox(height: 6),
        const Text('Watch premieres, events and exclusive content live',
            style: TextStyle(color: AppTokens.secondaryText)),
      ],
    );
  }
}

class _PulseDot extends StatefulWidget {
  const _PulseDot();

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: Tween<double>(begin: 0.85, end: 1.2).animate(
          CurvedAnimation(parent: _controller, curve: Curves.easeInOut)),
      child: Container(
        width: 12,
        height: 12,
        decoration: const BoxDecoration(
          color: AppTokens.brandOrange,
          shape: BoxShape.circle,
          boxShadow: AppTokens.brandGlow,
        ),
      ),
    );
  }
}

/// Reusable section wrapper: branded SectionHeader (no horizontal padding,
/// since the page already pads) over a column of children.
class _LiveSection extends StatelessWidget {
  const _LiveSection({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title, padding: EdgeInsets.zero),
        const SizedBox(height: 14),
        ...children,
      ],
    );
  }
}

class _FeaturedLiveCard extends StatelessWidget {
  const _FeaturedLiveCard(
      {required this.event, required this.onTap, required this.watching});

  final LiveEvent event;
  final VoidCallback onTap;
  final int watching;

  String _formatViewers(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return '$count';
  }

  @override
  Widget build(BuildContext context) {
    final viewers = event.viewers ?? watching;
    return Pressable(
      onTap: onTap,
      scale: 0.985,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTokens.radiusXl),
          boxShadow: AppTokens.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: SizedBox(
          height: 270,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (event.thumbnailUrl != null && event.thumbnailUrl!.isNotEmpty)
                NetworkImageWithSkeleton(
                    url: event.thumbnailUrl!, fit: BoxFit.cover)
              else
                const ColoredBox(color: AppTokens.surface),
              const ScrimOverlay(gradient: AppTokens.heroScrim),
              const Positioned(top: 16, left: 16, child: LiveBadge()),
              if (viewers > 0)
                Positioned(
                  top: 16,
                  right: 16,
                  child: FrostedTag(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.visibility_outlined,
                            size: 13, color: Colors.white),
                        const SizedBox(width: 5),
                        Text('${_formatViewers(viewers)} watching',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const BrandPill(label: 'Featured'),
                    const SizedBox(height: 12),
                    Text(event.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 25,
                            fontWeight: FontWeight.w800,
                            height: 1.1)),
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      onPressed: onTap,
                      style: FilledButton.styleFrom(
                          backgroundColor: AppTokens.brandOrange,
                          foregroundColor: AppTokens.onBrandOrange,
                          minimumSize: const Size(150, 46),
                          shape: const StadiumBorder()),
                      icon: const Icon(Icons.play_arrow_rounded, size: 22),
                      label: const Text('Watch Now',
                          style: TextStyle(fontWeight: FontWeight.w700)),
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
}

class _LiveTile extends StatelessWidget {
  const _LiveTile({required this.event, required this.onTap});

  final LiveEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final thumb = event.thumbnailUrl ?? '';
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Pressable(
        onTap: onTap,
        scale: 0.98,
        child: Container(
          decoration: BoxDecoration(
            color: AppTokens.surface,
            borderRadius: BorderRadius.circular(AppTokens.radiusLg),
            boxShadow: AppTokens.cardShadow,
          ),
          clipBehavior: Clip.antiAlias,
          child: Row(
            children: [
              SizedBox(
                width: 120,
                height: 76,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (thumb.isNotEmpty)
                      NetworkImageWithSkeleton(url: thumb, fit: BoxFit.cover)
                    else
                      const ColoredBox(color: AppTokens.elevated),
                    const ScrimOverlay(),
                    if (event.isLive)
                      const Positioned(
                        top: 6,
                        left: 6,
                        child: LiveBadge(),
                      ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(event.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 6),
                      if (event.isLive)
                        Row(
                          children: [
                            const Icon(Icons.visibility_outlined,
                                size: 14, color: AppTokens.brandOrangeLight),
                            const SizedBox(width: 5),
                            Text(
                                event.viewers != null
                                    ? '${event.viewers} watching'
                                    : 'Live now',
                                style: const TextStyle(
                                    color: AppTokens.brandOrangeLight,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600)),
                          ],
                        )
                      else
                        FrostedTag(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.schedule,
                                  size: 12, color: Colors.white),
                              const SizedBox(width: 5),
                              Text(event.status,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(right: 12),
                child: Icon(Icons.chevron_right,
                    color: AppTokens.mutedText, size: 22),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WatchPartyTile extends StatelessWidget {
  const _WatchPartyTile({required this.event, required this.onTap});

  final LiveEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final thumb = event.thumbnailUrl ?? '';
    return Pressable(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          boxShadow: AppTokens.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (thumb.isNotEmpty)
              NetworkImageWithSkeleton(url: thumb, fit: BoxFit.cover)
            else
              const ColoredBox(color: AppTokens.surface),
            const ScrimOverlay(),
            if (event.isLive)
              const Positioned(top: 8, left: 8, child: LiveBadge()),
            Positioned(
              left: 10,
              right: 10,
              bottom: 10,
              child: Text(event.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      height: 1.15)),
            ),
          ],
        ),
      ),
    );
  }
}

class _LiveLoadingPage extends StatelessWidget {
  const _LiveLoadingPage();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 56, 24, 110),
      children: const [
        _LiveHeader(),
        SizedBox(height: 22),
        _FeaturedLiveSkeleton(),
        SizedBox(height: 26),
        _LiveTileListSkeleton(title: 'Upcoming Premieres'),
      ],
    );
  }
}

class _FeaturedLiveSkeleton extends StatelessWidget {
  const _FeaturedLiveSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
        height: 270,
        child:
            PulseSkeleton(borderRadius: BorderRadius.all(Radius.circular(24))));
  }
}

class _LiveTileListSkeleton extends StatelessWidget {
  const _LiveTileListSkeleton({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title, padding: EdgeInsets.zero),
        const SizedBox(height: 14),
        const SizedBox(
            height: 76,
            child: PulseSkeleton(
                borderRadius: BorderRadius.all(Radius.circular(16)))),
        const SizedBox(height: 12),
        const SizedBox(
            height: 76,
            child: PulseSkeleton(
                borderRadius: BorderRadius.all(Radius.circular(16)))),
      ],
    );
  }
}

class _WatchPartySkeleton extends StatelessWidget {
  const _WatchPartySkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
            title: 'Popular Watch Parties', padding: EdgeInsets.zero),
        const SizedBox(height: 14),
        GridView.builder(
          itemCount: 4,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.16,
          ),
          itemBuilder: (_, __) => const PulseSkeleton(
              borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
      ],
    );
  }
}
