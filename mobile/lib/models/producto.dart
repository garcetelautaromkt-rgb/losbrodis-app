import 'parsing.dart';

class Producto {
  final String id;
  final String nombre;
  final String? categoria;
  final String? descripcion;
  final String? recetaId;
  final double costoUnitario;
  final double margenGanancia;
  final double precioVenta;
  final bool controlaStock;
  final double stockActual;
  final double stockMinimo;
  final bool activo;

  Producto({
    required this.id,
    required this.nombre,
    this.categoria,
    this.descripcion,
    this.recetaId,
    required this.costoUnitario,
    required this.margenGanancia,
    required this.precioVenta,
    required this.controlaStock,
    required this.stockActual,
    required this.stockMinimo,
    required this.activo,
  });

  bool get bajoStock => controlaStock && stockActual <= stockMinimo;

  double get gananciaUnitaria => precioVenta - costoUnitario;

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'] as String,
      nombre: json['nombre'] as String,
      categoria: json['categoria'] as String?,
      descripcion: json['descripcion'] as String?,
      recetaId: json['recetaId'] as String?,
      costoUnitario: parseDouble(json['costoUnitario']),
      margenGanancia: parseDouble(json['margenGanancia']),
      precioVenta: parseDouble(json['precioVenta']),
      controlaStock: json['controlaStock'] as bool? ?? true,
      stockActual: parseDouble(json['stockActual']),
      stockMinimo: parseDouble(json['stockMinimo']),
      activo: json['activo'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'categoria': categoria,
        'descripcion': descripcion,
        'recetaId': recetaId,
        'costoUnitario': costoUnitario,
        'margenGanancia': margenGanancia,
        'precioVenta': precioVenta,
        'controlaStock': controlaStock,
        'stockActual': stockActual,
        'stockMinimo': stockMinimo,
      };
}
