import '../data/api_repository.dart';

class SecurityPolicy {
  const SecurityPolicy({
    required this.minPasswordLength,
    required this.sessionTimeoutMinutes,
    required this.adminTwoFactorRequired,
  });

  final int minPasswordLength;
  final int sessionTimeoutMinutes;
  final bool adminTwoFactorRequired;

  static const SecurityPolicy defaults = SecurityPolicy(
    minPasswordLength: 8,
    sessionTimeoutMinutes: 60,
    adminTwoFactorRequired: true,
  );
}

SecurityPolicy? _cached;
DateTime? _cachedAt;

Future<SecurityPolicy> fetchSecurityPolicy({bool force = false}) async {
  if (!force &&
      _cached != null &&
      _cachedAt != null &&
      DateTime.now().difference(_cachedAt!) < const Duration(minutes: 1)) {
    return _cached!;
  }
  try {
    final data = await ApiRepository().fetchSecurityPolicy();
    _cached = SecurityPolicy(
      minPasswordLength: (data['minPasswordLength'] as num?)?.toInt().clamp(4, 128) ?? 8,
      sessionTimeoutMinutes:
          (data['sessionTimeoutMinutes'] as num?)?.toInt().clamp(5, 10080) ?? 60,
      adminTwoFactorRequired: data['adminTwoFactorRequired'] != false,
    );
    _cachedAt = DateTime.now();
    return _cached!;
  } catch (_) {
    return SecurityPolicy.defaults;
  }
}

String passwordLengthMessage(int minLength, {bool isEn = true}) {
  if (!isEn) return 'La contraseña debe tener al menos $minLength caracteres.';
  return 'Password must be at least $minLength characters.';
}

bool passwordTooShort(String password, int minLength) {
  return password.trim().length < minLength;
}
