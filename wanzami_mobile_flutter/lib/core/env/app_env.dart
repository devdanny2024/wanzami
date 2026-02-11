enum AppFlavor { dev, stage, prod }

class AppEnv {
  static const String _prodLockedBaseUrl =
      'https://wanzami-backend-alb-1018329891.us-east-2.elb.amazonaws.com/api';

  final AppFlavor flavor;
  final String apiBaseUrl;

  const AppEnv({required this.flavor, required this.apiBaseUrl});

  static AppEnv fromDefines() {
    const flavorRaw = String.fromEnvironment('APP_ENV', defaultValue: 'dev');
    const overrideBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');

    final flavor = switch (flavorRaw.toLowerCase()) {
      'prod' => AppFlavor.prod,
      'stage' => AppFlavor.stage,
      _ => AppFlavor.dev,
    };

    final baseUrl = overrideBaseUrl.isNotEmpty
        ? overrideBaseUrl
        : switch (flavor) {
            AppFlavor.prod => _prodLockedBaseUrl,
            AppFlavor.stage => 'https://staging.wanzami.example/api',
            AppFlavor.dev => 'https://dev.wanzami.example/api',
          };

    return AppEnv(flavor: flavor, apiBaseUrl: baseUrl);
  }
}
