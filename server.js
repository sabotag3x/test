const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const MAX_PAGES = 10; // força várias páginas mesmo sem garantia

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/imdb/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url =
        `https://www.imdb.com/user/${user}/ratings` +
        `?sort=date_added,desc&count=250&page=${page}`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = await r.text();

      const blocks = html.split("ipc-metadata-list-summary-item");

      // se não veio nada novo, continua mesmo assim
      if (blocks.length <= 1) continue;

      for (const block of blocks.slice(1)) {
        // NÃO exclui séries aqui (igual ao código antigo)
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
    }

    res.json(movies);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar IMDb" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb extractor (versão ~700) rodando");
});
