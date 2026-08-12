import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/insumo.dart';
import '../models/producto.dart';
import '../models/receta.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, {this.statusCode});

  @override
  String toString() => message;
}

/// Cliente HTTP centralizado para consumir la API REST del backend.
/// Guarda el token JWT en almacenamiento local tras el login.
class ApiService {
  static const _tokenKey = 'auth_token';
  String? _cachedToken;

  Future<String?> get _token async {
    if (_cachedToken != null) return _cachedToken;
    final prefs = await SharedPreferences.getInstance();
    _cachedToken = prefs.getString(_tokenKey);
    return _cachedToken;
  }

  Future<void> _guardarToken(String token) async {
    _cachedToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> cerrarSesion() async {
    _cachedToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<bool> get estaAutenticado async => (await _token) != null;

  Future<Map<String, String>> _headers({bool json = true}) async {
    final headers = <String, String>{};
    if (json) headers['Content-Type'] = 'application/json';
    final token = await _token;
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    return Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);
  }

  dynamic _decode(http.Response response) {
    final body = response.body.isNotEmpty ? jsonDecode(response.body) : null;
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    final mensaje = (body is Map && body['error'] != null) ? body['error'] as String : 'Error inesperado (${response.statusCode}).';
    throw ApiException(mensaje, statusCode: response.statusCode);
  }

  // ---------------------------------------------------------------------
  // Autenticación
  // ---------------------------------------------------------------------

  Future<void> login(String email, String password) async {
    final response = await http.post(
      _uri('/auth/login'),
      headers: await _headers(),
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = _decode(response);
    await _guardarToken(data['token'] as String);
  }

  // ---------------------------------------------------------------------
  // Insumos
  // ---------------------------------------------------------------------

  Future<List<Insumo>> getInsumos() async {
    final response = await http.get(_uri('/insumos'), headers: await _headers());
    final data = _decode(response) as List<dynamic>;
    return data.map((e) => Insumo.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ---------------------------------------------------------------------
  // Recetas
  // ---------------------------------------------------------------------

  Future<List<Receta>> getRecetas() async {
    final response = await http.get(_uri('/recetas'), headers: await _headers());
    final data = _decode(response) as List<dynamic>;
    return data.map((e) => Receta.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Receta> crearReceta(Receta receta) async {
    final response = await http.post(
      _uri('/recetas'),
      headers: await _headers(),
      body: jsonEncode(receta.toJson()),
    );
    return Receta.fromJson(_decode(response) as Map<String, dynamic>);
  }

  Future<Receta> actualizarReceta(String id, Receta receta) async {
    final response = await http.put(
      _uri('/recetas/$id'),
      headers: await _headers(),
      body: jsonEncode(receta.toJson()),
    );
    return Receta.fromJson(_decode(response) as Map<String, dynamic>);
  }

  Future<void> eliminarReceta(String id) async {
    final response = await http.delete(_uri('/recetas/$id'), headers: await _headers());
    _decode(response);
  }

  /// Simula el costo/precio sugerido de una receta con un margen distinto,
  /// sin persistir cambios (útil para "qué pasaría si cambio el margen").
  Future<Map<String, dynamic>> simularCostoReceta(
    String recetaId, {
    double? margen,
    TipoMargen? tipoMargen,
  }) async {
    final query = <String, String>{};
    if (margen != null) query['margen'] = margen.toString();
    if (tipoMargen != null) query['tipoMargen'] = tipoMargenToString(tipoMargen);

    final response = await http.get(_uri('/recetas/$recetaId/costo', query), headers: await _headers());
    return _decode(response) as Map<String, dynamic>;
  }

  // ---------------------------------------------------------------------
  // Productos
  // ---------------------------------------------------------------------

  Future<List<Producto>> getProductos() async {
    final response = await http.get(_uri('/productos'), headers: await _headers());
    final data = _decode(response) as List<dynamic>;
    return data.map((e) => Producto.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Producto> crearProducto(Producto producto) async {
    final response = await http.post(
      _uri('/productos'),
      headers: await _headers(),
      body: jsonEncode(producto.toJson()),
    );
    return Producto.fromJson(_decode(response) as Map<String, dynamic>);
  }

  Future<Producto> actualizarProducto(String id, Producto producto) async {
    final response = await http.put(
      _uri('/productos/$id'),
      headers: await _headers(),
      body: jsonEncode(producto.toJson()),
    );
    return Producto.fromJson(_decode(response) as Map<String, dynamic>);
  }

  Future<void> eliminarProducto(String id) async {
    final response = await http.delete(_uri('/productos/$id'), headers: await _headers());
    _decode(response);
  }
}
