import 'package:flutter/services.dart';

/// Wraps the native ASWebAuthenticationSession channel registered in AppDelegate.swift.
/// Only used on iOS; throws if the channel isn't available.
class IosWebAuth {
  static const _channel = MethodChannel('wanzami/oauth');

  /// Opens [url] in an ASWebAuthenticationSession and waits for a redirect
  /// whose URL scheme matches [callbackUrlScheme].
  /// Returns the full callback URL string.
  /// Throws [PlatformException] with code "CANCELED" if the user dismisses.
  static Future<String> authenticate({
    required String url,
    required String callbackUrlScheme,
  }) async {
    final result = await _channel.invokeMethod<String>('authenticate', {
      'url': url,
      'callbackUrlScheme': callbackUrlScheme,
    });
    return result ?? '';
  }
}
