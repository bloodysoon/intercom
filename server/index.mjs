// @ts-check
/**
 * Production / on-set server: serves the Next.js app and the WebSocket relay
 * on one port, so the tablet and the operator laptop only need one address.
 *
 *   npm run dev     → development (hot reload)
 *   npm run start   → production (after `npm run build`)
 *
 * HTTPS: cameras only work in a secure context. Put `key.pem` and `cert.pem`
 * in ./certs (see README → "HTTPS on the local network") or set HTTPS_KEY /
 * HTTPS_CERT. Set HTTPS=0 to force plain HTTP.
 */
import { existsSync, readFileSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { networkInterfaces } from "node:os";
import path from "node:path";
import next from "next";
import { createRelay } from "./relay.mjs";

const dev = process.argv.includes("--dev");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

function loadCert() {
  if (process.env.HTTPS === "0") return null;
  const keyPath = process.env.HTTPS_KEY ?? path.join("certs", "key.pem");
  const certPath = process.env.HTTPS_CERT ?? path.join("certs", "cert.pem");
  if (!existsSync(keyPath) || !existsSync(certPath)) return null;
  return { key: readFileSync(keyPath), cert: readFileSync(certPath) };
}

const tls = loadCert();
const server = tls ? createHttpsServer(tls) : createHttpServer();
const app = next({ dev, hostname: "localhost", port, httpServer: server });
const relay = createRelay({ log: (m) => console.log(`[relay] ${m}`) });

await app.prepare();
const handle = app.getRequestHandler();
const upgradeNext = app.getUpgradeHandler();

server.on("request", (req, res) => {
  handle(req, res);
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname === "/ws") relay.handleUpgrade(req, socket, head);
  else upgradeNext(req, socket, head);
});

server.listen(port, host, () => {
  const scheme = tls ? "https" : "http";
  const addrs = Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === "IPv4" && !a.internal)
    .map((a) => a?.address);
  console.log(`\n  Dochița intercom (${dev ? "development" : "production"})`);
  console.log(`  ─ Local:     ${scheme}://localhost:${port}`);
  for (const a of addrs) {
    console.log(`  ─ Tablet:    ${scheme}://${a}:${port}/`);
    console.log(`  ─ Operator:  ${scheme}://${a}:${port}/control`);
  }
  if (!tls) {
    console.log("\n  ⚠  Plain HTTP: the tablet camera only works on https:// or localhost.");
    console.log("     Run `npm run cert` to create a local certificate (see README).");
  }
  console.log("");
});

const shutdown = () => {
  relay.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
