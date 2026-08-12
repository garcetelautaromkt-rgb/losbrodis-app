# Los Brodis ERP - App móvil (Flutter)

App móvil (Android/iOS) del gestor de emprendimientos. Esta base incluye la pantalla principal para gestionar **Productos** y **Recetas** (con cálculo de costo de producción y precio de venta sugerido), consumiendo la API REST del backend.

## Requisitos

- Flutter SDK >= 3.22 (Dart >= 3.3)
- El [backend](../backend) corriendo y accesible desde el dispositivo/emulador

## Instalación

```bash
cd mobile
flutter pub get
```

## Configurar la URL del backend

Por defecto apunta a `http://10.0.2.2:4000/api` (equivale a `localhost` del host visto desde el emulador de Android). Podés sobrescribirla al compilar:

```bash
# Emulador Android usando el backend en tu PC
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api

# Dispositivo físico en la misma red Wi-Fi
flutter run --dart-define=API_BASE_URL=http://192.168.0.X:4000/api

# Backend desplegado en producción
flutter run --dart-define=API_BASE_URL=https://tu-api.com/api
```

## Ejecutar

```bash
flutter run
```

Iniciá sesión con el usuario creado en el backend (por ejemplo, tras correr `npm run db:seed`: `admin@losbrodis.com` / `123456`).

## Compilar para producción

```bash
# Android (App Bundle para Google Play)
flutter build appbundle --dart-define=API_BASE_URL=https://tu-api.com/api

# Android (APK directo)
flutter build apk --dart-define=API_BASE_URL=https://tu-api.com/api

# iOS (requiere macOS + Xcode)
flutter build ios --dart-define=API_BASE_URL=https://tu-api.com/api
```

## Estructura

```
lib/
  config/api_config.dart     URL base de la API (configurable con --dart-define)
  models/                    Producto, Receta, Insumo (fromJson/toJson)
  services/api_service.dart  Cliente HTTP (login, productos, recetas, insumos)
  screens/
    login_screen.dart
    home_screen.dart         Navegación principal (Productos / Recetas)
    productos_screen.dart    Listado + búsqueda de productos
    producto_form_screen.dart Alta/edición, vínculo opcional a una receta
    recetas_screen.dart      Listado de recetas con costo y precio sugerido
    receta_form_screen.dart  Alta/edición de receta: insumos, mano de obra,
                              margen configurable y resumen de costos en vivo
  widgets/                   Tarjetas reutilizables de producto y receta
  theme/app_theme.dart       Tema Material 3 de la app
```

## Próximos módulos a integrar en la app

El backend ya expone los endpoints de Compras, Ventas, Clientes, Facturas, Caja, Marketing y Logística — quedan pendientes sus pantallas en Flutter siguiendo el mismo patrón (`services/api_service.dart` + pantallas en `screens/`).
