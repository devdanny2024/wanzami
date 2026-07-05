import 'package:flutter/material.dart';

import 'cs_skeletons.dart';

enum CsSkeletonVariant {
  /// Drifting hatch + DEVELOPING stamp — default for cards and tiles.
  develop,

  /// Film countdown leader — reserved for hero and detail stills.
  countdown,
}

class NetworkImageWithSkeleton extends StatelessWidget {
  const NetworkImageWithSkeleton({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.variant = CsSkeletonVariant.develop,
    this.decodeWidth,
  });

  final String url;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final CsSkeletonVariant variant;

  /// Logical-pixel decode hint for small tiles: keeps full-size artwork from
  /// being decoded at poster resolution just to fill a 120dp card.
  final double? decodeWidth;

  Widget get _loader => variant == CsSkeletonVariant.countdown
      ? const CsCountdownSkeleton()
      : const CsDevelopingSkeleton();

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return const CsDevelopingSkeleton(animate: false, label: 'No print');
    }

    final dpr = MediaQuery.of(context).devicePixelRatio;
    final image = Image.network(
      url,
      fit: fit,
      cacheWidth: decodeWidth == null ? null : (decodeWidth! * dpr).round(),
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return _loader;
      },
      errorBuilder: (_, __, ___) =>
          const CsDevelopingSkeleton(animate: false, label: 'No print'),
    );

    if (borderRadius == null) return image;
    return ClipRRect(borderRadius: borderRadius!, child: image);
  }
}
