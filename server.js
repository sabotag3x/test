const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= IMDb (best effort) ================= */

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
      const found = blocks.length - 1;

      if (found <= 0) break;

      for (const block of blocks.slice(1)) {
        const titleMatch = block.match(/ipc-title__text">([^<]+)/);
        if (!titleMatch) continue;

        const title = titleMatch[1].trim();
        const yearMatch = block.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : "";

        movies.push({ index, title, year });
        index++;
      }

      await new Promise(r => setTimeout(r, 600));
    }

    res.json(movies);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= Letterboxd (estável) ================= */

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
          "User-Agent": "Mozilla/5.0"
        }
      });

      const html = await r.text();

      const posters = html.match(/data-film-name="[^"]+"/g);
      const years   = html.match(/data-film-release-year="\d{4}"/g);

      if (!posters || posters.length === 0) break;

      posters.forEach((p, i) => {
        const title = p.replace(/data-film-name=|"/g, "");
        const year  = years && years[i]
          ? years[i].replace(/data-film-release-year=|"/g, "")
          : "";

        movies.push({ index, title, year });
        index++;
      });

      page++;
      await new Promise(r => setTimeout(r, 300));
    }

    res.json(movies);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb + Letterboxd scraper rodando");
});
