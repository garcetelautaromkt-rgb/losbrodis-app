import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/producto.dart';
import '../models/receta.dart';
import '../services/api_service.dart';

class ProductoFormScreen extends StatefulWidget {
  final Producto? producto;
  const ProductoFormScreen({super.key, this.producto});

  @override
  State<ProductoFormScreen> createState() => _ProductoFormScreenState();
}

class _ProductoFormScreenState extends State<ProductoFormScreen> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nombreCtrl;
  late final TextEditingController _categoriaCtrl;
  late final TextEditingController _costoCtrl;
  late final TextEditingController _margenCtrl;
  late final TextEditingController _precioCtrl;
  late final TextEditingController _stockCtrl;
  late final TextEditingController _stockMinCtrl;

  bool _controlaStock = true;
  String? _recetaId;
  List<Receta> _recetas = [];
  bool _cargandoRecetas = true;
  bool _guardando = false;
  String? _error;

  bool get _esEdicion => widget.producto != null;

  @override
  void initState() {
    super.initState();
    final p = widget.producto;
    _nombreCtrl = TextEditingController(text: p?.nombre ?? '');
    _categoriaCtrl = TextEditingController(text: p?.categoria ?? '');
    _costoCtrl = TextEditingController(text: p != null ? p.costoUnitario.toStringAsFixed(2) : '0');
    _margenCtrl = TextEditingController(text: p != null ? p.margenGanancia.toStringAsFixed(0) : '40');
    _precioCtrl = TextEditingController(text: p != null ? p.precioVenta.toStringAsFixed(2) : '0');
    _stockCtrl = TextEditingController(text: p != null ? p.stockActual.toStringAsFixed(0) : '0');
    _stockMinCtrl = TextEditingController(text: p != null ? p.stockMinimo.toStringAsFixed(0) : '0');
    _controlaStock = p?.controlaStock ?? true;
    _recetaId = p?.recetaId;

    _cargarRecetas();
  }

  Future<void> _cargarRecetas() async {
    try {
      final recetas = await context.read<ApiService>().getRecetas();
      if (mounted) setState(() => _recetas = recetas);
    } catch (_) {
      // Si falla, el producto igual puede cargarse manualmente sin receta.
    } finally {
      if (mounted) setState(() => _cargandoRecetas = false);
    }
  }

  void _recalcularPrecioDesdeMargen() {
    final costo = double.tryParse(_costoCtrl.text) ?? 0;
    final margen = double.tryParse(_margenCtrl.text) ?? 0;
    final precio = costo * (1 + margen / 100);
    _precioCtrl.text = precio.toStringAsFixed(2);
  }

  void _aplicarReceta(String? recetaId) {
    setState(() => _recetaId = recetaId);
    if (recetaId == null) return;
    final receta = _recetas.firstWhere((r) => r.id == recetaId);
    _costoCtrl.text = receta.costoPorUnidad.toStringAsFixed(2);
    _margenCtrl.text = receta.margenGanancia.toStringAsFixed(0);
    _precioCtrl.text = receta.precioSugerido.toStringAsFixed(2);
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _guardando = true;
      _error = null;
    });

    final producto = Producto(
      id: widget.producto?.id ?? '',
      nombre: _nombreCtrl.text.trim(),
      categoria: _categoriaCtrl.text.trim(),
      descripcion: widget.producto?.descripcion,
      recetaId: _recetaId,
      costoUnitario: double.tryParse(_costoCtrl.text) ?? 0,
      margenGanancia: double.tryParse(_margenCtrl.text) ?? 0,
      precioVenta: double.tryParse(_precioCtrl.text) ?? 0,
      controlaStock: _controlaStock,
      stockActual: double.tryParse(_stockCtrl.text) ?? 0,
      stockMinimo: double.tryParse(_stockMinCtrl.text) ?? 0,
      activo: true,
    );

    try {
      final api = context.read<ApiService>();
      if (_esEdicion) {
        await api.actualizarProducto(widget.producto!.id, producto);
      } else {
        await api.crearProducto(producto);
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _guardando = false);
    }
  }

  Future<void> _eliminar() async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar producto'),
        content: Text('¿Seguro que querés eliminar "${widget.producto!.nombre}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirmar != true) return;

    try {
      await context.read<ApiService>().eliminarProducto(widget.producto!.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _categoriaCtrl.dispose();
    _costoCtrl.dispose();
    _margenCtrl.dispose();
    _precioCtrl.dispose();
    _stockCtrl.dispose();
    _stockMinCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_esEdicion ? 'Editar producto' : 'Nuevo producto'),
        actions: [
          if (_esEdicion)
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: _eliminar),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _nombreCtrl,
                  decoration: const InputDecoration(labelText: 'Nombre del producto'),
                  validator: (v) => (v == null || v.isEmpty) ? 'Obligatorio' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _categoriaCtrl,
                  decoration: const InputDecoration(labelText: 'Categoría'),
                ),
                const SizedBox(height: 12),
                if (_cargandoRecetas)
                  const LinearProgressIndicator()
                else
                  DropdownButtonFormField<String>(
                    value: _recetaId,
                    decoration: const InputDecoration(labelText: 'Vincular a una receta (opcional)'),
                    items: [
                      const DropdownMenuItem<String>(value: null, child: Text('Sin receta (carga manual)')),
                      ..._recetas.map((r) => DropdownMenuItem(value: r.id, child: Text(r.nombre))),
                    ],
                    onChanged: _aplicarReceta,
                  ),
                const SizedBox(height: 16),
                Text('Costo y precio de venta', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _costoCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Costo unitario', prefixText: r'$ '),
                        onChanged: (_) => _recalcularPrecioDesdeMargen(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextFormField(
                        controller: _margenCtrl,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Margen (%)', suffixText: '%'),
                        onChanged: (_) => _recalcularPrecioDesdeMargen(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _precioCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'Precio de venta',
                    prefixText: r'$ ',
                    helperText: 'Se sugiere automáticamente; podés sobrescribirlo.',
                  ),
                ),
                const SizedBox(height: 16),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Controlar stock'),
                  value: _controlaStock,
                  onChanged: (v) => setState(() => _controlaStock = v),
                ),
                if (_controlaStock)
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _stockCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Stock actual'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          controller: _stockMinCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Stock mínimo'),
                        ),
                      ),
                    ],
                  ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _guardando ? null : _guardar,
                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: _guardando
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_esEdicion ? 'Guardar cambios' : 'Crear producto'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
