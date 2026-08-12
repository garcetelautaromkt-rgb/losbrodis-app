class ApiConfig {
  // Cambia esta URL por la de tu servidor backend desplegado.
  // - Emulador Android: usa 10.0.2.2 en lugar de localhost.
  // - Dispositivo físico: usa la IP de tu PC en la red local o el dominio de producción.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:4000/api',
  );
}
