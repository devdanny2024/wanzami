import 'package:flutter/material.dart';

class AppTokens {
  AppTokens._();

  // Source of truth: WANZAMI Mobile Streaming App design bundle.
  static const background = Color(0xFF0B0B0F);
  static const surface = Color(0xFF14141B);
  static const elevated = Color(0xFF1C1C25);

  static const primaryText = Color(0xFFFFFFFF);
  static const secondaryText = Color(0xFFA1A1AA);
  static const mutedText = Color(0xFF6B7280);

  static const brandOrange = Color(0xFFFF6A00);
  static const brandOrangeDark = Color(0xFFE25A00);
  static const brandOrangeLight = Color(0xFFFF9F4D);
  static const onBrandOrange = Color(0xFF0B0B0F);
  static const brandOrangeTint = Color(0x38FF6A00);
  static const brandGold = Color(0xFFFFB020);
  // Legacy alias kept for compatibility with older widgets.
  static const brandRed = brandOrange;

  static const border = Color(0xFF1C1C25);

  static const titleLg = 32.0;
  static const titleMd = 24.0;
  static const bodyMd = 16.0;
  static const bodySm = 14.0;
  static const caption = 12.0;

  static const spacingXs = 8.0;
  static const spacingSm = 12.0;
  static const spacingMd = 16.0;
  static const spacingLg = 24.0;
  static const spacingXl = 32.0;

  static const radiusSm = 8.0;
  static const radiusMd = 12.0;
  static const radiusLg = 16.0;
  static const radiusXl = 24.0;
  static const radiusPill = 999.0;

  // --- Cinematic foundation (locked design kit) ---

  // Frosted-glass motif (reference uses white/20 fill + white/30 border + blur).
  static const glassFill = Color(0x33FFFFFF);
  static const glassBorder = Color(0x4DFFFFFF);
  static const scrim = Color(0xB3000000);

  // Vertical scrim used under hero/card content so titles stay legible.
  static const heroScrim = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0x990B0B0F), Color(0xF20B0B0F)],
    stops: [0.35, 0.72, 1.0],
  );

  // Side scrim layered over the hero for left-anchored copy.
  static const heroSideScrim = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [Color(0xCC0B0B0F), Colors.transparent],
  );

  // Lighter scrim for poster/live thumbnails.
  static const cardScrim = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0x66000000), Color(0xCC000000)],
    stops: [0.45, 0.78, 1.0],
  );

  // Brand orange sweep for CTAs, accents, glows.
  static const brandGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brandOrangeLight, brandOrange, brandOrangeDark],
  );

  // Soft elevation for content cards.
  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x66000000),
      blurRadius: 18,
      offset: Offset(0, 8),
    ),
  ];

  // Orange glow for the active/primary surfaces (CTA, live, active nav).
  static const List<BoxShadow> brandGlow = [
    BoxShadow(
      color: Color(0x4DFF6A00),
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
  ];
}
