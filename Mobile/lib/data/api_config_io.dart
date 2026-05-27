import 'dart:io';

import 'package:flutter/foundation.dart';

const _productionApiBase = 'https://rezervame.onrender.com/api';

/// Android emulator reaches the host machine via 10.0.2.2 (not localhost).
/// iOS Simulator shares the host network; 127.0.0.1 works reliably.
/// Release builds use the live Render API unless overridden with `--dart-define=API_BASE_URL=...`.
String apiBaseUrlForDevice() {
  const fromEnv = String.fromEnvironment('API_BASE_URL');
  if (fromEnv.isNotEmpty) {
    final t = fromEnv.trim().replaceAll(RegExp(r'/+$'), '');
    if (t.endsWith('/api')) return t;
    return '$t/api';
  }
  if (kReleaseMode) {
    return _productionApiBase;
  }
  if (Platform.isAndroid) {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://127.0.0.1:4000/api';
}
