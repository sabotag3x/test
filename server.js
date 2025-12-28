const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));

app.get("/api/films", async (req, res) => {
  try {
    const listUrl =
      "https://letterboxd.com/sabotag3x/list/1-year-1-movie/";

    const response = await axios.get(listUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(response.data);
    const films = [];

    $("li.poster-container").each((_, el) => {
      const posterEl = $(el).find("img");
      const linkEl = $(el).find("a");

      if (!posterEl.length || !linkEl.length) return;

      const title = posterEl.attr("alt") || "";
      const poster =
        posterEl.attr("src") ||
        posterEl.attr("data-src") ||
        posterEl.attr("data-srcset")?.split(",")[0]?.split(" ")[0] ||
        "";

      // tenta pegar o ano do texto próximo
      const metaText = $(el).text();
      const yearMatch = metaText.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : "";

      films.push({ title, year, poster });
    });

    res.setHeader("Cache-Control", "no-store");
    res.json({ films });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar lista do Letterboxd" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
