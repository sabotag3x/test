const express = require("express");
const path = require("path");

const TMDB_KEY = process.env.TMDB_KEY;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

async function fetchFromTMDb(title, year, lang) {
  const q = encodeURIComponent(title);

  const searchUrl =
    `https://api.themoviedb.org/3/search/movie` +
    `?api_key=${TMDB_KEY}` +
    `&query=${q}` +
    `&year=${year}` +
    `&language=${lang}`;

  const r = await fetch(searchUrl);
  const j = await r.json();

  if (!j.results || j.results.length === 0) return null;

  const movie = j.results[0];

  return {
    title: movie.title,
    poster: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null
  };
}

/* ================= Letterboxd + TMDb ================= */

app.get("/api/letterboxd/:user", async (req, res) => {
  const user = req.params.user;
  const lang =
    req.headers["accept-language"]?.split(",")[0] || "en-US";

  const movies = [];
  let index = 1;
  let page = 1;

  try {
    while (true) {
      const url = `https://letterboxd.com/${user}/films/page/${page}/`;

      const html = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }).then(r => r.text());

      const items = html.match(/<li class="griditem">[\s\S]*?<\/li>/g);
      if (!items || items.length === 0) break;

      for (const item of items) {
        const t = item.match(/data-item-full-display-name="([^"]+)"/);
        if (!t) continue;

        const raw = t[1];
        const y = raw.match(/\((\d{4})\)/);

        const originalTitle =
          raw.replace(/\s*\(\d{4}\)/, "").trim();
        const year = y ? y[1] : "";

        const tmdb = await fetchFromTMDb(
          originalTitle,
          year,
          lang
        );

        movies.push({
          index,
          title: tmdb?.title || originalTitle,
          year,
          poster: tmdb?.poster || null
        });

        index++;
      }

      page++;
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Letterboxd Battle + TMDb (localizado) rodando");
});
