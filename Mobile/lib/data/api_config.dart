import 'package:flutter/foundation.dart' show kReleaseMode;

import 'api_config_io.dart' if (dart.library.html) 'api_config_stub.dart' as impl;

const _productionWebBase = 'https://rezervame-web.web.app';

/// Default: live Render API. Local Nest: `--dart-define=API_BASE_URL=http://127.0.0.1:4000`
/// (Android emulator: `http://10.0.2.2:4000`).
String resolveApiBaseUrl() => impl.apiBaseUrlForDevice();

/// Customer Web app origin for external links (e.g. `/business/join`).
/// Override: `--dart-define=WEB_BASE_URL=https://your-web-host`
String resolveWebBaseUrl() {
  const fromEnv = String.fromEnvironment('WEB_BASE_URL');
  if (fromEnv.isNotEmpty) {
    return fromEnv.trim().replaceAll(RegExp(r'/+$'), '');
  }
  if (kReleaseMode) {
    return _productionWebBase;
  }
  var origin = resolveApiBaseUrl().replaceAll(RegExp(r'/api$'), '');
  if (origin.contains(':4000')) {
    origin = origin.replaceFirst(':4000', ':3000');
  }
  return origin;
}

/// Web business partner registration (`/business/join`).
String businessJoinWebUrl() => '${resolveWebBaseUrl()}/business/join';
