import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/receta.dart';
import '../services/api_service.dart';
import '../widgets/receta_card.dart';
import 'receta_form_screen.dart';

class RecetasScreen extends StatefulWidget {
  const RecetasScreen({super.key});

  @override
  State<RecetasScreen> createState() => _RecetasScreenState();
}

class _RecetasScreenState extends State<RecetasScreen> {
  late Future<List<Receta>> _futureRecetas;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  void _cargar() {
    _futureRecetas = context.read<ApiService>().getRecetas();
  }

  Future<void> _refrescar() async {
    setState(_cargar);
    await _futureRecetas;
  }

  Future<void> _abrirFormulario({Receta? receta}) async {
    final creado = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => RecetaFormScreen(receta: receta)),
    );
    if (creado == true) _refrescar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refrescar,
        child: FutureBuilder<List<Receta>>(
          future: _futureRecetas,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return ListView(
                children: [
                  const SizedBox(height: 60),
                  Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text('${snapshot.error}', textAlign: TextAlign.center),
                  ),
                ],
              );
            }
            final recetas = snapshot.data ?? [];
            if (recetas.isEmpty) {
              return ListView(
                children: const [
                  SizedBox(height: 80),
                  Center(child: Text('Todavía no cargaste recetas.')),
                  SizedBox(height: 8),
                  Center(child: Text('Creá una para calcular su costo de producción.')),
                ],
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.only(top: 10, bottom: 90),
              itemCount: recetas.length,
              itemBuilder: (context, i) {
                final receta = recetas[i];
                return RecetaCard(receta: receta, onTap: () => _abrirFormulario(receta: receta));
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _abrirFormulario(),
        icon: const Icon(Icons.add),
        label: const Text('Receta'),
      ),
    );
  }
}
