# Los Brodis ERP - API

API REST (Node.js + Express + Sequelize/PostgreSQL) del gestor de emprendimientos: compras e inventario, recetas y costos, ventas y facturación, administración/contabilidad, marketing y logística.

## Requisitos

- Node.js >= 18
- PostgreSQL >= 13 (local o en la nube: Railway, Render, Supabase, etc.)

## Instalación

```bash
cd backend
npm install
cp .env.example .env
# Editá .env con los datos de tu base de datos y un JWT_SECRET propio
```

## Base de datos

```bash
# Crea/actualiza las tablas según los modelos
npm run db:migrate

# (Opcional) Carga datos de ejemplo: un emprendimiento, usuario admin,
# insumos, una receta y un producto ya vinculado a esa receta.
npm run db:seed
# Usuario de prueba: admin@losbrodis.com / 123456
```

## Levantar el servidor

```bash
npm run dev     # desarrollo (nodemon + sincronización automática del esquema)
npm start       # producción
```

El servidor queda disponible en `http://localhost:4000` (configurable con `PORT`). Chequeo de salud: `GET /health`.

## Autenticación

Todas las rutas bajo `/api` (excepto `/api/auth/register` y `/api/auth/login`) requieren el header:

```
Authorization: Bearer <token>
```

El token se obtiene al registrar un emprendimiento o al iniciar sesión.

```bash
# Crear un emprendimiento nuevo + usuario admin
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombreEmprendimiento": "Los Brodis",
    "rubro": "Gastronomía",
    "nombreUsuario": "Admin",
    "email": "admin@losbrodis.com",
    "password": "123456"
  }'
```

## Módulos y endpoints principales

| Módulo | Base | Descripción |
|---|---|---|
| Auth | `/api/auth` | register, login, me |
| Emprendimientos | `/api/emprendimientos` | perfil del negocio actual |
| Usuarios | `/api/usuarios` | equipo del emprendimiento (roles: admin, vendedor, logistica, contable) |
| Proveedores | `/api/proveedores` | CRUD de proveedores |
| Insumos | `/api/insumos` | stock de insumos, ajuste manual de stock, alerta de bajo stock (`?bajoStock=true`) |
| Compras | `/api/compras` | registra compras con ítems, actualiza stock y costo promedio ponderado del insumo, genera egreso en caja |
| Recetas | `/api/recetas` | CRUD de recetas + `GET /:id/costo` para simular costo/precio con otro margen sin guardar |
| Productos | `/api/productos` | catálogo de venta, puede vincularse a una receta para heredar costo y precio |
| Clientes | `/api/clientes` | CRM básico de clientes |
| Ventas | `/api/ventas` | registra ventas con ítems, descuenta stock, genera ingreso en caja, `POST /:id/cancelar` repone stock |
| Facturas | `/api/facturas` | carga de comprobantes de venta/compra/gasto, `GET /analisis` para resumen y vencimientos |
| Caja | `/api/caja` | movimientos manuales de caja y `GET /balance` (flujo de caja / balance rápido) |
| Campañas | `/api/campanias` | marketing: campañas, alcance, clientes impactados, ventas generadas |
| Envíos | `/api/envios` | logística: estado de entregas (`PATCH /:id/estado`) |

## Algoritmo de costeo y precio sugerido (`src/utils/pricing.js`)

```
costoInsumos    = Σ (cantidad del insumo en la receta × costo unitario del insumo)
costoProduccion = costoInsumos + costoManoObra + costosAdicionales
costoPorUnidad  = costoProduccion / rendimiento

# Según receta.tipoMargen:
"sobre_costo"  → precioSugerido = costoPorUnidad × (1 + margen/100)
"sobre_precio" → precioSugerido = costoPorUnidad / (1 - margen/100)
```

El costo y precio se recalculan y persisten automáticamente cada vez que se crea/edita una receta o sus insumos.

## Estructura

```
src/
  config/database.js       Conexión Sequelize
  models/                  Entidades y asociaciones
  controllers/              Lógica de negocio por módulo
  routes/                   Definición de endpoints Express
  middleware/                auth (JWT), manejo de errores
  utils/pricing.js           Algoritmo de costeo y precio sugerido
  scripts/                   syncDb.js, seed.js
  app.js / server.js         Bootstrap de la app Express
```
