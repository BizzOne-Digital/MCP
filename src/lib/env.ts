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
};
