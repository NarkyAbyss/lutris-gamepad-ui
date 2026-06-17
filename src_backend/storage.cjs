const fs = require("node:fs");
const path = require("node:path");

const { app } = require("electron");

function initializeSessionData(customSessionDataPath) {
  fs.mkdirSync(customSessionDataPath, { recursive: true });
  app.setPath('sessionData', customSessionDataPath);
}

function migrateData(newPath) {
    const oldPath = path.join(app.getPath("home"), ".local", "lutris-gamepad-ui");

    if (!fs.existsSync(oldPath)) {
        console.log("No old data found to migrate.");
        return;
    }
    if (fs.existsSync(newPath)) {
        console.log("Data already exists at the new location. Skipping migration to prevent overwriting.");
        return;
    }

    try {
        // fs.renameSync works across the same drive. 
        // If moving across different mount points/drives, use a copy-and-delete fallback.
        try {
            fs.renameSync(oldPath, newPath);
            console.log("Data successfully migrated to:", newPath);
        } catch (renameSyncError) {
            // Fallback for cross-device link errors (EXDEV)
            if (renameSyncError.code === 'EXDEV') {
                fs.cpSync(oldPath, newPath, { recursive: true });
                fs.rmSync(oldPath, { recursive: true, force: true });
                console.log("Data successfully migrated via copy/delete fallback to:", newPath);
            } else {
                throw renameSyncError;
            }
        }
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

function getAppHomeDir() {
  const result = path.join(app.getPath("appData"), "lutris-gamepad-ui");
  fs.mkdirSync(result, { recursive: true });
  migrateData(result);
  return result;
}

module.exports = {
  initializeSessionData,
  
  getThemeFilePath: () => {
    return path.join(getAppHomeDir(), "theme.json");
  },

  getDefaultThemeFilePath: () => {
    return path.join(getAppHomeDir(), "theme.default.json");
  },

  getLogFilePath: () => {
    return path.join(getAppHomeDir(), "logs.txt");
  },

  getKvStorageFilePath: () => {
    return path.join(getAppHomeDir(), "config.json");
  },

  generateBugReportFilePath: () => {
    const filename = `bugreport-${new Date().toISOString()}.tar`;
    return path.join(getAppHomeDir(), filename);
  },
};
