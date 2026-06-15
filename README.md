# Los Brodis - Panel de gestión

App de gestión para Los Brodis: ventas, gastos, stock, punto de equilibrio y cierre de caja, con integración a Google Sheets vía Google Forms.

## 🚀 Cómo subirlo a Vercel (gratis, sin saber programar)

### Opción A: arrastrando la carpeta (la más simple)

1. Entrá a [vercel.com](https://vercel.com) y creá una cuenta gratis (podés usar tu cuenta de Google o GitHub).
2. Una vez adentro, hacé clic en **"Add New..." → "Project"**.
3. Vas a ver una opción para **subir una carpeta** (drag & drop). Arrastrá la carpeta completa `losbrodis-app` (esta carpeta).
4. Vercel va a detectar automáticamente que es un proyecto Vite. No cambies nada, solo tocá **Deploy**.
5. En 1-2 minutos te va a dar un link tipo `https://losbrodis-app.vercel.app`. Ese es tu link definitivo.

### Opción B: con GitHub (si ya tenés cuenta)

1. Subí esta carpeta a un repositorio nuevo en GitHub.
2. En Vercel: **Add New... → Project → Import Git Repository**.
3. Seleccioná el repositorio y tocá **Deploy**.
4. Cada vez que subas un cambio al repositorio, Vercel actualiza la app sola.

## 📱 Usarla en el celular

Una vez desplegada, abrí el link en Chrome desde el celular y:

- **Android (Chrome):** tocá los 3 puntitos → "Agregar a pantalla de inicio". Queda como una app más.
- **iPhone (Safari):** tocá el botón de compartir → "Agregar a pantalla de inicio".

## 💻 Probarla en tu PC antes de subir (opcional)

Si tenés Node.js instalado:

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`

## 🔗 Conectar con Google Sheets

Una vez desplegada (¡importante: tiene que estar en un link real, no en localhost ni en una vista previa!), entrá a la pestaña **Inicio → Google Sheets → Configurar** y seguí las instrucciones para vincular el Google Form.

## 📝 Notas

- Todos los datos (ventas, gastos, stock, cierres) se guardan en el navegador (localStorage). Si limpiás los datos del navegador o cambiás de dispositivo, se pierden — por eso es importante usar el cierre de caja para respaldar todo en Google Sheets.
- La app es responsive: se adapta sola a celular y a PC.
