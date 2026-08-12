import 'parsing.dart';

class Insumo {
  final String id;
  final String nombre;
  final String unidadMedida;
  final double stockActual;
  final double stockMinimo;
  final double costoUnitario;

  Insumo({
    required this.id,
    required this.nombre,
    required this.unidadMedida,
    required this.stockActual,
    required this.stockMinimo,
    required this.costoUnitario,
  });

  bool get bajoStock => stockActual <= stockMinimo;

  factory Insumo.fromJson(Map<String, dynamic> json) {
    return Insumo(
      id: json['id'] as String,
      nombre: json['nombre'] as String,
      unidadMedida: json['unidadMedida'] as String? ?? 'unidad',
      stockActual: parseDouble(json['stockActual']),
      stockMinimo: parseDouble(json['stockMinimo']),
      costoUnitario: parseDouble(json['costoUnitario']),
    );
  }
}
