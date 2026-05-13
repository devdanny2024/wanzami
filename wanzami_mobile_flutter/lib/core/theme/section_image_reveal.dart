import 'dart:async';

import 'package:flutter/material.dart';

/// Keeps a section in skeleton state until its image URLs are decoded,
/// then reveals content with a smooth fade.
class SectionImageReveal extends StatefulWidget {
  const SectionImageReveal({
    super.key,
    required this.imageUrls,
    required this.child,
    required this.skeleton,
    this.fadeDuration = const Duration(milliseconds: 320),
    this.maxWait = const Duration(seconds: 2),
    this.minReadyRatio = 0.35,
  });

  final List<String> imageUrls;
  final Widget child;
  final Widget skeleton;
  final Duration fadeDuration;
  final Duration maxWait;
  final double minReadyRatio;

  @override
  State<SectionImageReveal> createState() => _SectionImageRevealState();
}

class _SectionImageRevealState extends State<SectionImageReveal> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _warmImages();
  }

  @override
  void didUpdateWidget(covariant SectionImageReveal oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_sameUrls(oldWidget.imageUrls, widget.imageUrls)) return;
    setState(() => _ready = false);
    _warmImages();
  }

  bool _sameUrls(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  Future<void> _warmImages() async {
    final urls = widget.imageUrls.where((e) => e.trim().isNotEmpty).toSet().toList();
    if (urls.isEmpty) {
      if (mounted) setState(() => _ready = true);
      return;
    }

    final completer = Completer<void>();
    var loaded = 0;
    final target = (urls.length * widget.minReadyRatio).ceil().clamp(1, urls.length);

    void maybeReady() {
      if (!completer.isCompleted && loaded >= target) completer.complete();
    }

    for (final url in urls) {
      precacheImage(NetworkImage(url), context)
          .then((_) {
            loaded += 1;
            maybeReady();
          })
          .catchError((_) {
            loaded += 1;
            maybeReady();
          });
    }

    await Future.any([
      completer.future,
      Future<void>.delayed(widget.maxWait),
    ]);

    if (mounted) setState(() => _ready = true);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: widget.fadeDuration,
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: _ready ? widget.child : widget.skeleton,
    );
  }
}

class PulseSkeleton extends StatefulWidget {
  const PulseSkeleton({super.key, this.borderRadius});

  final BorderRadius? borderRadius;

  @override
  State<PulseSkeleton> createState() => _PulseSkeletonState();
}

class _PulseSkeletonState extends State<PulseSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final alpha = 0.08 + (_controller.value * 0.10);
        return Container(
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius,
            color: Colors.white.withOpacity(alpha),
          ),
        );
      },
    );
  }
}
