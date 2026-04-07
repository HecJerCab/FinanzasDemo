module.exports = async function handler(req, res) {
  res.status(403).json({ error: "No permitido" });
};