import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import '../theme/network_image_with_skeleton.dart';
import '../../features/content/data/content_models.dart';
import 'brand_chrome.dart';

/// Cinematic featured banner: full-bleed backdrop, double scrim (vertical +
/// side), Original pill, rating/meta line, title, and a Play + More Info +
/// Add action cluster. Height defaults suit the home top slot.
class HeroBanner extends StatelessWidget {
  const HeroBanner({
    super.key,
    required this.item,
    required this.onPlay,
    this.onInfo,
    this.onAdd,
    this.height = 360,
    this.label = 'Wanzami Original',
  });

  final MediaItem item;
  final VoidCallback onPlay;
  final VoidCallback? onInfo;
  final VoidCallback? onAdd;
  final double height;
  final String label;

  @override
  Widget build(BuildContext context) {
    final meta = <String>[
      if (item.releaseYear != null) '${item.releaseYear}',
      if ((item.durationLabel ?? '').isNotEmpty) item.durationLabel!,
      ...item.genres.take(2),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
      child: SizedBox(
        height: height,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppTokens.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (item.bannerUrl.isNotEmpty)
                NetworkImageWithSkeleton(url: item.bannerUrl, fit: BoxFit.cover)
              else
                const ColoredBox(color: AppTokens.surface),
              const ScrimOverlay(gradient: AppTokens.heroScrim),
              const ScrimOverlay(gradient: AppTokens.heroSideScrim),
              Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BrandPill(label: label),
                    const SizedBox(height: 12),
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: AppTokens.primaryText,
                        height: 1.1,
                      ),
                    ),
                    if (meta.isNotEmpty || (item.rating ?? '').isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if ((item.rating ?? '').isNotEmpty) ...[
                            const Icon(Icons.star_rounded,
                                size: 15, color: AppTokens.brandGold),
                            const SizedBox(width: 3),
                            Text(
                              item.rating!,
                              style: const TextStyle(
                                color: AppTokens.brandGold,
                                fontWeight: FontWeight.w700,
                                fontSize: 13,
                              ),
                            ),
                            if (meta.isNotEmpty)
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Text('•',
                                    style: TextStyle(
                                        color: AppTokens.secondaryText)),
                              ),
                          ],
                          Expanded(
                            child: Text(
                              meta.join('  •  '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppTokens.secondaryText,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: onPlay,
                            style: FilledButton.styleFrom(
                              backgroundColor: AppTokens.brandOrange,
                              foregroundColor: AppTokens.onBrandOrange,
                              minimumSize: const Size(0, 48),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                    AppTokens.radiusPill),
                              ),
                            ),
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: const Text('Play',
                                style: TextStyle(fontWeight: FontWeight.w700)),
                          ),
                        ),
                        if (onInfo != null) ...[
                          const SizedBox(width: 10),
                          _GlassAction(
                            icon: Icons.info_outline_rounded,
                            label: 'More Info',
                            onTap: onInfo!,
                          ),
                        ],
                        if (onAdd != null) ...[
                          const SizedBox(width: 10),
                          FrostedIconButton(
                              icon: Icons.add_rounded, onTap: onAdd, size: 48),
                        ],
                      ],
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

class _GlassAction extends StatelessWidget {
  const _GlassAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: FrostedTag(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: Colors.white),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
