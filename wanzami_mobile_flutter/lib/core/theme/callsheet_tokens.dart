import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// "The Call Sheet" design system — lights on (white paper) for browsing,
/// lights off (cinema black) for watching. Team-approved concept board:
/// white #FFFFFF · ink #161310 · brand #FD7E14 · rust #D1490F.
class CsTokens {
  CsTokens._();

  // Lights on — paper.
  static const paper = Color(0xFFFFFFFF);
  static const panel = Color(0xFFF6F6F6);
  static const ink = Color(0xFF161310);
  static const inkSoft = Color(0xFF333333);
  static const mutedInk = Color(0xFF6E6A64);

  // Lights off — cinema.
  static const cinema = Color(0xFF0A0A0A);
  static const cinemaPanel = Color(0xFF1D1712);
  static const mutedOnDark = Color(0xFFB3B0AA);

  // Brand.
  static const brand = Color(0xFFFD7E14);
  static const rust = Color(0xFFD1490F);
  static const onBrand = ink;

  // Borders — thick ink strokes are the system's skeleton.
  static const borderWidth = 2.5;
  static const borderWidthHeavy = 3.0;
  static BorderSide side([double width = borderWidth]) =>
      const BorderSide(color: ink).copyWith(width: width);
  static Border border([double width = borderWidth]) =>
      Border.fromBorderSide(side(width));

  // Hard offset shadows. No blur — this is print, not glass.
  static List<BoxShadow> hardShadow([double offset = 4]) => [
        BoxShadow(color: ink, offset: Offset(offset, offset)),
      ];

  // --- Type ---
  // Display: Bebas Neue (condensed, uppercase-native, matches web brand).
  static TextStyle display({
    double size = 32,
    Color color = ink,
    double height = 0.95,
  }) =>
      GoogleFonts.bebasNeue(
        fontSize: size,
        color: color,
        height: height,
        letterSpacing: 0.5,
      );

  // Mono: Space Mono — production annotations, sluglines, timecodes.
  static TextStyle mono({
    double size = 11,
    Color color = mutedInk,
    FontWeight weight = FontWeight.w400,
  }) =>
      GoogleFonts.spaceMono(
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: 0.6,
      );

  // Body: system sans (Roboto/SF), readable at 14–16.
  static const TextStyle body = TextStyle(
    fontSize: 14,
    color: inkSoft,
    height: 1.5,
  );
  static const TextStyle bodyBold = TextStyle(
    fontSize: 14,
    color: ink,
    height: 1.4,
    fontWeight: FontWeight.w700,
  );

  static const spacingXs = 8.0;
  static const spacingSm = 12.0;
  static const spacingMd = 16.0;
  static const spacingLg = 24.0;
  static const spacingXl = 32.0;

  /// Minimum touch target per the concept board (≥48dp).
  static const touchTarget = 48.0;
}
