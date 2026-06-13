const DEFAULT_RAILWAY_HOST = "newbazi-production.up.railway.app";

function normalizeHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return parsed.hostname || null;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").split("/")[0] || null;
  }
}

function addHost(hosts: string[], value: string | undefined): void {
  if (!value) return;
  const host = normalizeHost(value);
  if (host && !hosts.includes(host)) hosts.push(host);
}

function addDelimitedHosts(hosts: string[], value: string | undefined): void {
  if (!value) return;
  for (const item of value.split(",")) addHost(hosts, item);
}

export function getViteAllowedHosts(env: NodeJS.ProcessEnv = process.env): string[] {
  const hosts: string[] = [];

  addHost(hosts, DEFAULT_RAILWAY_HOST);
  addHost(hosts, env.RAILWAY_PUBLIC_DOMAIN);
  addHost(hosts, env.RAILWAY_STATIC_URL);
  addDelimitedHosts(hosts, env.VITE_ALLOWED_HOSTS);
  addDelimitedHosts(hosts, env.APP_ALLOWED_HOSTS);

  return hosts;
}

export function isRailwayRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.RAILWAY_ENVIRONMENT ||
    env.RAILWAY_ENVIRONMENT_NAME ||
    env.RAILWAY_PROJECT_ID ||
    env.RAILWAY_SERVICE_ID
  );
}

export function shouldServeProductionAssets(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production" || isRailwayRuntime(env);
}
