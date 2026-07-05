import 'package:flutter/material.dart';

import '../../../core/theme/callsheet_tokens.dart';
import '../../../core/widgets/callsheet_kit.dart';

/// Splash — the slate. Paper background, a clapper card, and a REC light
/// while the app boots.
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _blink;

  @override
  void initState() {
    super.initState();
    _blink = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _blink.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: CsTokens.paper,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 26),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              CsBox(
                shadow: 6,
                borderWidth: CsTokens.borderWidthHeavy,
                color: CsTokens.panel,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Clapper stripes.
                    SizedBox(
                      height: 18,
                      child: Row(
                        children: [
                          for (var i = 0; i < 9; i++)
                            Expanded(
                              child: Container(
                                color: i.isEven ? CsTokens.ink : CsTokens.paper,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Container(height: 2.5, color: CsTokens.ink),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CsSlug('Wanzami TV presents', size: 10),
                          const SizedBox(height: 6),
                          Text('WANZAMI', style: CsTokens.display(size: 56)),
                          const SizedBox(height: 12),
                          const CsSpecRow('Prod', 'African stories'),
                          const CsSpecRow('Scene', 'Global stage'),
                          const CsSpecRow('Take', '001'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 26),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FadeTransition(
                    opacity: _blink,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: CsTokens.rust,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CsSlug('Rolling…', size: 11),
                ],
              ),
              const SizedBox(height: 14),
              SizedBox(
                height: 5,
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: 1),
                  duration: const Duration(milliseconds: 2100),
                  curve: Curves.easeInOut,
                  builder: (context, value, _) {
                    return Container(
                      decoration: BoxDecoration(border: CsTokens.border(1.5)),
                      child: FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: value,
                        child: Container(color: CsTokens.brand),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
