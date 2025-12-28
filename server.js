const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

/* rota raiz */
app.get("/", (req, res) => {
  res.send("IMDb JSON API online");
});

/* endpoint que retorna JSON limpo */
app.get("/imdb/:user", async (req, res) => {
  const user = req.params.user;
  let page = 1;
  let movies = [];

  try {
    while (true) {
      const url = `https://www.imdb.com/user/${user}/ratings?sort=date_added,desc&page=${page}`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = await r.text();

      // parse simples sem DOM pesado
      const blocks = html.split('ipc-metadata-list-summary-item');

      if (blocks.length <= 1) break;

      blocks.slice(1).forEach(block => {
        const titleMatch = block.match(/ipc-title__text">([^<]+)/);
        const yearMatch  = block.match(/\((\d{4})\)/);

        if (titleMatch) {
          movies.push({
            title: titleMatch[1].trim(),
            year: yearMatch ? yearMatch[1] : ""
          });
        }
      });

      page++;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(movies);

  } catch (err) {
    res.status(500).json({ error: "Falha ao extrair dados do IMDb" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb JSON API ativa");
});
