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

    $("td.titleColumn a").each((_, el) => {
      const title = $(el).text().trim();
      if (title) films.push(title);
    });

    if (films.length === 0) {
      return res.status(500).json({ error: "Lista vazia." });
    }

    res.json({ films });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Falha ao buscar Top 250." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
