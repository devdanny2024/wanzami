import AuthenticationServices
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var authSession: ASWebAuthenticationSession?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    setupOAuthChannel()
    return result
  }

  private func setupOAuthChannel() {
    guard let vc = window?.rootViewController as? FlutterViewController else { return }
    let channel = FlutterMethodChannel(name: "wanzami/oauth", binaryMessenger: vc.binaryMessenger)
    channel.setMethodCallHandler { [weak self] call, result in
      guard call.method == "authenticate",
        let args = call.arguments as? [String: Any],
        let urlString = args["url"] as? String,
        let scheme = args["callbackUrlScheme"] as? String,
        let url = URL(string: urlString)
      else {
        result(FlutterError(code: "INVALID_ARGS", message: "url and callbackUrlScheme required", details: nil))
        return
      }
      self?.startOAuth(url: url, scheme: scheme, result: result)
    }
  }

  private func startOAuth(url: URL, scheme: String, result: @escaping FlutterResult) {
    let session = ASWebAuthenticationSession(url: url, callbackURLScheme: scheme) { callbackURL, error in
      if let error = error as? ASWebAuthenticationSessionError {
        if error.code == .canceledLogin {
          result(FlutterError(code: "CANCELED", message: "User cancelled sign-in", details: nil))
        } else {
          result(FlutterError(code: "ERROR", message: error.localizedDescription, details: nil))
        }
        return
      }
      if let error = error {
        result(FlutterError(code: "ERROR", message: error.localizedDescription, details: nil))
        return
      }
      result(callbackURL?.absoluteString)
    }
    session.presentationContextProvider = self
    session.prefersEphemeralWebBrowserSession = false
    authSession = session
    session.start()
  }
}

extension AppDelegate: ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    return window!
  }
}
