import 'package:flutter/foundation.dart' show kIsWeb;

import 'api_config_io.dart' if (dart.library.html) 'api_config_stub.dart' as impl;

/// Compile-time override: `--dart-define=API_BASE_URL=http://192.168.1.5:4000`
/// for a physical device on the same LAN (no trailing slash required).
String resolveApiBaseUrl() {
  const fromEnv = String.fromEnvironment('API_BASE_URL');
  if (fromEnv.isNotEmpty) {
    final t = fromEnv.trim().replaceAll(RegExp(r'/+$'), '');
    if (t.endsWith('/api')) return t;
    return '$t/api';
  }
  if (kIsWeb) {
    return 'http://localhost:4000/api';
  }
  return impl.apiBaseUrlForDevice();
}
