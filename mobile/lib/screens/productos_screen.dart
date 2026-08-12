import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/producto.dart';
import '../services/api_service.dart';
import '../widgets/producto_card.dart';
import 'producto_form_screen.dart';

class ProductosScreen extends StatefulWidget {
  const ProductosScreen({super.key});

  @override
  State<ProductosScreen> createState() => _ProductosScreenState();
}

class _ProductosScreenState extends State<ProductosScreen> {
  late Future<List<Producto>> _futureProductos;
  String _busqueda = '';

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  void _cargar() {
    _futureProductos = context.read<ApiService>().getProductos();
  }

  Future<void> _refrescar() async {
    setState(_cargar);
    await _futureProductos;
  }

  Future<void> _abrirFormulario({Producto? producto}) async {
    final creado = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ProductoFormScreen(producto: producto)),
    );
    if (creado == true) _refrescar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Buscar producto...',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _busqueda = v.toLowerCase()),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refrescar,
              child: FutureBuilder<List<Producto>>(
                future: _futureProductos,
                builder: (context, snapshot) {
                  if (snapshot.connectionState != ConnectionState.done) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (snapshot.hasError) {
                    return _mensajeError(snapshot.error.toString());
                  }
                  final productos = (snapshot.data ?? [])
                      .where((p) => p.nombre.toLowerCase().contains(_busqueda))
                      .toList();

                  if (productos.isEmpty) {
                    return ListView(
                      children: const [
                        SizedBox(height: 80),
                        Center(child: Text('No hay productos cargados todavía.')),
                      ],
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.only(top: 6, bottom: 90),
                    itemCount: productos.length,
                    itemBuilder: (context, i) {
                      final producto = productos[i];
                      return ProductoCard(
                        producto: producto,
                        onTap: () => _abrirFormulario(producto: producto),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _abrirFormulario(),
        icon: const Icon(Icons.add),
        label: const Text('Producto'),
      ),
    );
  }

  Widget _mensajeError(String error) {
    return ListView(
      children: [
        const SizedBox(height: 60),
        Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(error, textAlign: TextAlign.center),
        ),
        const SizedBox(height: 12),
        Center(
          child: OutlinedButton(onPressed: _refrescar, child: const Text('Reintentar')),
        ),
      ],
    );
  }
}
