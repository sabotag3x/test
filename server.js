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

/* ================= USER (LETTERBOXD) ================= */

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

/* ================= LISTAS LOCAIS (FILMES) ================= */

app.get("/api/list/:key", (req, res) => {
  try {
    const file = path.join(__dirname, "data", `${req.params.key}.json`);
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    res.json(json.films);
  } catch {
    res.status(404).json({ error: "Lista não encontrada" });
  }
});

/* ================= SCRAPER MANUAL (ADMIN FILMES) ================= */

app.get("/api/list", async (req, res) => {
  const listUrl = req.query.url;
  if (!listUrl) return res.status(400).json([]);

  try {
    const films = [];
    let page = 1;
    const MAX_PAGES = 20;

    while (page <= MAX_PAGES) {
      const url = `${listUrl}page/${page}/`;
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
    res.json(enriched);
  } catch {
    res.status(500).json([]);
  }
});

/* ================= MUSIC API ================= */

app.get("/api/music/artist", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: "missing name" });

  try {
    const url =
      "https://musicbrainz.org/ws/2/artist" +
      `?query=${encodeURIComponent(name)}` +
      "&fmt=json&limit=1";

    const r = await fetch(url, {
      headers: {
        "User-Agent": "MusicDuel/1.0 ( contact@example.com )"
      }
    });

    const j = await r.json();
    const a = j.artists?.[0];
    if (!a) return res.json(null);

    res.json({
      name: a.name,
      country: a.country || null,
      type: a.type || null,
      id: a.id
    });
  } catch {
    res.status(500).json(null);
  }
});

app.get("/api/music/artist-with-album", async (req, res) => {
  const name = req.query.name;
  if (!name) return res.json(null);

  try {
    const artistRes = await fetch(
      `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(name)}&fmt=json&limit=1`,
      { headers: { "User-Agent": "MusicDuel/1.0" } }
    );

    const artistJson = await artistRes.json();
    const artist = artistJson.artists?.[0];
    if (!artist) return res.json(null);

    const relRes = await fetch(
      `https://musicbrainz.org/ws/2/release-group?artist=${artist.id}&type=album&limit=5&fmt=json`,
      { headers: { "User-Agent": "MusicDuel/1.0" } }
    );

    const relJson = await relRes.json();
    const album = relJson["release-groups"]?.[0];

    const cover = album
      ? `https://coverartarchive.org/release-group/${album.id}/front-250`
      : null;

    res.json({
      name: artist.name,
      id: artist.id,
      country: artist.country || null,
      type: artist.type || null,
      album: album
        ? {
            title: album.title,
            year: album["first-release-date"]?.slice(0, 4) || null,
            cover
          }
        : null
    });
  } catch {
    res.json(null);
  }
});

/* ================= MUSIC LISTAS LOCAIS ================= */

app.get("/api/music/list/:key", (req, res) => {
  try {
    const file = path.join(__dirname, "data/music", `${req.params.key}.json`);
    res.json(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    res.status(404).json({ error: "Lista não encontrada" });
  }
});

/* ================= START ================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("FilmDuel rodando na porta", PORT);
});

