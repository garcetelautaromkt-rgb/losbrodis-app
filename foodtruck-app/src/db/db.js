// Capa mínima de acceso a IndexedDB, sin dependencias externas.
// Cada módulo (insumos, platos, combos, ...) define su propio repositorio
// arriba de las funciones genéricas de acá: getAll / getById / put / remove.

const DB_NAME = 'foodtruck_pos';
const DB_VERSION = 3;

// Definición de todos los "object stores" (tablas) que va a tener la app.
// Se agregan acá a medida que se construye cada módulo; si en el futuro se
// suman stores nuevos hay que subir DB_VERSION para que se cree la tabla.
const STORE_CONFIG = {
  insumos: {
    keyPath: 'id',
    indexes: [{ name: 'nombre', keyPath: 'nombre' }],
  },
  movimientosInsumo: {
    keyPath: 'id',
    indexes: [
      { name: 'insumoId', keyPath: 'insumoId' },
      { name: 'fecha', keyPath: 'fecha' },
    ],
  },
  platos: {
    keyPath: 'id',
    indexes: [{ name: 'categoria', keyPath: 'categoria' }],
  },
  combos: {
    keyPath: 'id',
  },
  ventas: {
    keyPath: 'id',
    indexes: [
      { name: 'fecha', keyPath: 'fecha' },
      { name: 'clienteId', keyPath: 'clienteId' },
    ],
  },
  clientes: {
    keyPath: 'id',
    indexes: [{ name: 'nombre', keyPath: 'nombre' }],
  },
  pagosCliente: {
    keyPath: 'id',
    indexes: [{ name: 'clienteId', keyPath: 'clienteId' }],
  },
  gastos: {
    keyPath: 'id',
    indexes: [{ name: 'fecha', keyPath: 'fecha' }],
  },
  tareas: {
    keyPath: 'id',
    indexes: [{ name: 'fecha', keyPath: 'fecha' }],
  },
  publicaciones: {
    keyPath: 'id',
    indexes: [{ name: 'fecha', keyPath: 'fecha' }],
  },
};

let dbPromise = null;

function abrirDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const [storeName, config] of Object.entries(STORE_CONFIG)) {
        if (db.objectStoreNames.contains(storeName)) continue;
        const store = db.createObjectStore(storeName, { keyPath: config.keyPath });
        (config.indexes || []).forEach((idx) => store.createIndex(idx.name, idx.keyPath));
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function pedirTienda(storeName, modo = 'readonly') {
  return abrirDb().then((db) => db.transaction(storeName, modo).objectStore(storeName));
}

function envolverRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll(storeName) {
  const store = await pedirTienda(storeName);
  return envolverRequest(store.getAll());
}

export async function getAllByIndex(storeName, indexName, valor) {
  const store = await pedirTienda(storeName);
  return envolverRequest(store.index(indexName).getAll(valor));
}

export async function getById(storeName, id) {
  const store = await pedirTienda(storeName);
  return envolverRequest(store.get(id));
}

export async function put(storeName, valor) {
  const store = await pedirTienda(storeName, 'readwrite');
  await envolverRequest(store.put(valor));
  return valor;
}

export async function remove(storeName, id) {
  const store = await pedirTienda(storeName, 'readwrite');
  await envolverRequest(store.delete(id));
}
