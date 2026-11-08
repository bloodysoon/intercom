// @ts-check
/**
 * Standalone relay, for when the Next.js app is deployed to a serverless
 * platform (e.g. Vercel) that cannot hold WebSocket connections.
 *
 * Run it on any always-on host (VPS, Fly.io, Render, Railway, a laptop):
 *   PORT=8787 node server/relay-standalone.mjs
 * Then build the app with:
 *   NEXT_PUBLIC_SYNC_URL=wss://your-relay.example.com/ws
 */
import { createServer } from "node:http";
import { createRelay } from "./relay.mjs";

const port = Number(process.env.PORT ?? 8787);
const relay = createRelay({ log: (m) => console.log(`[relay] ${m}`) });

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, ...relay.presence() }));
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", "http://relay");
  if (pathname === "/ws") relay.handleUpgrade(req, socket, head);
  else socket.destroy();
});

server.listen(port, () => console.log(`[relay] listening on :${port}/ws`));
