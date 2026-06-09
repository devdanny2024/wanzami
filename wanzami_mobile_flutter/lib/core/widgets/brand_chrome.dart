import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';

/// Small branded chrome atoms shared across the rebranded screens.
///
/// Locked design kit — keep visuals consistent here rather than re-styling
/// per screen. ZERO EMOJIS anywhere (brand rule); the gold rating uses a
/// star icon, never a unicode star.

/// Pulsing "LIVE" pill (orange) with a white dot.
class LiveBadge extends StatefulWidget {
  const LiveBadge({super.key, this.label = 'LIVE'});

  final String label;

  @override
  State<LiveBadge> createState() => _LiveBadgeState();
}

class _LiveBadgeState extends State<LiveBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppTokens.brandOrange,
        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
        boxShadow: AppTokens.brandGlow,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FadeTransition(
            opacity: Tween<double>(begin: 0.35, end: 1).animate(_controller),
            child: Container(
              width: 7,
              height: 7,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Text(
            widget.label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }
}

/// Solid orange tag — used for "Wanzami Original" and similar emphasis.
class BrandPill extends StatelessWidget {
  const BrandPill({super.key, required this.label, this.gradient = true});

  final String label;
  final bool gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: gradient ? null : AppTokens.brandOrange,
        gradient: gradient ? AppTokens.brandGradient : null,
        borderRadius: BorderRadius.circular(AppTokens.radiusPill),
      ),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          color: AppTokens.onBrandOrange,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

/// Gold rating chip with a star icon (no emoji).
class RatingBadge extends StatelessWidget {
  const RatingBadge({super.key, required this.rating});

  final String rating;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTokens.scrim,
        borderRadius: BorderRadius.circular(AppTokens.radiusSm),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, size: 13, color: AppTokens.brandGold),
          const SizedBox(width: 3),
          Text(
            rating,
            style: const TextStyle(
              color: AppTokens.brandGold,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

/// Frosted-glass tag (white translucent fill + border + blur). The recurring
/// motif behind category labels, viewer counts, and secondary actions.
class FrostedTag extends StatelessWidget {
  const FrostedTag({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppTokens.radiusSm),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: AppTokens.glassFill,
            borderRadius: BorderRadius.circular(AppTokens.radiusSm),
            border: Border.all(color: AppTokens.glassBorder),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Circular frosted-glass icon button (e.g. add-to-list on hero).
class FrostedIconButton extends StatelessWidget {
  const FrostedIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.size = 44,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Material(
          color: AppTokens.glassFill,
          shape: const CircleBorder(
            side: BorderSide(color: AppTokens.glassBorder),
          ),
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            child: SizedBox(
              width: size,
              height: size,
              child: Icon(icon, size: size * 0.46, color: Colors.white),
            ),
          ),
        ),
      ),
    );
  }
}

/// Convenience scrim overlay (vertical) for stacking under content.
class ScrimOverlay extends StatelessWidget {
  const ScrimOverlay({super.key, this.gradient = AppTokens.cardScrim});

  final Gradient gradient;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(decoration: BoxDecoration(gradient: gradient));
  }
}
