const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || "demo-secret-2026";

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${key}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const d = await r.json();
  if (!d.result) return null;
  let val = d.result;
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  if (typeof val === "string") { try { val = JSON.parse(val); } catch {} }
  return val;
}

async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(JSON.stringify(value))
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { action, username, password } = req.body || {};

    if (action === "login") {
      // Usuario demo hardcodeado
      const DEMO_USERS = [
        { username: "demo", password: "finanzas6891" },
        { username: "demo2", password: "finanzas6891" },
      ];
      const user = DEMO_USERS.find(u => u.username === username);
      if (!user) return res.status(401).json({ error: "Usuario incorrecto" });
      if (user.password !== password) return res.status(401).json({ error: "Contraseña incorrecta" });
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "24h" });
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