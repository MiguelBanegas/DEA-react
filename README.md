# DEA React Prototype (Vite)

Minimal React + Vite prototype to test offline planilla saving and synchronization with the `api/` server.

Install & run

```powershell
cd C:\Users\pc\Documents\DEA\app
npm install
npm run dev
```

Open http://localhost:5173 and test uploading a planilla. The app stores planillas in IndexedDB and will POST to `http://localhost:3001/planillas` when online.
