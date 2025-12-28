const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* CONFIG */
const MAX_PAGES = 10; // 10 x 250 = 2500 filmes (ajuste se quiser)
const cache = {}; // cache em memória por usuário

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* API IMDb otimizada */
app.get("/api/imdb/:user", async (req, res) => {
  const user = req.params.user;

  if (cache[user]) {
    return res.json(cache[user]);
  }

  try {
    const requests = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `https://www.imdb.com/user/${user}/ratings?sort=date_added,desc&page=${page}`;

      requests.push(
        fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "en-US,en;q=0.9"
          }
        }).then(r => r.text())
      );
    }

    const pages = await Promise.all(requests);
    const movies = [];

    pages.forEach(html => {
      const blocks = html.split("ipc-metadata-list-summary-item");
      if (blocks.length <= 1) return;

      blocks.slice(1).forEach(block => {
        const titleMatch = block.match(/ipc-title__text">([^<]+)/);
        const yearMatch  = block.match(/\((\d{4})\)/);

        if (!titleMatch || !yearMatch) return;

        const title = titleMatch[1].trim();
        const year  = yearMatch[1];

        // EXCLUI SÉRIES (ano com intervalo)
        if (block.match(/\d{4}–/)) return;

        movies.push({ title, year });
      });
    });

    cache[user] = movies;
    res.json(movies);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados do IMDb" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb app otimizado rodando");
});
