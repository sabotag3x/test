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

$("li.ipc-metadata-list-summary-item").each((_, el) => {
  const titleEl = $(el).find("h3.ipc-title__text");
  const posterEl = $(el).find("img");

  if (!titleEl.length || !posterEl.length) return;

  const title = titleEl.text().replace(/^\d+\.\s*/, "").trim();

  // pega o ano (4 dígitos)
  const metaText = $(el).text();
  const yearMatch = metaText.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  const poster =
    posterEl.attr("srcset")?.split(",").pop()?.split(" ")[0] ||
    posterEl.attr("src");

  films.push({ title, year, poster });
});

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

