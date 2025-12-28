const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

app.get("/api/films", async (req, res) => {
  try {
    const response = await axios.get("https://www.imdb.com/chart/top/", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(response.data);
    const films = [];

    $("li.ipc-metadata-list-summary-item").each((_, el) => {
      const titleEl = $(el).find("h3.ipc-title__text");
      const yearEl = $(el).find("span.ipc-metadata-list-summary-item__li");
      const posterEl = $(el).find("img");

      if (!titleEl.length || !posterEl.length) return;

      const title = titleEl.text().replace(/^\d+\.\s*/, "").trim();
      const year = yearEl.first().text().trim();
      let poster = posterEl.attr("src");

      if (poster && poster.startsWith("/")) {
        poster = "https://www.imdb.com" + poster;
      }

      films.push({ title, year, poster });
    });

    const selected = shuffle(films).slice(0, 16);

    res.json({ films: selected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar Top 250 do IMDb." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
