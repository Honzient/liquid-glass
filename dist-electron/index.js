"use strict";
const electron = require("electron");
const path = require("node:path");
function createWindow() {
  const win = new electron.BrowserWindow({
    width: 1024,
    height: 600,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(createWindow);
electron.app.on("window-all-closed", () => {
  electron.app.quit();
});
