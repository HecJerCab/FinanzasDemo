const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const KV_URL = "https://outgoing-thrush-93550.upstash.io";
const KV_TOKEN = "gQAAAAAAAW1uAAIncDJiNTc3ODZlMDkxNWM0YzRkYjJiY2UyZTg0YjY3NDAwZXAyOTM1NTA";

const USERS = [
  { username: "Jere-1", password: "Conejososxsiempre13" },
  { username: "Lulu-1", password: "Conejososxsiempre13" },
];

function generateSecret() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  const bytes = crypto.randomBytes(16);
  for (let i = 0; i < 16; i++) secret += chars[bytes[i] % 32];
  return secret;
}

function getOtpUrl(username, secret) {
  return `otpauth://totp/FinanzasApp:${username}?secret=${secret}&issuer=FinanzasApp`;
}

async function kvSet(key, value) {
  const r = await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(value))
  });
  return r.json();
}

async function main() {
  console.log("Creando usuarios...");
  const usersToStore = [];

  for (const u of USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const totpSecret = generateSecret();
    const otpUrl = getOtpUrl(u.username, totpSecret);
    usersToStore.push({ username: u.username, password: hashed, totpSecret });
    console.log(`\n✓ Usuario: ${u.username}`);
    console.log(`  Secret TOTP: ${totpSecret}`);
    console.log(`  QR para escanear:`);
    console.log(`  https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpUrl)}`);
  }

  await kvSet("users", usersToStore);
  console.log("\n✅ Usuarios guardados en Redis correctamente.");
}

main().catch(console.error);