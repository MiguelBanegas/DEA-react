const API_BASE = import.meta.env.VITE_API_URL || "http://0.0.0.0:3001";

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

export async function listPlanillas() {
  const res = await fetch(`${API_BASE}/planillas`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}
