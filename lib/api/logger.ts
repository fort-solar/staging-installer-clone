const PREFIX = "[fortsolar-installer]";

function log(level: "debug" | "info" | "warn" | "error", message: string, meta?: unknown) {
  if (process.env.NODE_ENV === "production" && level === "debug") {
    return;
  }

  const method = console[level] ?? console.log;

  if (meta === undefined) {
    method(`${PREFIX} ${message}`);
    return;
  }

  method(`${PREFIX} ${message}`, meta);
}

export const appLogger = {
  debug(message: string, meta?: unknown) {
    log("debug", message, meta);
  },
  info(message: string, meta?: unknown) {
    log("info", message, meta);
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta);
  },
  error(message: string, meta?: unknown) {
    log("error", message, meta);
  },
};
