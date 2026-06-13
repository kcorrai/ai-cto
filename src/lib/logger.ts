type Level = "info" | "warn" | "error";
type Context = Record<string, unknown>;

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function emit(level: Level, message: string, context?: Context): void {
  if (process.env.NODE_ENV === "production") {
    const entry: Record<string, unknown> = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    console[level](JSON.stringify(entry));
  } else {
    const ts = new Date().toISOString();
    const prefix = `[${level.toUpperCase()}] ${ts}`;
    if (context && Object.keys(context).length > 0) {
      console[level](prefix, "—", message, context);
    } else {
      console[level](prefix, "—", message);
    }
  }
}

export const logger = {
  info: (message: string, context?: Context) => emit("info", message, context),
  warn: (message: string, context?: Context) => emit("warn", message, context),
  error: (message: string, context?: Context) => emit("error", message, context),
  /** Convenience: extract .message from an unknown thrown value before logging. */
  errorFrom: (message: string, err: unknown, context?: Context) =>
    emit("error", message, { ...context, error: errMsg(err) }),
};
