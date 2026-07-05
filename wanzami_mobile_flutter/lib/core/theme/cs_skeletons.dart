import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'callsheet_tokens.dart';

/// Wanzami's own skeleton loaders (QA: progressive placeholders for slow
/// thumbnails). Two behaviors, per the approved concept board:
///  A — [CsDevelopingSkeleton]: drifting pencil hatching + DEVELOPING stamp,
///      the app-wide default for cards and tiles.
///  C — [CsCountdownSkeleton]: film countdown leader (crosshairs, rotating
///      wipe, 3-2-1), reserved for the hero and detail stills.

class CsDevelopingSkeleton extends StatefulWidget {
  const CsDevelopingSkeleton({
    super.key,
    this.animate = true,
    this.label = 'Developing',
  });

  final bool animate;
  final String label;

  @override
  State<CsDevelopingSkeleton> createState() => _CsDevelopingSkeletonState();
}

class _CsDevelopingSkeletonState extends State<CsDevelopingSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    if (widget.animate) _c.repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final showStamp =
            constraints.maxWidth >= 110 && constraints.maxHeight >= 64;
        return AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final dots = widget.animate ? (_c.value * 4).floor() % 4 : 0;
            return CustomPaint(
              size: Size.infinite,
              painter: _HatchPainter(phase: _c.value),
              child: showStamp
                  ? Align(
                      alignment: Alignment.bottomLeft,
                      child: Padding(
                        padding: const EdgeInsets.all(7),
                        child: Transform.rotate(
                          angle: -4 * math.pi / 180,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: CsTokens.paper,
                              border:
                                  Border.all(color: CsTokens.rust, width: 2),
                            ),
                            child: Text(
                              '${widget.label.toUpperCase()}${'.' * dots}',
                              style: CsTokens.mono(
                                size: 8,
                                color: CsTokens.rust,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      ),
                    )
                  : null,
            );
          },
        );
      },
    );
  }
}

class _HatchPainter extends CustomPainter {
  _HatchPainter({required this.phase});

  final double phase;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = CsTokens.panel);
    final line = Paint()
      ..color = const Color(0xFFE3E0DA)
      ..strokeWidth = 2;
    const spacing = 9.0;
    // Diagonal lines drifting with phase for the "developing" motion.
    final offset = phase * spacing * 2;
    final span = size.width + size.height;
    for (var d = -size.height - spacing * 2 + offset; d < span; d += spacing) {
      canvas.drawLine(Offset(d, 0), Offset(d + size.height, size.height), line);
    }
  }

  @override
  bool shouldRepaint(covariant _HatchPainter old) => old.phase != phase;
}

class CsCountdownSkeleton extends StatefulWidget {
  const CsCountdownSkeleton({super.key});

  @override
  State<CsCountdownSkeleton> createState() => _CsCountdownSkeletonState();
}

class _CsCountdownSkeletonState extends State<CsCountdownSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    // One full 3-2-1 cycle every 3.3 seconds (1.1s per number).
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 3300))
      ..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final number = 3 - (_c.value * 3).floor().clamp(0, 2);
        final wipe = (_c.value * 3) % 1;
        return CustomPaint(
          size: Size.infinite,
          painter: _LeaderPainter(wipe: wipe),
          child: Center(
            child: Text(
              '$number',
              style: CsTokens.display(size: 40),
            ),
          ),
        );
      },
    );
  }
}

class _LeaderPainter extends CustomPainter {
  _LeaderPainter({required this.wipe});

  final double wipe;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(Offset.zero & size, Paint()..color = CsTokens.panel);

    final cross = Paint()
      ..color = const Color(0xFFD9D5CD)
      ..strokeWidth = 1.5;
    canvas.drawLine(Offset(0, size.height / 2),
        Offset(size.width, size.height / 2), cross);
    canvas.drawLine(
        Offset(size.width / 2, 0), Offset(size.width / 2, size.height), cross);

    final center = size.center(Offset.zero);
    final radius = math.min(size.width, size.height) * 0.28;

    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = const Color(0xFFB3B0AA)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5,
    );

    // Rotating wipe arc, one revolution per counted number.
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      wipe * 2 * math.pi,
      false,
      Paint()
        ..color = CsTokens.rust
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
  }

  @override
  bool shouldRepaint(covariant _LeaderPainter old) => old.wipe != wipe;
}
