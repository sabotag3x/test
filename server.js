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

/* ================= LETTERBOXD ================= */

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
      if (!items) break;

      for (const item of items) {
        const m = item.match(/data-item-full-display-name="([^"]+)"/);
        if (!m) continue;

        const raw = m[1];
        const y = raw.match(/\((\d{4})\)/);

        movies.push({
          title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
          year: y ? parseInt(y[1]) : null
        });
      }

      page++;
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= TMDb ROBUSTO ================= */

app.post("/api/tmdb-batch", async (req, res) => {
  const { films, lang } = req.body;
  const results = [];

  try {
    for (const f of films) {
      const url =
        `https://api.themoviedb.org/3/search/movie` +
        `?query=${encodeURIComponent(f.title)}` +
        `&language=${lang || "pt-BR"}`;

      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${TMDB_TOKEN}`,
          Accept: "application/json"
        }
      });

      const j = await r.json();
      let match = null;

      if (j.results && j.results.length) {
        match = j.results.find(r => {
          if (!r.poster_path || !r.release_date) return false;
          const y = parseInt(r.release_date.slice(0, 4));
          return f.year ? Math.abs(y - f.year) <= 1 : true;
        });
      }

      results.push({
        title: match?.title || f.title,
        year: f.year || "",
        poster: match?.poster_path
          ? `https://image.tmdb.org/t/p/w500${match.poster_path}`
          : null
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("FilmDuel backend OK");
});
