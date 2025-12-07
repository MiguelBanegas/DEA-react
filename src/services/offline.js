import { openDB } from 'idb'
const DB_NAME = 'dea-db'
const STORE = 'planillas'

export async function getDb() {
  return openDB(DB_NAME, 2, { // Versión incrementada a 2
    upgrade(db, oldVersion, newVersion, tx) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'id' })
          s.createIndex('syncStatus', 'syncStatus')
        }
      }
      if (oldVersion < 2) {
        // Usar la transacción 'tx' proporcionada por el evento 'upgrade'
        const store = tx.objectStore(STORE);
        if (!store.indexNames.contains('remoteId')) {
          store.createIndex('remoteId', 'remoteId', { unique: false });
        }
      }
    }
  })
}

export async function addLocalPlanilla(rec) {
  const db = await getDb()
  await db.add(STORE, rec)
}

export async function getLocalPlanilla(id) {
  const db = await getDb()
  if (!id) return null; // Si no hay ID, no podemos buscar nada
  return db.get(STORE, id)
}

export async function getAllLocalPlanillas() {
  const db = await getDb()
  return db.getAll(STORE)
}

export async function getPending() {
  const db = await getDb()
  try {
    return db.getAllFromIndex(STORE, 'syncStatus', 'pending')
  } catch (e) {
    return []
  }
}

export async function updateLocal(id, patch) {
  const db = await getDb()
  const rec = await db.get(STORE, id)
  if (!rec) throw new Error('not found')
  Object.assign(rec, patch)
  await db.put(STORE, rec)
  return rec
}

export async function removeLocal(id) {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function bulkAddOrUpdateSynced(serverPlanillas) {
  if (!Array.isArray(serverPlanillas)) return;

  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);

  for (const p of serverPlanillas) {
    // Buscar si ya existe una planilla local con este remoteId
    const existing = await store.index('remoteId').get(p.id);

    if (existing) {
      // Si existe y está sincronizada, la actualizamos.
      // Si está pendiente, la ignoramos para no sobrescribir cambios locales.
      if (existing.syncStatus === 'synced') {
        const updatedRecord = {
          ...existing,
          meta: { ...existing.meta, ...p.meta },
          images: p.images || existing.images,
          updatedAt: new Date().toISOString()
        };
        await store.put(updatedRecord);
      }
    } else {
      // Si no existe, la creamos como un nuevo registro local ya sincronizado.
      const newRecord = {
        id: crypto.randomUUID(), // ID local nuevo
        remoteId: p.id,           // ID del servidor
        meta: p.meta,
        images: p.images || [],
        syncStatus: 'synced',
        createdAt: p.createdAt || new Date().toISOString(),
      };
      await store.put(newRecord);
    }
  }

  await tx.done;
}
