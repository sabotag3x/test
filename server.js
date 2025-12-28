const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PAGE_SIZE = 250;
const MAX_ITEMS = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/imdb/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;

  try {
    for (let start = 0; start < MAX_ITEMS; start += PAGE_SIZE) {
      const url =
        `https://www.imdb.com/user/${user}/ratings/_ajax` +
        `?start=${start}&count=${PAGE_SIZE}&sort=date_added,desc`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      const html = await r.text();

      if (!html || html.length < 500) break;

      const blocks = html.split("ipc-metadata-list-summary-item");
      if (blocks.length <= 1) break;

      for (const block of blocks.slice(1)) {
        // excluir séries (2019–2023)
        if (/\d{4}\s*–\s*\d{4}/.test(block)) continue;

        const titleMatch = block.match(/ipc-title__text">([^<]+)/);
        if (!titleMatch) continue;

        const title = titleMatch[1].trim();
        const yearMatch = block.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? yearMatch[0] : "";

        movies.push({
          index,
          title,
          year
        });

        index++;
      }

      if (blocks.length - 1 < PAGE_SIZE) break;
    }

    res.json(movies);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar IMDb" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb extractor REAL rodando");
});
