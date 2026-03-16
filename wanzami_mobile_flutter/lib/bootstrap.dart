import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app/app.dart';
import 'core/env/app_env.dart';

Future<void> bootstrap() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Default: lock the app to portrait. The player page will override this
  // to landscape while playing and then restore portrait when exiting.
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  final env = AppEnv.fromDefines();
  runApp(WanzamiApp(env: env));
}
