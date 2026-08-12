# POS Foodtruck — App offline-first

App web mobile-first para emprendedores de comida sin local grande (foodtrucks, ventas por WhatsApp/Instagram, cocinas caseras, puestos). Pensada para envolverse con [Capacitor](https://capacitorjs.com/) y generar un APK.

**Todo funciona sin internet**: no hay backend, los datos viven en el dispositivo usando **IndexedDB** (`src/db/db.js`), así que se puede usar en una feria sin señal.

## Stack

- React + Vite (compila a HTML/CSS/JS estático, ideal para Capacitor)
- IndexedDB nativo del navegador, sin librerías externas de storage
- Sin router: navegación plana por estado (bottom nav de 5 secciones, sin menús anidados)

## Instalación y desarrollo

```bash
cd foodtruck-app
npm install
npm run dev
```

Abrí `http://localhost:5173`. Para probar bien la experiencia mobile-first, achicá la ventana del navegador o usá las devtools en modo dispositivo.

## Compilar

```bash
npm run build   # genera dist/
npm run preview # sirve dist/ para probarlo como quedaría en producción
```

## Envolver con Capacitor (cuando esté lista la primera versión completa)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android      # usa capacitor.config.json, ya incluido en este repo
npx cap sync
npx cap open android     # abre Android Studio para generar el APK/AAB
```

`capacitor.config.json` ya está configurado con `webDir: "dist"`, así que solo hace falta compilar (`npm run build`) antes de cada `npx cap sync`.

## Estado de los módulos

| # | Módulo | Estado |
|---|---|---|
| 1 | **Catálogo / Menú** — platos, combos, receta de insumos, foto opcional | ✅ Construido |
| 2 | **Insumos / Inventario** — stock, mínimos, alerta visual, mermas con motivo | ✅ Construido |
| 3 | **Ventas** — grid de venta rápida, carrito, fiado, nota para WhatsApp | ✅ Construido |
| 4 | **Clientes** — historial, saldo fiado, pagos, recordatorio de inactivos | ✅ Construido |
| 5 | **Gastos** — registro por monto/categoría/fecha con filtro por período | ✅ Construido |
| 6 | **Resumen / Ganancia diaria** — vista día/semana/mes | ✅ Construido |
| 7 | **Organización** — tareas y calendario semanal de publicaciones | ✅ Construido |

Los siete módulos están completos y funcionando offline.

## Estructura

```
src/
  db/
    db.js                  Capa genérica sobre IndexedDB (stores, get/put/remove)
    repositories/
      insumosRepo.js       CRUD de insumos + ajustarStock (compra/merma/ajuste/venta) + historial
      platosRepo.js        CRUD de platos, cada uno con receta: [{ insumoId, cantidad }]
      combosRepo.js        CRUD de combos: platos combinados + precio especial
      ventasRepo.js        Alta de ventas, descuento de stock por receta, saldo fiado
      clientesRepo.js      CRUD de clientes + pagos a cuenta de la deuda
      gastosRepo.js        CRUD de gastos por categoría con filtro por rango
      organizacionRepo.js  Tareas y publicaciones del calendario
  components/
    BottomNav.jsx           Navegación inferior (Inicio/Vender/Catálogo/Clientes/Más)
    Header.jsx               Encabezado con back opcional para sub-vistas de "Más"
    Modal.jsx                 Bottom sheet reutilizable para formularios
    EmptyState.jsx            Estado vacío reutilizable
    icons.jsx                 Set de íconos SVG inline (sin librería externa)
  pages/
    CatalogoPage.jsx           Tabs Platos / Combos
    PlatoFormModal.jsx          Alta/edición de plato + receta + foto
    ComboFormModal.jsx          Alta/edición de combo
    InsumosPage.jsx             Lista + filtro "bajo stock"
    InsumoFormModal.jsx          Alta/edición + ajuste de stock + mermas + historial
    VenderPage.jsx               Grid de venta rápida + carrito
    CerrarVentaModal.jsx          Cobro (ahora/fiado), alta rápida de cliente, nota WhatsApp
    ClientesPage.jsx              Lista con deuda e inactivos, filtros Todos/Deben/Contactar
    ClienteDetalleModal.jsx       Cuenta corriente, historial, registro de pagos
    GastosPage.jsx                Gastos por período con total y alta rápida
    InicioPage.jsx                Resumen día/semana/mes + avisos accionables
    TareasPage.jsx                Tabs Tareas (checkbox) y Calendario semanal
  utils/
    id.js, money.js, image.js   Helpers (UUID, formato $ARS, compresión de fotos)
    nota.js                      Arma la nota de pedido y la comparte por WhatsApp
    fechas.js                    Rangos día/semana/mes y conversión de <input type="date">
  styles/index.css              Estilos mobile-first (botones grandes, safe-area, tema cálido)
```

## Modelo de datos (IndexedDB)

```js
// insumos
{ id, nombre, unidad, stock, stockMinimo, costoUnitario, activo, creadoEn, actualizadoEn }

// movimientosInsumo (historial de compras/mermas/ajustes)
{ id, insumoId, tipo: 'compra'|'merma'|'ajuste'|'venta', delta, motivo, fecha }

// platos
{ id, nombre, precio, categoria, foto, receta: [{ insumoId, cantidad }], activo, creadoEn, actualizadoEn }

// combos
{ id, nombre, precioEspecial, items: [{ platoId, cantidad }], activo, creadoEn, actualizadoEn }

// ventas
{ id, fecha, items: [{ tipo:'plato'|'combo', refId, nombre, precioUnitario, cantidad, subtotal }],
  total, tipoPago: 'inmediato'|'fiado', medioPago, clienteId, pagada, nota }

// clientes
{ id, nombre, telefono, activo, creadoEn, actualizadoEn }

// pagosCliente (pagos a cuenta de la deuda de fiado)
{ id, clienteId, monto, nota, fecha }

// gastos
{ id, monto, categoria: 'insumos'|'servicios'|'otros', fecha, descripcion, creadoEn }

// tareas
{ id, texto, fecha, hecha, creadoEn }

// publicaciones (calendario semanal)
{ id, texto, fecha, plataforma, creadoEn }
```

### Cómo se descuenta el stock

Al cerrar una venta, `ventasRepo.crearVenta()` recorre lo vendido y arma un mapa de consumo total por insumo: para un plato usa su `receta`, y para un combo suma la receta de cada plato que incluye (multiplicando por la cantidad del combo). Recién ahí llama a `ajustarStock(insumoId, -cantidad, { tipo: 'venta' })` una sola vez por insumo, así el historial no se llena de movimientos duplicados.

Si el stock no alcanza, la venta **no se bloquea** —en un puesto no se le puede decir "esperá" a un cliente—: se muestra un aviso en la pantalla de cobro y el stock del insumo queda en cero.

### Cómo se calcula la deuda de un cliente

`deuda = (ventas fiadas no saldadas) − (pagos a cuenta registrados)`, con piso en cero. La lista de clientes usa `resumenDeClientes()`, que carga todas las ventas y todos los pagos **una sola vez** y arma un `Map` con deuda, última compra y cantidad de compras por cliente — así la pantalla no dispara dos consultas por cada cliente de la lista.

Un cliente se marca como "contactar" cuando pasaron 15 días o más desde su última compra (constante `DIAS_PARA_CONTACTAR` en `ClientesPage.jsx`).

### Fechas y zona horaria

Todo se calcula en hora local: un puesto piensa en "lo que vendí hoy", no en UTC. Ojo con un detalle: `new Date('2026-08-12')` se interpreta como UTC y en Argentina (UTC−3) termina cayendo el día anterior. Por eso los valores de `<input type="date">` se convierten con `fechaDesdeInput()` en `utils/fechas.js`, que arma la fecha a mano. Si agregás campos de fecha nuevos, usá ese helper.

## Ideas para más adelante

- **Compartir en Capacitor**: reemplazar `navigator.share` por `@capacitor/share`, más confiable dentro del WebView de Android.
- **Respaldo de datos**: los datos viven solo en el dispositivo. Un export/import a JSON (o sincronización opcional) evitaría perder todo si se borran los datos de la app o se cambia de celular.
- **Cierre de caja diario**: hoy el resumen se calcula en vivo por período; un cierre guardado daría un registro histórico congelado.
- **Costo por plato**: con el `costoUnitario` de los insumos ya cargado, se puede calcular cuánto cuesta producir cada plato y mostrar el margen real de cada venta.
