import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

console.log("[dev] building electron main...");

// Build main process
const build = spawn("npx", ["tsc", "-p", "tsconfig.main.json"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

build.on("close", (code) => {
  if (code !== 0) {
    console.error("[dev] main process build failed");
    process.exit(code);
  }

  console.log("[dev] starting vite + electron...");

  // Start Vite dev server
  const vite = spawn("npx", ["vite"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env },
  });

  // Wait for Vite to be ready, then start Electron
  setTimeout(() => {
    const electron = spawn("npx", ["electron", "."], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: "http://localhost:5173",
      },
    });

    electron.on("close", () => {
      vite.kill();
      process.exit(0);
    });
  }, 3000);
});
