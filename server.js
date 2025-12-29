const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= CACHE ================= */

const cache = new Map();

/* ================= TMDB ================= */

async function tmdbEnrich(films, lang = "pt-BR") {
  const enriched = [];

  for (const f of films) {
    const url =
      `https://api.themoviedb.org/3/search/movie` +
      `?query=${encodeURIComponent(f.title)}` +
      `&language=${lang}`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        Accept: "application/json"
      }
    });

    const j = await r.json();
    if (!j.results) continue;

    const match = j.results.find(r => {
      if (!r.poster_path || !r.release_date) return false;
      const y = parseInt(r.release_date.slice(0, 4));
      return f.year ? Math.abs(y - f.year) <= 1 : true;
    });

    if (!match) continue;

    enriched.push({
      title: match.title,
      year: match.release_date.slice(0, 4),
      poster: `https://image.tmdb.org/t/p/w500${match.poster_path}`
    });
  }

  return enriched;
}

/* ================= USER (SCRAPING CONTINUA) ================= */

app.get("/api/user/:user", async (req, res) => {
  const user = req.params.user.toLowerCase();
  const key = `user:${user}`;

  if (cache.has(key)) return res.json(cache.get(key));

  const films = [];
  let page = 1;

  while (page <= 20) {
    const url = `https://letterboxd.com/${user}/films/page/${page}/`;
    const html = await fetch(url).then(r => r.text());

    const items = html.match(/data-item-full-display-name="([^"]+)"/g);
    if (!items) break;

    for (const raw of items) {
      const m = raw.match(/="(.+?)"/)[1];
      const y = m.match(/\((\d{4})\)/);
      films.push({
        title: m.replace(/\s*\(\d{4}\)/, "").trim(),
        year: y ? parseInt(y[1]) : null
      });
    }

    page++;
  }

  const enriched = await tmdbEnrich(films);
  cache.set(key, enriched);
  res.json(enriched);
});

/* ================= LISTAS LOCAIS ================= */

app.get("/api/list/:key", (req, res) => {
  try {
    const key = req.params.key;
    const file = path.join(__dirname, "data", "lists.json");

    const raw = fs.readFileSync(file, "utf8");
    const db = JSON.parse(raw);

    if (!db[key]) {
      return res.status(404).json({ error: "Lista não encontrada" });
    }

    res.json(db[key].films);
  } catch (err) {
    console.error("ERRO LISTA:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ================= START ================= */


app.listen(PORT, "0.0.0.0", () => {
  console.log("FilmDuel rodando na porta", PORT);
});

