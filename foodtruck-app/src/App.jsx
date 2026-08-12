import { useState } from 'react';
import BottomNav from './components/BottomNav.jsx';
import InicioPage from './pages/InicioPage.jsx';
import VenderPage from './pages/VenderPage.jsx';
import CatalogoPage from './pages/CatalogoPage.jsx';
import ClientesPage from './pages/ClientesPage.jsx';
import MasPage from './pages/MasPage.jsx';
import InsumosPage from './pages/InsumosPage.jsx';
import GastosPage from './pages/GastosPage.jsx';
import TareasPage from './pages/TareasPage.jsx';

// Navegación plana a propósito (sin router ni menús anidados): un solo
// estado de "vista actual" que decide qué pantalla mostrar. Las vistas
// insumos/gastos/tareas cuelgan de "Más" pero se manejan igual acá.
export default function App() {
  const [vista, setVista] = useState('inicio');

  const volverAMas = () => setVista('mas');

  return (
    <div className="app-shell">
      <main className="app-main">
        {vista === 'inicio' && <InicioPage onIr={setVista} />}
        {vista === 'vender' && <VenderPage />}
        {vista === 'catalogo' && <CatalogoPage />}
        {vista === 'clientes' && <ClientesPage />}
        {vista === 'mas' && <MasPage onIr={setVista} />}
        {vista === 'insumos' && <InsumosPage onVolver={volverAMas} />}
        {vista === 'gastos' && <GastosPage onVolver={volverAMas} />}
        {vista === 'tareas' && <TareasPage onVolver={volverAMas} />}
      </main>
      <BottomNav vistaActual={vista} onCambiarVista={setVista} />
    </div>
  );
}
