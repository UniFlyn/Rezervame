/// Live API on Render — default for debug and release.
const productionApiBase = 'https://rezervame.onrender.com/api';

/// Override with `--dart-define=API_BASE_URL=http://127.0.0.1:4000` for local Nest + local Postgres.
String apiBaseUrlForDevice() {
  const fromEnv = String.fromEnvironment('API_BASE_URL');
  if (fromEnv.isNotEmpty) {
    final t = fromEnv.trim().replaceAll(RegExp(r'/+$'), '');
    if (t.endsWith('/api')) return t;
    return '$t/api';
  }
  return productionApiBase;
}
