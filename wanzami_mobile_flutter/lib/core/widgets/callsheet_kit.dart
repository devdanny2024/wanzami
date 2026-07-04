import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/callsheet_tokens.dart';

/// Shared widgets for the Call Sheet UI. Everything on paper is built from
/// these: ink boxes, stamps, stickers, sprocket film strips, and ticket stubs.

/// Bordered paper container with optional hard offset shadow and tilt.
class CsBox extends StatelessWidget {
  const CsBox({
    super.key,
    required this.child,
    this.color = CsTokens.paper,
    this.shadow = 0,
    this.rotation = 0,
    this.borderWidth = CsTokens.borderWidth,
    this.padding,
  });

  final Widget child;
  final Color color;
  final double shadow;
  final double rotation;
  final double borderWidth;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color,
        border: CsTokens.border(borderWidth),
        boxShadow: shadow > 0 ? CsTokens.hardShadow(shadow) : null,
      ),
      child: child,
    );
    if (rotation == 0) return box;
    return Transform.rotate(angle: rotation * math.pi / 180, child: box);
  }
}

/// Mono production annotation ("SCENE 02 · THE MONEY").
class CsSlug extends StatelessWidget {
  const CsSlug(this.text, {super.key, this.color = CsTokens.mutedInk, this.size = 11});

  final String text;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Text(text.toUpperCase(), style: CsTokens.mono(size: size, color: color));
  }
}

/// Orange sticker slapped on at a slight angle.
class CsSticker extends StatelessWidget {
  const CsSticker(this.text, {super.key, this.rotation = 2});

  final String text;
  final double rotation;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation * math.pi / 180,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: CsTokens.brand,
          boxShadow: CsTokens.hardShadow(2.5),
        ),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: CsTokens.ink,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }
}

/// Rust rubber stamp ("APPROVED", "ADMITTED", "WANZAMI ORIGINAL").
class CsStamp extends StatelessWidget {
  const CsStamp(this.text, {super.key, this.rotation = -5});

  final String text;
  final double rotation;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: rotation * math.pi / 180,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          border: Border.all(color: CsTokens.rust, width: 2.5),
        ),
        child: Text(
          text.toUpperCase(),
          style: const TextStyle(
            color: CsTokens.rust,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }
}

/// Spec line with dot leaders: "RUNTIME .... 1H 52M".
class CsSpecRow extends StatelessWidget {
  const CsSpecRow(this.label, this.value, {super.key});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final style = CsTokens.mono(size: 12, color: CsTokens.ink);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        children: [
          Text(label.toUpperCase(), style: style),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                '.' * 60,
                maxLines: 1,
                overflow: TextOverflow.clip,
                style: CsTokens.mono(size: 12, color: CsTokens.mutedInk),
              ),
            ),
          ),
          Text(value.toUpperCase(), style: style),
        ],
      ),
    );
  }
}

/// Row of sprocket holes for the film strip band.
class CsSprockets extends StatelessWidget {
  const CsSprockets({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final count = math.max(8, (constraints.maxWidth / 26).floor());
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 9),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              count,
              (_) => Container(
                width: 7,
                height: 10,
                decoration: BoxDecoration(
                  color: CsTokens.paper,
                  borderRadius: BorderRadius.circular(1.5),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Dark film-strip band: sprockets top and bottom, horizontal content
/// between, and a mono caption ("REEL A · TRENDING NOW").
class CsFilmStrip extends StatelessWidget {
  const CsFilmStrip({
    super.key,
    required this.caption,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
  });

  final String caption;
  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: CsTokens.ink,
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CsSprockets(),
          SizedBox(
            height: height,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              scrollDirection: Axis.horizontal,
              itemCount: itemCount,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: itemBuilder,
            ),
          ),
          const CsSprockets(),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 5, 10, 0),
            child: CsSlug(caption, color: CsTokens.mutedOnDark, size: 10),
          ),
        ],
      ),
    );
  }
}

/// Perforated cinema-ticket CTA: notched edges, dashed divider, ticket icon.
/// The one button in the app that takes your money, so it looks like what
/// it buys.
class CsTicketButton extends StatelessWidget {
  const CsTicketButton({
    super.key,
    required this.slug,
    required this.title,
    required this.onTap,
    this.icon = Icons.local_activity_outlined,
    this.enabled = true,
  });

  final String slug;
  final String title;
  final VoidCallback onTap;
  final IconData icon;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: '$slug. $title',
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Opacity(
          opacity: enabled ? 1 : 0.45,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                decoration: BoxDecoration(
                  color: CsTokens.panel,
                  border: CsTokens.border(CsTokens.borderWidthHeavy),
                  boxShadow: CsTokens.hardShadow(5),
                ),
                child: IntrinsicHeight(
                  child: Row(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CsSlug(slug),
                              const SizedBox(height: 2),
                              Text(title.toUpperCase(), style: CsTokens.display(size: 24)),
                            ],
                          ),
                        ),
                      ),
                      CustomPaint(
                        size: const Size(2, double.infinity),
                        painter: _DashedLinePainter(),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 15),
                        child: Icon(icon, color: CsTokens.rust, size: 24),
                      ),
                    ],
                  ),
                ),
              ),
              const Positioned(left: -9, top: 0, bottom: 0, child: _TicketNotch()),
              const Positioned(right: -9, top: 0, bottom: 0, child: _TicketNotch()),
            ],
          ),
        ),
      ),
    );
  }
}

class _TicketNotch extends StatelessWidget {
  const _TicketNotch();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 16,
        height: 16,
        decoration: BoxDecoration(
          color: CsTokens.paper,
          shape: BoxShape.circle,
          border: Border.all(color: CsTokens.ink, width: 3),
        ),
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = CsTokens.ink
      ..strokeWidth = 2;
    const dash = 5.0;
    const gap = 4.0;
    var y = 0.0;
    final x = size.width / 2;
    while (y < size.height) {
      canvas.drawLine(Offset(x, y), Offset(x, math.min(y + dash, size.height)), paint);
      y += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Solid ink primary button ("APPLY", "SIGN IN") and bordered secondary.
class CsButton extends StatelessWidget {
  const CsButton(
    this.label, {
    super.key,
    required this.onTap,
    this.primary = true,
    this.expand = false,
  });

  final String label;
  final VoidCallback onTap;
  final bool primary;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final child = Container(
      constraints: const BoxConstraints(minHeight: CsTokens.touchTarget),
      padding: const EdgeInsets.symmetric(horizontal: 18),
      alignment: Alignment.center,
      decoration: primary
          ? const BoxDecoration(color: CsTokens.ink)
          : BoxDecoration(border: CsTokens.border()),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: primary ? CsTokens.paper : CsTokens.ink,
          fontSize: 12.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
        ),
      ),
    );
    final tappable = GestureDetector(onTap: onTap, child: child);
    return expand ? SizedBox(width: double.infinity, child: tappable) : tappable;
  }
}

/// Clapper bottom navigation: white bar, heavy ink top rule, active tab
/// becomes an ink block with the brand-orange icon.
class CsNavBar extends StatelessWidget {
  const CsNavBar({
    super.key,
    required this.items,
    required this.selectedIndex,
    required this.onSelect,
  });

  final List<CsNavItem> items;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: CsTokens.paper,
        border: Border(top: CsTokens.side(CsTokens.borderWidthHeavy)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: _CsNavTab(
                    item: items[i],
                    selected: i == selectedIndex,
                    onTap: () => onSelect(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class CsNavItem {
  const CsNavItem(this.icon, this.selectedIcon, this.label);

  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

class _CsNavTab extends StatelessWidget {
  const _CsNavTab({required this.item, required this.selected, required this.onTap});

  final CsNavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? CsTokens.brand : CsTokens.ink;
    return Semantics(
      selected: selected,
      button: true,
      label: item.label,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOut,
          color: selected ? CsTokens.ink : Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(selected ? item.selectedIcon : item.icon, size: 21, color: fg),
              const SizedBox(height: 3),
              Text(
                item.label.toUpperCase(),
                style: TextStyle(
                  color: fg,
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Paper page header: "WANZAMI · DAILY PROGRAMME" + call-sheet number chip.
class CsPageHeader extends StatelessWidget {
  const CsPageHeader({super.key, required this.title, this.chip, this.trailing});

  final String title;
  final String? chip;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: CsTokens.paper,
        border: Border(bottom: CsTokens.side(CsTokens.borderWidthHeavy)),
      ),
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title.toUpperCase(),
              style: CsTokens.mono(size: 12, color: CsTokens.ink, weight: FontWeight.w700),
            ),
          ),
          if (chip != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(border: CsTokens.border(2)),
              child: CsSlug(chip!, color: CsTokens.ink),
            ),
          if (trailing != null) ...[const SizedBox(width: 8), trailing!],
        ],
      ),
    );
  }
}
