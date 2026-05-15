import 'dart:io';

/// Android emulator reaches the host machine via 10.0.2.2 (not localhost).
/// iOS Simulator shares the host network; 127.0.0.1 works reliably.
String apiBaseUrlForDevice() {
  if (Platform.isAndroid) {
    return 'http://10.0.2.2:4000/api';
  }
  return 'http://127.0.0.1:4000/api';
}
