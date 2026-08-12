import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/insumo.dart';
import '../models/receta.dart';
import '../services/api_service.dart';

class RecetaFormScreen extends StatefulWidget {
  final Receta? receta;
  const RecetaFormScreen({super.key, this.receta});

  @override
  State<RecetaFormScreen> createState() => _RecetaFormScreenState();
}

class _RecetaFormScreenState extends State<RecetaFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _moneda = NumberFormat.currency(locale: 'es_AR', symbol: r'$');

  late final TextEditingController _nombreCtrl;
  late final TextEditingController _descripcionCtrl;
  late final TextEditingController _rendimientoCtrl;
  late final TextEditingController _manoObraCtrl;
  late final TextEditingController _adicionalesCtrl;
  late final TextEditingController _margenCtrl;

  TipoMargen _tipoMargen = TipoMargen.sobreCosto;
  final List<_InsumoLinea> _lineas = [];
  List<Insumo> _insumosDisponibles = [];
  bool _cargandoInsumos = true;
  bool _guardando = false;
  String? _error;

  bool get _esEdicion => widget.receta != null;

  @override
  void initState() {
    super.initState();
    final r = widget.receta;
    _nombreCtrl = TextEditingController(text: r?.nombre ?? '');
    _descripcionCtrl = TextEditingController(text: r?.descripcion ?? '');
    _rendimientoCtrl = TextEditingController(text: (r?.rendimiento ?? 1).toStringAsFixed(0));
    _manoObraCtrl = TextEditingController(text: (r?.costoManoObra ?? 0).toStringAsFixed(2));
    _adicionalesCtrl = TextEditingController(text: (r?.costosAdicionales ?? 0).toStringAsFixed(2));
    _margenCtrl = TextEditingController(text: (r?.margenGanancia ?? 40).toStringAsFixed(0));
    _tipoMargen = r?.tipoMargen ?? TipoMargen.sobreCosto;

    if (r != null) {
      for (final item in r.insumos) {
        _lineas.add(_InsumoLinea(insumoId: item.insumoId, cantidadCtrl: TextEditingController(text: item.cantidad.toString())));
      }
    }

    _cargarInsumos();
  }

  Future<void> _cargarInsumos() async {
    try {
      final insumos = await context.read<ApiService>().getInsumos();
      if (mounted) setState(() => _insumosDisponibles = insumos);
    } catch (e) {
      if (mounted) setState(() => _error = 'No se pudieron cargar los insumos: $e');
    } finally {
      if (mounted) setState(() => _cargandoInsumos = false);
    }
  }

  Insumo? _insumoPorId(String id) {
    for (final i in _insumosDisponibles) {
      if (i.id == id) return i;
    }
    return null;
  }

  // -------------------------------------------------------------------
  // Cálculo local (espeja el algoritmo del backend) para mostrar una
  // vista previa instantánea mientras el usuario edita la receta.
  // -------------------------------------------------------------------
  double get _costoInsumos {
    double total = 0;
    for (final linea in _lineas) {
      if (linea.insumoId == null) continue;
      final insumo = _insumoPorId(linea.insumoId!);
      if (insumo == null) continue;
      final cantidad = double.tryParse(linea.cantidadCtrl.text) ?? 0;
      total += cantidad * insumo.costoUnitario;
    }
    return total;
  }

  double get _costoProduccion {
    final manoObra = double.tryParse(_manoObraCtrl.text) ?? 0;
    final adicionales = double.tryParse(_adicionalesCtrl.text) ?? 0;
    return _costoInsumos + manoObra + adicionales;
  }

  double get _rendimiento {
    final r = double.tryParse(_rendimientoCtrl.text) ?? 1;
    return r > 0 ? r : 1;
  }

  double get _costoPorUnidad => _costoProduccion / _rendimiento;

  double get _precioSugerido {
    final margen = (double.tryParse(_margenCtrl.text) ?? 0) / 100;
    if (_tipoMargen == TipoMargen.sobrePrecio) {
      if (margen >= 1) return double.infinity;
      return _costoPorUnidad / (1 - margen);
    }
    return _costoPorUnidad * (1 + margen);
  }

  void _agregarLinea() {
    if (_insumosDisponibles.isEmpty) return;
    setState(() {
      _lineas.add(_InsumoLinea(insumoId: null, cantidadCtrl: TextEditingController(text: '1')));
    });
  }

  void _quitarLinea(int index) {
    setState(() {
      _lineas[index].cantidadCtrl.dispose();
      _lineas.removeAt(index);
    });
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    final insumosValidos = _lineas.where((l) => l.insumoId != null && (double.tryParse(l.cantidadCtrl.text) ?? 0) > 0).toList();
    if (insumosValidos.isEmpty) {
      setState(() => _error = 'Agregá al menos un insumo con cantidad válida.');
      return;
    }

    setState(() {
      _guardando = true;
      _error = null;
    });

    final receta = Receta(
      id: widget.receta?.id ?? '',
      nombre: _nombreCtrl.text.trim(),
      descripcion: _descripcionCtrl.text.trim(),
      rendimiento: _rendimiento,
      costoManoObra: double.tryParse(_manoObraCtrl.text) ?? 0,
      costosAdicionales: double.tryParse(_adicionalesCtrl.text) ?? 0,
      margenGanancia: double.tryParse(_margenCtrl.text) ?? 0,
      tipoMargen: _tipoMargen,
      costoProduccion: _costoProduccion,
      costoPorUnidad: _costoPorUnidad,
      precioSugerido: _precioSugerido,
      insumos: insumosValidos
          .map((l) => RecetaInsumoItem(insumoId: l.insumoId!, cantidad: double.tryParse(l.cantidadCtrl.text) ?? 0))
          .toList(),
    );

    try {
      final api = context.read<ApiService>();
      if (_esEdicion) {
        await api.actualizarReceta(widget.receta!.id, receta);
      } else {
        await api.crearReceta(receta);
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
        title: const Text('Eliminar receta'),
        content: Text('¿Seguro que querés eliminar "${widget.receta!.nombre}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirmar != true) return;

    try {
      await context.read<ApiService>().eliminarReceta(widget.receta!.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _descripcionCtrl.dispose();
    _rendimientoCtrl.dispose();
    _manoObraCtrl.dispose();
    _adicionalesCtrl.dispose();
    _margenCtrl.dispose();
    for (final l in _lineas) {
      l.cantidadCtrl.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_esEdicion ? 'Editar receta' : 'Nueva receta'),
        actions: [
          if (_esEdicion)
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: _eliminar),
        ],
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    TextFormField(
                      controller: _nombreCtrl,
                      decoration: const InputDecoration(labelText: 'Nombre de la receta'),
                      validator: (v) => (v == null || v.isEmpty) ? 'Obligatorio' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descripcionCtrl,
                      decoration: const InputDecoration(labelText: 'Descripción'),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 20),
                    Text('Insumos', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    if (_cargandoInsumos) const LinearProgressIndicator(),
                    if (!_cargandoInsumos && _insumosDisponibles.isEmpty)
                      const Text('No hay insumos cargados. Creá insumos primero en el módulo de Compras/Stock.'),
                    ..._lineas.asMap().entries.map((entry) => _filaInsumo(entry.key, entry.value)),
                    if (!_cargandoInsumos && _insumosDisponibles.isNotEmpty)
                      TextButton.icon(
                        onPressed: _agregarLinea,
                        icon: const Icon(Icons.add),
                        label: const Text('Agregar insumo'),
                      ),
                    const SizedBox(height: 12),
                    Text('Rendimiento y costos adicionales', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _rendimientoCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Rendimiento (unidades que produce)'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _manoObraCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Mano de obra', prefixText: r'$ '),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: TextFormField(
                            controller: _adicionalesCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(labelText: 'Otros costos', prefixText: r'$ '),
                            onChanged: (_) => setState(() {}),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text('Margen de ganancia', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    SegmentedButton<TipoMargen>(
                      segments: const [
                        ButtonSegment(value: TipoMargen.sobreCosto, label: Text('Sobre costo')),
                        ButtonSegment(value: TipoMargen.sobrePrecio, label: Text('Sobre precio')),
                      ],
                      selected: {_tipoMargen},
                      onSelectionChanged: (s) => setState(() => _tipoMargen = s.first),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _margenCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Margen de ganancia deseado (%)', suffixText: '%'),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 20),
                    _resumenCosto(),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: Colors.red)),
                    ],
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: FilledButton(
                  onPressed: _guardando ? null : _guardar,
                  style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                  child: _guardando
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_esEdicion ? 'Guardar cambios' : 'Crear receta'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _filaInsumo(int index, _InsumoLinea linea) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            flex: 3,
            child: DropdownButtonFormField<String>(
              value: linea.insumoId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Insumo'),
              items: _insumosDisponibles
                  .map((i) => DropdownMenuItem(value: i.id, child: Text('${i.nombre} (${i.unidadMedida})', overflow: TextOverflow.ellipsis)))
                  .toList(),
              onChanged: (v) => setState(() => linea.insumoId = v),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: TextFormField(
              controller: linea.cantidadCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Cantidad'),
              onChanged: (_) => setState(() {}),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: () => _quitarLinea(index),
          ),
        ],
      ),
    );
  }

  Widget _resumenCosto() {
    final colorScheme = Theme.of(context).colorScheme;
    final precio = _precioSugerido.isFinite ? _moneda.format(_precioSugerido) : '—';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.primaryContainer.withOpacity(0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colorScheme.primary.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Resumen de costos', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          _filaResumen('Costo de insumos', _moneda.format(_costoInsumos)),
          _filaResumen('Costo total de producción', _moneda.format(_costoProduccion)),
          _filaResumen('Costo por unidad (÷ ${_rendimiento.toStringAsFixed(0)})', _moneda.format(_costoPorUnidad)),
          const Divider(height: 20),
          _filaResumen('Precio de venta sugerido', precio, destacado: true),
        ],
      ),
    );
  }

  Widget _filaResumen(String etiqueta, String valor, {bool destacado = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(etiqueta),
          Text(
            valor,
            style: TextStyle(
              fontWeight: destacado ? FontWeight.bold : FontWeight.normal,
              fontSize: destacado ? 18 : 14,
              color: destacado ? Theme.of(context).colorScheme.primary : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _InsumoLinea {
  String? insumoId;
  final TextEditingController cantidadCtrl;
  _InsumoLinea({required this.insumoId, required this.cantidadCtrl});
}
