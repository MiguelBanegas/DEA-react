import { useCallback } from "react";
import {
  addLocalPlanilla,
  getAllLocalPlanillas,
  getPending,
  updateLocal,
  getDb,
} from "../services/offline";
import {
  createPlanillaMultipart,
  updatePlanillaMultipart,
} from "../services/api";

export function usePlanillas() {
  const saveLocalAndMaybeSync = useCallback(
    async (meta, files = [], targetRemoteId = null) => {
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const record = {
        id,
        meta,
        files, // File[] supported by browsers; offline persistence uses Blob via idb
        syncStatus: navigator.onLine ? "syncing" : "pending",
        createdAt: new Date().toISOString(),
      };
      await addLocalPlanilla(record);

      let remoteId = targetRemoteId;
      let success = false;
      let error = null;

      if (navigator.onLine) {
        try {
          let resp;
          let isUpdate = false;

          if (targetRemoteId) {
            try {
              // INTENTAR ACTUALIZAR (PUT)
              resp = await updatePlanillaMultipart(targetRemoteId, meta, files);
              isUpdate = true;
            } catch (putErr) {
              // Si falla con error (API no tiene endpoint o server error), hacemos fallback a CREAR
              console.warn(
                "Fallo update (probablemente API no soporta PUT). Creando nuevo registro...",
                putErr
              );
              resp = await createPlanillaMultipart(meta, files);
            }
          } else {
            // CREAR (POST)
            resp = await createPlanillaMultipart(meta, files);
          }

          // Si fue una creación (o fallback), obtener el nuevo ID
          // Si fue update exitoso, mantenemos el ID que ya teníamos
          const newId = resp.planilla.id || null;
          if (!isUpdate && newId) {
            remoteId = newId;
          }

          // ACTUALIZAR localmente con la respuesta del servidor (incluye URLs de imágenes)
          const updatedMeta = resp.planilla
            ? { ...meta, ...resp.planilla }
            : meta;

          await updateLocal(id, {
            syncStatus: "synced",
            remoteId,
            meta: updatedMeta, // Guardamos el meta actualizado que devuelve el server
          });
          success = true;
        } catch (err) {
          error = String(err);
          await updateLocal(id, { syncStatus: "pending", lastError: error });
        }
      }

      // Devolver objeto completo con detalles
      return { localId: id, remoteId, success, error };
    },
    []
  );

  const syncQueue = useCallback(async () => {
    const pend = await getPending();
    for (const p of pend) {
      await updateLocal(p.id, { syncStatus: "syncing" });
      try {
        const resp = await createPlanillaMultipart(p.meta, p.files || []);

        // Actualizar también al sincronizar en segundo plano
        const updatedMeta = resp.planilla
          ? { ...p.meta, ...resp.planilla }
          : p.meta;

        await updateLocal(p.id, {
          syncStatus: "synced",
          remoteId: resp.planilla.id || null,
          meta: updatedMeta,
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
