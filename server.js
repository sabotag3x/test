import express from "express";
import fetch from "node-fetch";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_TOKEN;

const __dirname = new URL(".", import.meta.url).pathname;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= CACHE ================= */

const cache = new Map();

/* ================= HELPERS ================= */

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

    const match = j.results?.find(r => {
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

/* ================= LETTERBOXD USER ================= */

app.get("/api/user/:user", async (req, res) => {
  const user = req.params.user.toLowerCase();
  const key = `user:${user}`;

  if (cache.has(key)) return res.json(cache.get(key));

  const films = [];
  let page = 1;

  while (true) {
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

/* ================= LETTERBOXD LIST ================= */

app.get("/api/list", async (req, res) => {
  const url = req.query.url;
  const key = `list:${url}`;

  if (cache.has(key)) return res.json(cache.get(key));

  const films = [];
  let page = 1;

  while (true) {
    const pageUrl = `${url}page/${page}/`;
    const html = await fetch(pageUrl).then(r => r.text());

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

app.listen(PORT, () => console.log("FilmDuel OK"));
