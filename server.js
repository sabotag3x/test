const express = require("express");
const path = require("path");

const TMDB_TOKEN = process.env.TMDB_TOKEN;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ================= LETTERBOXD: SÓ LISTA ================= */

app.get("/api/letterboxd/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
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
        const m = item.match(/data-item-full-display-name="([^"]+)"/);
        if (!m) continue;

        const raw = m[1];
        const y = raw.match(/\((\d{4})\)/);

        movies.push({
          title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
          year: y ? y[1] : ""
        });
      }

      page++;
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= TMDb: ON-DEMAND ================= */

app.post("/api/tmdb-batch", async (req, res) => {
  const { films, lang } = req.body;
  const results = [];

  try {
    for (const f of films) {
      const q = encodeURIComponent(f.title);

      const url =
        `https://api.themoviedb.org/3/search/movie` +
        `?query=${q}&year=${f.year}&language=${lang}`;

      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          "Content-Type": "application/json;charset=utf-8"
        }
      });

      const j = await r.json();
      const movie = j.results && j.results[0];

      results.push({
        title: movie?.title || f.title,
        year: f.year,
        poster: movie?.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Letterboxd Battle (TMDb on-demand) rodando");
});
