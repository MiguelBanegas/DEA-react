import { openDB } from 'idb'
const DB_NAME = 'dea-db'
const STORE = 'planillas'

export async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id' })
        s.createIndex('syncStatus', 'syncStatus')
      }
    }
  })
}

export async function addLocalPlanilla(rec) {
  const db = await getDb()
  // store files as is (File/Blob) - idb handles Blobs
  await db.add(STORE, rec)
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
