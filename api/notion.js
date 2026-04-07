export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,Notion-Version");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  try {
    const pathParts = req.query.path;
    const path = Array.isArray(pathParts) ? pathParts.join("/") : (pathParts || "");
    const url = `https://api.notion.com/v1/${decodeURIComponent(path)}`;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": req.headers.authorization || "",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: ["GET","HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}