import 'package:flutter/material.dart';

import 'app_tokens.dart';

class AppTheme {
  AppTheme._();

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);

    return base.copyWith(
      scaffoldBackgroundColor: AppTokens.background,
      colorScheme: base.colorScheme.copyWith(
        brightness: Brightness.dark,
        primary: AppTokens.brandOrange,
        secondary: AppTokens.brandGold,
        surface: AppTokens.surface,
      ),
      textTheme: base.textTheme.copyWith(
        headlineLarge: const TextStyle(
          color: AppTokens.primaryText,
          fontSize: AppTokens.titleLg,
          fontWeight: FontWeight.w700,
          height: 1.2,
        ),
        headlineMedium: const TextStyle(
          color: AppTokens.primaryText,
          fontSize: AppTokens.titleMd,
          fontWeight: FontWeight.w700,
          height: 1.25,
        ),
        bodyLarge: const TextStyle(
          color: AppTokens.primaryText,
          fontSize: AppTokens.bodyMd,
        ),
        bodyMedium: const TextStyle(
          color: AppTokens.secondaryText,
          fontSize: AppTokens.bodySm,
          height: 1.4,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppTokens.surface,
        hintStyle: const TextStyle(color: AppTokens.secondaryText),
        labelStyle: const TextStyle(color: AppTokens.primaryText),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          borderSide: const BorderSide(color: AppTokens.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          borderSide: const BorderSide(color: AppTokens.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          borderSide: const BorderSide(color: AppTokens.brandOrange),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppTokens.brandOrange,
          foregroundColor: AppTokens.onBrandOrange,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTokens.radiusMd),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
    );
  }
}
