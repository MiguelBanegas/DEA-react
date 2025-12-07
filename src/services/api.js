export const API_BASE = import.meta.env.API_URL || "https://dea.mabcontrol.ar";

export async function createPlanillaMultipart(meta, files = []) {
  const fd = new FormData();
  fd.append("planilla", JSON.stringify(meta));
  for (const f of files) fd.append("images", f);
  const res = await fetch(`${API_BASE}/planillas`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export async function updatePlanillaMultipart(id, meta, files = []) {
  const fd = new FormData();
  fd.append("planilla", JSON.stringify(meta));
  for (const f of files) fd.append("images", f);

  const res = await fetch(`${API_BASE}/planillas/${id}`, {
    method: "PUT",
    body: fd,
  });

  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export async function deletePlanilla(id) {
  const res = await fetch(`${API_BASE}/planillas/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export async function listPlanillas() {
  const res = await fetch(`${API_BASE}/planillas`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

export async function deleteFile(filename) {
  // Se agregó el objeto de opciones para el método
  const res = await fetch(`${API_BASE}/uploads/${filename}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    // Es una buena práctica también intentar leer el error del body si lo hay
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(`HTTP ${res.status}: ${errorBody.error || res.statusText}`);
  }

  return res.json();
}
