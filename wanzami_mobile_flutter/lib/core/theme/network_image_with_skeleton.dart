import 'package:flutter/material.dart';

import 'section_image_reveal.dart';

class NetworkImageWithSkeleton extends StatelessWidget {
  const NetworkImageWithSkeleton({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  final String url;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final image = Image.network(
      url,
      fit: fit,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const PulseSkeleton();
      },
      errorBuilder: (_, __, ___) => const PulseSkeleton(),
    );

    if (borderRadius == null) return image;
    return ClipRRect(borderRadius: borderRadius!, child: image);
  }
}
