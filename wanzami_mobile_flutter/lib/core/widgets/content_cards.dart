import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import '../theme/network_image_with_skeleton.dart';
import '../../features/content/data/content_models.dart';
import 'brand_chrome.dart';
import 'pressable.dart';

/// 2:3 poster tile with rating badge, gradient scrim, and title/year caption.
/// Default width 132 matches the home rows.
class PosterCard extends StatelessWidget {
  const PosterCard({
    super.key,
    required this.item,
    required this.onTap,
    this.width = 132,
  });

  final MediaItem item;
  final VoidCallback onTap;
  final double width;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 2 / 3,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                  boxShadow: AppTokens.cardShadow,
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (item.thumbnailUrl.isNotEmpty)
                      NetworkImageWithSkeleton(
                          url: item.thumbnailUrl, fit: BoxFit.cover)
                    else
                      const ColoredBox(color: AppTokens.surface),
                    const ScrimOverlay(),
                    if ((item.rating ?? '').isNotEmpty)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: RatingBadge(rating: item.rating!),
                      ),
                    if (item.isSeries)
                      const Positioned(
                        top: 6,
                        left: 6,
                        child: FrostedTag(
                          padding: EdgeInsets.symmetric(
                              horizontal: 7, vertical: 3),
                          child: Text(
                            'SERIES',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: AppTokens.primaryText,
              ),
            ),
            if (item.releaseYear != null)
              Text(
                '${item.releaseYear}',
                style: const TextStyle(
                  color: AppTokens.secondaryText,
                  fontSize: 11,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// 16:9 continue-watching card with progress bar and "x% • remaining" caption.
class ContinueWatchingCard extends StatelessWidget {
  const ContinueWatchingCard({
    super.key,
    required this.entry,
    required this.onTap,
    this.width = 300,
  });

  final ContinueWatchingItem entry;
  final VoidCallback onTap;
  final double width;

  @override
  Widget build(BuildContext context) {
    final item = entry.item;
    final image =
        item.bannerUrl.isNotEmpty ? item.bannerUrl : item.thumbnailUrl;
    return Pressable(
      onTap: onTap,
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: AppTokens.surface,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.cardShadow,
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
                  if (image.isNotEmpty)
                    NetworkImageWithSkeleton(url: image, fit: BoxFit.cover)
                  else
                    const ColoredBox(color: AppTokens.elevated),
                  const ScrimOverlay(),
                  Center(
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: const BoxDecoration(
                        color: AppTokens.brandOrange,
                        shape: BoxShape.circle,
                        boxShadow: AppTokens.brandGlow,
                      ),
                      child: const Icon(Icons.play_arrow_rounded,
                          color: AppTokens.onBrandOrange, size: 26),
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
                        child: Container(
                          decoration: const BoxDecoration(
                              gradient: AppTokens.brandGradient),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppTokens.primaryText,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${entry.watchedPercent}% watched • ${entry.remainingText}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppTokens.secondaryText,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 16:9 live stream card with pulsing LIVE badge, viewer count, and host line.
class LiveStreamCard extends StatelessWidget {
  const LiveStreamCard({
    super.key,
    required this.event,
    required this.onTap,
    this.width = 280,
  });

  final LiveEvent event;
  final VoidCallback onTap;
  final double width;

  String _formatViewers(int count) {
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}k';
    return '$count';
  }

  @override
  Widget build(BuildContext context) {
    final thumb = event.thumbnailUrl ?? '';
    return Pressable(
      onTap: onTap,
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: AppTokens.surface,
          borderRadius: BorderRadius.circular(AppTokens.radiusLg),
          boxShadow: AppTokens.cardShadow,
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
                  if (thumb.isNotEmpty)
                    NetworkImageWithSkeleton(url: thumb, fit: BoxFit.cover)
                  else
                    const ColoredBox(color: AppTokens.elevated),
                  const ScrimOverlay(),
                  if (event.isLive)
                    const Positioned(top: 10, left: 10, child: LiveBadge()),
                  if (event.isLive && event.viewers != null)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: FrostedTag(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.visibility_outlined,
                                size: 12, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              _formatViewers(event.viewers!),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Text(
                event.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppTokens.primaryText,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
