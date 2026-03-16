import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/network_image_with_skeleton.dart';
import '../../../core/theme/section_image_reveal.dart';
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

        return ListView(
          padding: const EdgeInsets.fromLTRB(24, 56, 24, 110),
          children: [
            Row(
              children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0.9, end: 1.15),
                  duration: const Duration(milliseconds: 1200),
                  curve: Curves.easeInOut,
                  builder: (_, value, __) => Transform.scale(
                    scale: value,
                    child: const Icon(Icons.circle,
                        color: AppTokens.brandOrange, size: 10),
                  ),
                  onEnd: () => setState(() {}),
                ),
                const SizedBox(width: 10),
                const Text('Live',
                    style:
                        TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 6),
            const Text('Watch premieres, events and exclusive content live',
                style: TextStyle(color: AppTokens.secondaryText)),
            const SizedBox(height: 22),
            if (liveNow.isNotEmpty)
              SectionImageReveal(
                key: const ValueKey('live-featured'),
                imageUrls: [(liveNow.first.thumbnailUrl ?? '')],
                skeleton: const _FeaturedLiveSkeleton(),
                child: _FeaturedLiveCard(
                    event: liveNow.first,
                    onTap: () => widget.onOpen(liveNow.first)),
              ),
            if (liveNow.length > 1) ...[
              const SizedBox(height: 22),
              SectionImageReveal(
                key: const ValueKey('live-more'),
                imageUrls:
                    liveNow.skip(1).map((e) => e.thumbnailUrl ?? '').toList(),
                skeleton:
                    const _LiveTileListSkeleton(title: 'More Live Events'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('More Live Events',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    ...liveNow.skip(1).map((e) =>
                        _LiveTile(event: e, onTap: () => widget.onOpen(e))),
                  ],
                ),
              ),
            ],
            if (upcoming.isNotEmpty) ...[
              const SizedBox(height: 22),
              SectionImageReveal(
                key: const ValueKey('live-upcoming'),
                imageUrls: upcoming.map((e) => e.thumbnailUrl ?? '').toList(),
                skeleton:
                    const _LiveTileListSkeleton(title: 'Upcoming Premieres'),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Upcoming Premieres',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    ...upcoming.map((e) =>
                        _LiveTile(event: e, onTap: () => widget.onOpen(e))),
                  ],
                ),
              ),
            ],
            if (watchParties.isNotEmpty) ...[
              const SizedBox(height: 24),
              SectionImageReveal(
                key: const ValueKey('live-watch-parties'),
                imageUrls:
                    watchParties.map((e) => e.thumbnailUrl ?? '').toList(),
                skeleton: const _WatchPartySkeleton(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Popular Watch Parties',
                        style: TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    GridView.builder(
                      itemCount: watchParties.length,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 1.16,
                      ),
                      itemBuilder: (_, i) {
                        final event = watchParties[i];
                        return GestureDetector(
                          onTap: () => widget.onOpen(event),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                if ((event.thumbnailUrl ?? '').isNotEmpty)
                                  NetworkImageWithSkeleton(
                                      url: event.thumbnailUrl!,
                                      fit: BoxFit.cover)
                                else
                                  Container(color: AppTokens.surface),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                      colors: [
                                        Colors.black.withValues(alpha: 0.7),
                                        Colors.transparent
                                      ],
                                    ),
                                  ),
                                ),
                                Positioned(
                                  left: 8,
                                  right: 8,
                                  bottom: 8,
                                  child: Text(event.title,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700)),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ],
        );
      },
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
        Row(
          children: [
            Icon(Icons.circle, color: AppTokens.brandOrange, size: 10),
            SizedBox(width: 10),
            Text('Live',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800)),
          ],
        ),
        SizedBox(height: 6),
        SizedBox(
            height: 12,
            child: PulseSkeleton(
                borderRadius: BorderRadius.all(Radius.circular(6)))),
        SizedBox(height: 22),
        _FeaturedLiveSkeleton(),
        SizedBox(height: 20),
        _LiveTileListSkeleton(title: 'Upcoming Premieres'),
      ],
    );
  }
}

class _FeaturedLiveCard extends StatelessWidget {
  const _FeaturedLiveCard({required this.event, required this.onTap});

  final LiveEvent event;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        height: 250,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (event.thumbnailUrl != null && event.thumbnailUrl!.isNotEmpty)
                NetworkImageWithSkeleton(
                    url: event.thumbnailUrl!, fit: BoxFit.cover)
              else
                Container(color: AppTokens.surface),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0xCC000000)],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(
                              color: AppTokens.brandOrange,
                              borderRadius: BorderRadius.circular(999)),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.circle,
                                  size: 8, color: AppTokens.onBrandOrange),
                              SizedBox(width: 6),
                              Text('LIVE',
                                  style: TextStyle(
                                      color: AppTokens.onBrandOrange,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12)),
                            ],
                          ),
                        ),
                        const Spacer(),
                        if (event.viewers != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 7),
                            decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(999)),
                            child: Text('${event.viewers} watching',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 12)),
                          ),
                      ],
                    ),
                    const Spacer(),
                    Text(event.title,
                        style: const TextStyle(
                            fontSize: 25, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    FilledButton(
                      onPressed: onTap,
                      style: FilledButton.styleFrom(
                          backgroundColor: AppTokens.brandOrange,
                          foregroundColor: AppTokens.onBrandOrange,
                          minimumSize: const Size(130, 44)),
                      child: const Text('Watch Now'),
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: AppTokens.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            width: 92,
            child: event.thumbnailUrl != null && event.thumbnailUrl!.isNotEmpty
                ? NetworkImageWithSkeleton(
                    url: event.thumbnailUrl!, fit: BoxFit.cover)
                : Container(color: AppTokens.elevated),
          ),
        ),
        title: Text(event.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(event.isLive ? 'Live now' : event.status,
            style: const TextStyle(color: AppTokens.secondaryText)),
        trailing: event.viewers != null ? Text('${event.viewers}') : null,
      ),
    );
  }
}

class _FeaturedLiveSkeleton extends StatelessWidget {
  const _FeaturedLiveSkeleton();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
        height: 250,
        child:
            PulseSkeleton(borderRadius: BorderRadius.all(Radius.circular(20))));
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
        Text(title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        const SizedBox(
            height: 88,
            child: PulseSkeleton(
                borderRadius: BorderRadius.all(Radius.circular(12)))),
        const SizedBox(height: 10),
        const SizedBox(
            height: 88,
            child: PulseSkeleton(
                borderRadius: BorderRadius.all(Radius.circular(12)))),
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
        const Text('Popular Watch Parties',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        GridView.builder(
          itemCount: 4,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.16,
          ),
          itemBuilder: (_, __) => const PulseSkeleton(
              borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
      ],
    );
  }
}
