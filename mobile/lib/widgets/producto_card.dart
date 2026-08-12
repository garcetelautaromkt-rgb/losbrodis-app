import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/producto.dart';

class ProductoCard extends StatelessWidget {
  final Producto producto;
  final VoidCallback onTap;

  const ProductoCard({super.key, required this.producto, required this.onTap});

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
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: colorScheme.primaryContainer,
                child: Icon(Icons.fastfood_outlined, color: colorScheme.onPrimaryContainer),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(producto.nombre, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    if (producto.categoria != null && producto.categoria!.isNotEmpty)
                      Text(producto.categoria!, style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text('Costo: ${moneda.format(producto.costoUnitario)}', style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(width: 10),
                        Text(
                          'Venta: ${moneda.format(producto.precioVenta)}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold, color: colorScheme.primary),
                        ),
                      ],
                    ),
                    if (producto.controlaStock) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            producto.bajoStock ? Icons.warning_amber_rounded : Icons.inventory_2_outlined,
                            size: 14,
                            color: producto.bajoStock ? Colors.orange : Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Stock: ${producto.stockActual.toStringAsFixed(0)}',
                            style: TextStyle(fontSize: 12, color: producto.bajoStock ? Colors.orange[800] : Colors.grey[600]),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
