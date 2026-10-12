function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const env = {
  mongodbUri: () => required("MONGODB_URI"),
  mcpDbName: () => process.env.MCP_DB_NAME ?? "master_control_panel",
  mcpPassword: () => required("MCP_PASSWORD"),
  authSecret: () => required("AUTH_SECRET"),
  smtp: () => ({
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? "587"),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@merchantorders.com",
  }),
};
