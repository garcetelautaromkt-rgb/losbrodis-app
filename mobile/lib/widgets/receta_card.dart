import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/receta.dart';

class RecetaCard extends StatelessWidget {
  final Receta receta;
  final VoidCallback onTap;

  const RecetaCard({super.key, required this.receta, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final moneda = NumberFormat.currency(locale: 'es_AR', symbol: r'$');
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(receta.nombre, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                  ),
                  Text('${receta.insumos.length} insumos', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _dato(context, 'Costo/u', moneda.format(receta.costoPorUnidad), colorScheme.onSurface),
                  const SizedBox(width: 18),
                  _dato(context, 'Precio sugerido', moneda.format(receta.precioSugerido), colorScheme.primary),
                  const SizedBox(width: 18),
                  _dato(context, 'Margen', '${receta.margenGanancia.toStringAsFixed(0)}%', colorScheme.onSurface),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dato(BuildContext context, String etiqueta, String valor, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(etiqueta, style: Theme.of(context).textTheme.bodySmall),
        Text(valor, style: TextStyle(fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }
}
