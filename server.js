const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ================= IMDb ================= */

app.get("/api/imdb/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;
  const startTime = Date.now();

  try {
    for (let page = 1; page <= 50; page++) {
      if (Date.now() - startTime > 10000) break;

      const url =
        `https://www.imdb.com/user/${user}/ratings` +
        `?sort=date_added,desc&page=${page}`;

      const html = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }).then(r => r.text());

      const blocks = html.split("ipc-metadata-list-summary-item");
      if (blocks.length <= 1) break;

      for (const b of blocks.slice(1)) {
        const t = b.match(/ipc-title__text">([^<]+)/);
        if (!t) continue;

        const y = b.match(/\b(19|20)\d{2}\b/);

        movies.push({
          index,
          title: t[1].trim(),
          year: y ? y[0] : ""
        });

        index++;
      }
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= Letterboxd ================= */

app.get("/api/letterboxd/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;
  let page = 1;
  const startTime = Date.now();

  try {
    while (true) {
      if (Date.now() - startTime > 10000) break;

      const url = `https://letterboxd.com/${user}/films/page/${page}/`;

      const html = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }).then(r => r.text());

      const blocks = html.split('class="frame"');
      if (blocks.length <= 1) break;

      for (const b of blocks.slice(1)) {
        const t =
          b.match(/data-original-title="([^"]+)"/) ||
          b.match(/frame-title">([^<]+)/);

        if (!t) continue;

        const raw = t[1];
        const y = raw.match(/\((\d{4})\)/);

        movies.push({
          index,
          title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
          year: y ? y[1] : ""
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
  console.log("IMDb + Letterboxd scraper (10s timeout) rodando");
});
