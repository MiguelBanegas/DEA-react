import { useCallback } from "react";
import {
  addLocalPlanilla,
  getAllLocalPlanillas,
  getPending,
  updateLocal,
  getDb,
} from "../services/offline";
import { createPlanillaMultipart } from "../services/api";

export function usePlanillas() {
  const saveLocalAndMaybeSync = useCallback(async (meta, files = []) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const record = {
      id,
      meta,
      files, // File[] supported by browsers; offline persistence uses Blob via idb
      syncStatus: navigator.onLine ? "syncing" : "pending",
      createdAt: new Date().toISOString(),
    };
    await addLocalPlanilla(record);

    let remoteId = null;
    let success = false;
    let error = null;

    if (navigator.onLine) {
      try {
        const resp = await createPlanillaMultipart(meta, files);
        remoteId = resp.planilla.id || null;
        await updateLocal(id, { syncStatus: "synced", remoteId });
        success = true;
      } catch (err) {
        error = String(err);
        await updateLocal(id, { syncStatus: "pending", lastError: error });
      }
    }

    // Devolver objeto completo con detalles
    return { localId: id, remoteId, success, error };
  }, []);

  const syncQueue = useCallback(async () => {
    const pend = await getPending();
    for (const p of pend) {
      await updateLocal(p.id, { syncStatus: "syncing" });
      try {
        const resp = await createPlanillaMultipart(p.meta, p.files || []);
        await updateLocal(p.id, {
          syncStatus: "synced",
          remoteId: resp.planilla.id || null,
        });
      } catch (err) {
        await updateLocal(p.id, {
          syncStatus: "pending",
          lastError: String(err),
        });
      }
    }
  }, []);

  const getAllLocal = useCallback(async () => {
    return getAllLocalPlanillas();
  }, []);

  return { saveLocalAndMaybeSync, syncQueue, getAllLocal };
}
