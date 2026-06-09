import 'package:flutter/material.dart';

import '../theme/app_tokens.dart';
import 'section_header.dart';

/// Section header + horizontal scroller. Standardizes the spacing/rhythm of
/// every "row" on Home and Browse so screens don't re-implement it.
class ContentCarousel extends StatelessWidget {
  const ContentCarousel({
    super.key,
    required this.title,
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.onSeeAll,
    this.separator = 14,
    this.bottomPadding = 24,
  });

  final String title;
  final double height;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final VoidCallback? onSeeAll;
  final double separator;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    if (itemCount == 0) return const SizedBox.shrink();
    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title, onSeeAll: onSeeAll),
          const SizedBox(height: 12),
          SizedBox(
            height: height,
            child: ListView.separated(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppTokens.spacingLg),
              scrollDirection: Axis.horizontal,
              itemCount: itemCount,
              clipBehavior: Clip.none,
              itemBuilder: itemBuilder,
              separatorBuilder: (_, __) => SizedBox(width: separator),
            ),
          ),
        ],
      ),
    );
  }
}
