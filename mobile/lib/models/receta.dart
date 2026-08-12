import 'insumo.dart';
import 'parsing.dart';

enum TipoMargen { sobreCosto, sobrePrecio }

TipoMargen tipoMargenFromString(String? value) {
  return value == 'sobre_precio' ? TipoMargen.sobrePrecio : TipoMargen.sobreCosto;
}

String tipoMargenToString(TipoMargen tipo) {
  return tipo == TipoMargen.sobrePrecio ? 'sobre_precio' : 'sobre_costo';
}

class RecetaInsumoItem {
  final String insumoId;
  final double cantidad;
  final Insumo? insumo;

  RecetaInsumoItem({required this.insumoId, required this.cantidad, this.insumo});

  factory RecetaInsumoItem.fromJson(Map<String, dynamic> json) {
    return RecetaInsumoItem(
      insumoId: json['insumoId'] as String,
      cantidad: parseDouble(json['cantidad']),
      insumo: json['insumo'] != null ? Insumo.fromJson(json['insumo']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'insumoId': insumoId,
        'cantidad': cantidad,
      };
}

class Receta {
  final String id;
  final String nombre;
  final String? descripcion;
  final double rendimiento;
  final double costoManoObra;
  final double costosAdicionales;
  final double margenGanancia;
  final TipoMargen tipoMargen;
  final double costoProduccion;
  final double costoPorUnidad;
  final double precioSugerido;
  final List<RecetaInsumoItem> insumos;

  Receta({
    required this.id,
    required this.nombre,
    this.descripcion,
    required this.rendimiento,
    required this.costoManoObra,
    required this.costosAdicionales,
    required this.margenGanancia,
    required this.tipoMargen,
    required this.costoProduccion,
    required this.costoPorUnidad,
    required this.precioSugerido,
    required this.insumos,
  });

  factory Receta.fromJson(Map<String, dynamic> json) {
    final rendimiento = parseDouble(json['rendimiento']);
    return Receta(
      id: json['id'] as String,
      nombre: json['nombre'] as String,
      descripcion: json['descripcion'] as String?,
      rendimiento: rendimiento == 0 ? 1 : rendimiento,
      costoManoObra: parseDouble(json['costoManoObra']),
      costosAdicionales: parseDouble(json['costosAdicionales']),
      margenGanancia: parseDouble(json['margenGanancia']),
      tipoMargen: tipoMargenFromString(json['tipoMargen'] as String?),
      costoProduccion: parseDouble(json['costoProduccion']),
      costoPorUnidad: parseDouble(json['costoPorUnidad']),
      precioSugerido: parseDouble(json['precioSugerido']),
      insumos: (json['insumos'] as List<dynamic>? ?? [])
          .map((e) => RecetaInsumoItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'descripcion': descripcion,
        'rendimiento': rendimiento,
        'costoManoObra': costoManoObra,
        'costosAdicionales': costosAdicionales,
        'margenGanancia': margenGanancia,
        'tipoMargen': tipoMargenToString(tipoMargen),
        'insumos': insumos.map((e) => e.toJson()).toList(),
      };
}
