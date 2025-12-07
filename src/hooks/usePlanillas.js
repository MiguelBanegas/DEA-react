import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import {
  addLocalPlanilla,
  getAllLocalPlanillas,
  getPending,
  updateLocal,
  removeLocal,
  bulkAddOrUpdateSynced, // Importar la nueva función
  getLocalPlanilla,
} from "../services/offline";
import {
  createPlanillaMultipart,
  updatePlanillaMultipart,
  deletePlanilla as deletePlanillaAPI,
  listPlanillas, // Importar listPlanillas
  deleteFile,
} from "../services/api";

export function usePlanillas() {
  const syncQueue = useCallback(async (isManualTrigger = false) => {
    // --- 1. Subir (Push) Cambios Locales ---
    const pend = await getPending();
    if (pend.length > 0) {
      const toastId = toast.loading(`Sincronizando ${pend.length} planilla(s) locales...`);
      let successCount = 0;
      let errorCount = 0;

      for (const p of pend) {
        await updateLocal(p.id, { syncStatus: "syncing" });
        try {
          const resp = await createPlanillaMultipart(p.meta, p.files || []);
          const updatedMeta = resp.planilla
            ? { ...p.meta, ...resp.planilla }
            : p.meta;

          await updateLocal(p.id, {
            syncStatus: "synced",
            remoteId: resp.planilla.id || null,
            meta: updatedMeta,
          });
          successCount++;
        } catch (err) {
          await updateLocal(p.id, {
            syncStatus: "pending",
            lastError: String(err),
          });
          errorCount++;
        }
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} planilla(s) no se pudieron subir.`, { id: toastId });
      } else {
        toast.success(`${successCount} planilla(s) locales sincronizadas.`, { id: toastId });
      }
    } else if (isManualTrigger) {
      toast.success("Tus datos locales ya están sincronizados.");
    }

    // --- 2. Descargar (Pull) Cambios del Servidor ---
    const toastIdPull = toast.loading("Actualizando datos desde el servidor...");
    try {
      const serverData = await listPlanillas();
      const serverPlanillas = serverData.planillas || [];
      
      await bulkAddOrUpdateSynced(serverPlanillas);

      toast.success(`Se actualizaron ${serverPlanillas.length} informes desde el servidor.`, {
        id: toastIdPull,
        duration: 3000,
      });
      
      // Devolvemos true para que la UI pueda recargarse si es necesario
      return true;

    } catch (err) {
      console.error("Error al descargar datos del servidor:", err);
      toast.error("No se pudieron actualizar los datos del servidor.", { id: toastIdPull });
      return false;
    }
  }, []);

  useEffect(() => {
    // Sincronizar al cargar el hook por si quedaron pendientes
    syncQueue();

    // Sincronizar cuando el navegador recupera la conexión
    window.addEventListener("online", () => syncQueue());

    // Limpieza del efecto
    return () => {
      window.removeEventListener("online", () => syncQueue());
    };
  }, [syncQueue]);

  const saveOrUpdateLocalPlanilla = useCallback(
    async (meta, files = [], localId = null, targetRemoteId = null) => {
      const id = localId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  
      // Verificar si el registro ya existe localmente
      const existingRecord = await getLocalPlanilla(id);
  
      if (existingRecord) {
        // Si existe, lo actualizamos (parchamos)
        await updateLocal(id, {
          meta,
          files,
          syncStatus: navigator.onLine ? "syncing" : "pending",
        });
      } else {
        // Si no existe, creamos un registro nuevo
        const newRecord = {
          id,
          meta,
          files,
          syncStatus: navigator.onLine ? "syncing" : "pending",
          createdAt: new Date().toISOString(),
        };
        await addLocalPlanilla(newRecord);
      }
  
      let remoteId = targetRemoteId || existingRecord?.remoteId || null;
      let success = false;
      let error = null;
      let planilla = null;
  
      if (navigator.onLine) {
        try {
          let resp;
          const effectiveRemoteId = remoteId;
  
          if (effectiveRemoteId) {
            resp = await updatePlanillaMultipart(effectiveRemoteId, meta, files);
          } else {
            resp = await createPlanillaMultipart(meta, files);
          }
  
          // Actualizamos el remoteId si es una creación
          if (resp.planilla && resp.planilla.id) {
            remoteId = resp.planilla.id;
            planilla = resp.planilla;
          }
  
          const updatedMeta = resp.planilla ? { ...meta, ...resp.planilla } : meta;
          
          await updateLocal(id, {
            syncStatus: "synced",
            remoteId,
            meta: updatedMeta,
          });
          success = true;
        } catch (err) {
          error = String(err);
          await updateLocal(id, { syncStatus: "pending", lastError: error });
        }
      }
  
      return { localId: id, remoteId, success, error, planilla };
    },
    []
  );

  const getAllLocal = useCallback(async () => {
    return getAllLocalPlanillas();
  }, []);

  const handleDeletePlanilla = useCallback(async (planilla) => {
    if (!planilla || !planilla.id) {
      toast.error("No se pudo identificar la planilla a eliminar.");
      return;
    }
  
    // 1. Borrar archivos asociados del servidor
    const imagesToDelete = planilla.meta?.images || [];
    if (imagesToDelete.length > 0) {
      toast.loading(`Eliminando ${imagesToDelete.length} archivo(s) adjunto(s)...`, { id: 'delete-files' });
      let deletedCount = 0;
      for (const imageUrl of imagesToDelete) {
        try {
          const filename = imageUrl.split('/').pop();
          if (filename) {
            await deleteFile(filename);
            deletedCount++;
          }
        } catch (err) {
          console.error(`Error eliminando archivo ${imageUrl}:`, err);
        }
      }
      if (deletedCount === imagesToDelete.length) {
        toast.success(`${deletedCount} archivo(s) adjunto(s) eliminados.`, { id: 'delete-files' });
      } else {
        toast.error(`No se pudieron eliminar todos los archivos adjuntos.`, { id: 'delete-files' });
      }
    }
  
    // 2. Borrar el registro de la planilla del servidor
    if (planilla.remoteId && planilla.syncStatus === 'synced') {
      try {
        await deletePlanillaAPI(planilla.remoteId);
        toast.success("Informe eliminado del servidor.");
      } catch (err) {
        console.error("Error al eliminar del servidor:", err);
        toast.error("El informe no se pudo eliminar del servidor, se quitará solo localmente.");
      }
    }
    
    // 3. Borrar de la base de datos local
    await removeLocal(planilla.id);
    toast.success("Informe eliminado de la lista local.");
  }, []);

  return { saveOrUpdateLocalPlanilla, syncQueue, getAllLocal, handleDeletePlanilla };
}
