const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "finanzas-secret-2026";

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const d = await r.json();
  if (!d.result) return null;
  let val = d.result;
  // Desempaquetar doble stringify si es necesario
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  return val;
}

function base32Decode(str) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0;
  const output = [];
  for (const c of str.toUpperCase().replace(/=+$/, "")) {
    value = (value << 5) | chars.indexOf(c);
    bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(output);
}

function verifyTOTP(token, secret) {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / 30);
  for (const t of [time - 1, time, time + 1]) {
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(t / 0x100000000), 0);
    buf.writeUInt32BE(t & 0xffffffff, 4);
    const hmac = crypto.createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset+1] << 16 | hmac[offset+2] << 8 | hmac[offset+3]) % 1000000;
    if (code === parseInt(token, 10)) return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { action, username, password, totpCode } = req.body || {};

    if (action === "login") {
      const users = await kvGet("users");
      if (!users) return res.status(401).json({ error: "No hay usuarios configurados" });
      const user = users.find(u => u.username === username);
      if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      const validPass = await bcrypt.compare(password, user.password);
      if (!validPass) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
      const validTotp = verifyTOTP(totpCode, user.totpSecret);
      if (!validTotp) return res.status(401).json({ error: "Código de autenticador incorrecto" });
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
      return res.json({ success: true, token, username });
    }

    if (action === "verify") {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: "Sin token" });
      try {
        const decoded = jwt.verify(authHeader.replace("Bearer ", ""), JWT_SECRET);
        return res.json({ success: true, username: decoded.username });
      } catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
      }
    }

    res.status(400).json({ error: "Acción inválida" });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};