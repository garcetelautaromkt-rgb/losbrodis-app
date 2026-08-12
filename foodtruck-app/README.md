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
| 4 | Clientes — historial, saldo fiado, recordatorio de inactivos | 🔸 Parcial (alta rápida + saldo fiado ya funcionan; falta la pantalla) |
| 5 | Gastos — registro por monto/categoría/fecha | ⏳ Pendiente |
| 6 | Resumen / Ganancia diaria — vista día/semana/mes | ⏳ Pendiente |
| 7 | Organización — tareas y calendario de publicaciones | ⏳ Pendiente |

Los módulos pendientes ya tienen su pantalla placeholder ("Próximamente") conectada a la navegación, para que integrarlos después sea directo.

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
    InicioPage.jsx / ClientesPage.jsx / GastosPage.jsx / TareasPage.jsx
                                  Placeholders de los módulos pendientes
  utils/
    id.js, money.js, image.js   Helpers (UUID, formato $ARS, compresión de fotos)
    nota.js                      Arma la nota de pedido y la comparte por WhatsApp
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
```

### Cómo se descuenta el stock

Al cerrar una venta, `ventasRepo.crearVenta()` recorre lo vendido y arma un mapa de consumo total por insumo: para un plato usa su `receta`, y para un combo suma la receta de cada plato que incluye (multiplicando por la cantidad del combo). Recién ahí llama a `ajustarStock(insumoId, -cantidad, { tipo: 'venta' })` una sola vez por insumo, así el historial no se llena de movimientos duplicados.

Si el stock no alcanza, la venta **no se bloquea** —en un puesto no se le puede decir "esperá" a un cliente—: se muestra un aviso en la pantalla de cobro y el stock del insumo queda en cero.

## Próximos pasos sugeridos

1. **Clientes**: la pantalla del módulo. El store `clientes`, el alta rápida y `ventasRepo.saldoFiado(clienteId)` ya existen; falta listar clientes con su deuda, historial de compras (`listarVentasDeCliente`), botón de registrar pago (`clientesRepo.registrarPago`) y marcar visualmente a quienes no compran hace X días.
2. **Gastos**: store `gastos` simple, con filtro por fecha.
3. **Inicio**: con `ventas` ya disponible, sumar el resumen del día/semana/mes en cuanto exista `gastos` para calcular la ganancia neta.
4. **Organización**: stores `tareas` y `publicaciones`, sin integraciones externas.
5. **Compartir en Capacitor**: reemplazar `navigator.share` por `@capacitor/share`, que es más confiable dentro del WebView de Android.
