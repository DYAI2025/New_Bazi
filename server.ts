import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { createApp } from "./src/server/app";
import { getViteAllowedHosts, shouldServeProductionAssets } from "./src/server/runtime";

dotenv.config();

async function startServer() {
  const app = createApp();
  const PORT = Number(process.env.PORT || 3000);

  // Static / dev middleware AFTER the same-origin /api routes.
  if (!shouldServeProductionAssets()) {
    // vite is dev-only: imported dynamically so the production container never loads it.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        allowedHosts: getViteAllowedHosts(),
        middlewareMode: true
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const indexPath = path.join(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Production assets are missing at ${indexPath}. Run npm run build before starting the server.`);
    }
    const express = (await import("express")).default;
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bazodiac BFF] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
