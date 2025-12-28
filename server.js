const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= IMDb (HTML puro, best effort) ================= */

app.get("/api/imdb/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;

  try {
    for (let page = 1; page <= 10; page++) {
      const url =
        `https://www.imdb.com/user/${user}/ratings` +
        `?sort=date_added,desc&page=${page}`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = await r.text();
      const blocks = html.split("ipc-metadata-list-summary-item");
      if (blocks.length <= 1) break;

      for (const block of blocks.slice(1)) {
        const t = block.match(/ipc-title__text">([^<]+)/);
        if (!t) continue;

        const y = block.match(/\b(19|20)\d{2}\b/);

        movies.push({
          index,
          title: t[1].trim(),
          year: y ? y[0] : ""
        });
        index++;
      }

      await new Promise(r => setTimeout(r, 500));
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ================= Letterboxd (HTML puro real) ================= */

app.get("/api/letterboxd/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;
  let page = 1;

  try {
    while (true) {
      const url =
        page === 1
          ? `https://letterboxd.com/${user}/films/`
          : `https://letterboxd.com/${user}/films/page/${page}/`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9",
          "Referer": `https://letterboxd.com/${user}/`
        }
      });

      const html = await r.text();

      const frames = html.match(/<a[^>]+class="frame[^"]*"[\s\S]*?<\/a>/g);
      if (!frames || frames.length === 0) break;

      for (const f of frames) {
        const titleMatch =
          f.match(/data-original-title="([^"]+)"/) ||
          f.match(/<span class="frame-title">([^<]+)<\/span>/);

        if (!titleMatch) continue;

        const raw = titleMatch[1]; // "A Trip to the Moon (1902)"
        const yearMatch = raw.match(/\((\d{4})\)/);

        movies.push({
          index,
          title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
          year: yearMatch ? yearMatch[1] : ""
        });

        index++;
      }

      page++;
      await new Promise(r => setTimeout(r, 300));
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb + Letterboxd HTML scraper rodando");
});
