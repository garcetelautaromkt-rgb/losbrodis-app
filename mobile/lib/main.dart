import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const LosBrodisApp());
}

class LosBrodisApp extends StatelessWidget {
  const LosBrodisApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Provider(
      create: (_) => ApiService(),
      child: MaterialApp(
        title: 'Los Brodis - Gestor de Emprendimientos',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const _SesionGate(),
      ),
    );
  }
}

/// Decide si mostrar la pantalla de login o la pantalla principal según
/// si ya existe un token de sesión guardado localmente.
class _SesionGate extends StatefulWidget {
  const _SesionGate();

  @override
  State<_SesionGate> createState() => _SesionGateState();
}

class _SesionGateState extends State<_SesionGate> {
  late Future<bool> _autenticado;

  @override
  void initState() {
    super.initState();
    _autenticado = context.read<ApiService>().estaAutenticado;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _autenticado,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        return (snapshot.data ?? false) ? const HomeScreen() : const LoginScreen();
      },
    );
  }
}
