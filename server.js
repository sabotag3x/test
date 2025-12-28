const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* pasta de arquivos públicos */
app.use(express.static(path.join(__dirname, "public")));

/* rota raiz garantida */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* API IMDb */
app.get("/api/imdb/:user", async (req, res) => {
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

      const blocks = html.split("ipc-metadata-list-summary-item");
      if (blocks.length <= 1) break;

      blocks.slice(1).forEach(block => {
        const title = block.match(/ipc-title__text">([^<]+)/);
        const year  = block.match(/\((\d{4})\)/);

        if (title) {
          movies.push({
            title: title[1].trim(),
            year: year ? year[1] : ""
          });
        }
      });

      page++;
    }

    res.json(movies);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar IMDb" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("App IMDb rodando na porta", PORT);
});
