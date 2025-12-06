const API_BASE = import.meta.env.API_URL || "https://dea.mabcontrol.ar";

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

export async function listPlanillas() {
  const res = await fetch(`${API_BASE}/planillas`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
