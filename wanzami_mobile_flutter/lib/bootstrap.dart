import 'package:flutter/material.dart';

import 'app/app.dart';
import 'core/env/app_env.dart';

void bootstrap() {
  WidgetsFlutterBinding.ensureInitialized();
  final env = AppEnv.fromDefines();
  runApp(WanzamiApp(env: env));
}
