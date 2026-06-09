enum AppFlavor { dev, stage, prod }

class AppEnv {
  // Use backend API origin directly in production to avoid frontend-proxy outages.
  static const String _prodDefaultBaseUrl = 'https://api.wanzami.tv/api';
  static const String _prodDefaultGoogleWebClientId =
      '306551457195-vssk5g58mjf3r1roo2qob1ftaj541488.apps.googleusercontent.com';

  final AppFlavor flavor;
  final String apiBaseUrl;
  final String imageCdnBaseUrl;
  final String imageOriginBaseUrl;
  final String imageCacheVersion;
  final String googleWebClientId;

  const AppEnv({
    required this.flavor,
    required this.apiBaseUrl,
    required this.imageCdnBaseUrl,
    required this.imageOriginBaseUrl,
    required this.imageCacheVersion,
    required this.googleWebClientId,
  });

  static AppEnv fromDefines() {
    const overrideBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    const imageCdnBaseUrl = String.fromEnvironment('IMAGE_CDN_BASE_URL', defaultValue: '');
    const imageOriginBaseUrl = String.fromEnvironment('IMAGE_ORIGIN_BASE_URL', defaultValue: '');
    const imageCacheVersion = String.fromEnvironment('IMAGE_CACHE_VERSION', defaultValue: '');
    const overrideGoogleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID', defaultValue: '');

    // Prod by default; allow explicit override for staging/hotfix testing.
    final baseUrl = overrideBaseUrl.isNotEmpty ? overrideBaseUrl : _prodDefaultBaseUrl;
    final googleWebClientId = overrideGoogleWebClientId.isNotEmpty
        ? overrideGoogleWebClientId
        : _prodDefaultGoogleWebClientId;
    return AppEnv(
      flavor: AppFlavor.prod,
      apiBaseUrl: baseUrl,
      imageCdnBaseUrl: imageCdnBaseUrl.trim(),
      imageOriginBaseUrl: imageOriginBaseUrl.trim(),
      imageCacheVersion: imageCacheVersion.trim(),
      googleWebClientId: googleWebClientId.trim(),
    );
  }

  String resolveImageUrl(String? rawUrl) {
    final input = (rawUrl ?? '').trim();
    if (input.isEmpty) return '';
    if (input.startsWith('data:')) return input;

    final cdnBase = imageCdnBaseUrl.replaceFirst(RegExp(r'/+$'), '');
    final originBase = imageOriginBaseUrl;

    String resolved = input;

    if (cdnBase.isNotEmpty) {
      if (originBase.isNotEmpty && input.startsWith(originBase)) {
        resolved = '$cdnBase${input.substring(originBase.length)}';
      } else if (input.startsWith('/')) {
        resolved = '$cdnBase$input';
      } else if (!input.contains('://')) {
        resolved = '$cdnBase/$input';
      } else {
        final uri = Uri.tryParse(input);
        final keyPath = uri?.path.startsWith('/') == true
            ? uri!.path.substring(1)
            : uri?.path;
        if (keyPath != null && keyPath.isNotEmpty) {
          resolved = '$cdnBase/$keyPath';
        }
      }
    }

    if (imageCacheVersion.isEmpty) return resolved;

    final uri = Uri.tryParse(resolved);
    if (uri == null || !uri.hasScheme) return resolved;

    final qp = Map<String, String>.from(uri.queryParameters);
    qp.putIfAbsent('v', () => imageCacheVersion);
    return uri.replace(queryParameters: qp).toString();
  }
}
