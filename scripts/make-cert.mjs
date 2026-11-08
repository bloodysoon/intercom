// @ts-check
/**
 * Creates a self-signed HTTPS certificate for the local network so the tablet
 * camera works (browsers only allow getUserMedia on https:// or localhost).
 *
 * Prefers `mkcert` (trusted, no warnings) when installed; otherwise falls back
 * to `openssl` (the tablet will show a one-time warning you must accept).
 *
 *   npm run cert
 */
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { networkInterfaces } from "node:os";

const ips = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4")
  .map((a) => /** @type {{address: string}} */ (a).address);
const names = ["localhost", ...new Set(ips)];
mkdirSync("certs", { recursive: true });

function has(cmd) {
  try {
    execFileSync(cmd, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    try {
      execFileSync(cmd, ["--version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

if (has("mkcert")) {
  execFileSync("mkcert", ["-key-file", "certs/key.pem", "-cert-file", "certs/cert.pem", ...names], { stdio: "inherit" });
  console.log("\n✓ Trusted certificate created with mkcert for:", names.join(", "));
  console.log("  To trust it on the tablet, install the mkcert root CA (`mkcert -CAROOT`) — see README.");
} else if (has("openssl")) {
  const san = names.map((n) => (/^\d+\.\d+\.\d+\.\d+$/.test(n) ? `IP:${n}` : `DNS:${n}`)).join(",");
  execFileSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-sha256", "-days", "825",
      "-keyout", "certs/key.pem", "-out", "certs/cert.pem",
      "-subj", "/CN=dochita.local",
      "-addext", `subjectAltName=${san}`,
    ],
    { stdio: "inherit" },
  );
  console.log("\n✓ Self-signed certificate created for:", names.join(", "));
  console.log("  The tablet will warn once — choose “Advanced → Proceed”.");
} else {
  console.error("Neither mkcert nor openssl found. Install one of them (see README).");
  process.exit(1);
}
