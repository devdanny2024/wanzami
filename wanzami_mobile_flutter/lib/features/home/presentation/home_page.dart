import 'package:flutter/material.dart';

import '../../../core/theme/app_tokens.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppTokens.spacingLg),
      children: [
        Container(
          height: 220,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTokens.radiusXl),
            gradient: const LinearGradient(
              colors: [Color(0xFF2A1305), Color(0xFF0B0B0C)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            border: Border.all(color: AppTokens.border),
          ),
          padding: const EdgeInsets.all(AppTokens.spacingLg),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('WANZAMI ORIGINAL', style: TextStyle(color: AppTokens.brandOrange, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text('Featured Tonight', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text('Cinematic storytelling for Africa and the world.', style: TextStyle(color: AppTokens.secondaryText)),
            ],
          ),
        ),
        const SizedBox(height: AppTokens.spacingXl),
        const Text('Continue Watching', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
        const SizedBox(height: AppTokens.spacingMd),
        SizedBox(
          height: 160,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemBuilder: (_, index) => Container(
              width: 220,
              decoration: BoxDecoration(
                color: AppTokens.surface,
                borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                border: Border.all(color: AppTokens.border),
              ),
            ),
            separatorBuilder: (_, __) => const SizedBox(width: AppTokens.spacingMd),
            itemCount: 6,
          ),
        ),
      ],
    );
  }
}
