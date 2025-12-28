const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));

app.get("/api/films", async (req, res) => {
  try {
    const url = "https://www.imdb.com/chart/top/";

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(response.data);
    const films = [];

    // IMDb ATUAL usa essa estrutura
    $("ul.ipc-metadata-list li h3.ipc-title__text").each((_, el) => {
      const text = $(el).text().trim();
      // remove "1. ", "2. ", etc
      const title = text.replace(/^\d+\.\s*/, "");
      if (title) films.push(title);
    });

    if (films.length === 0) {
      return res.status(500).json({ error: "Lista vazia." });
    }

    res.json({ films });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar Top 250 do IMDb." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
