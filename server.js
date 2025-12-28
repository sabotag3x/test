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
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");

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
      const posterEl = $(el).find("img");
      const yearEl = $(el)
        .find("span.ipc-metadata-list-summary-item__li")
        .filter((_, s) => /^\d{4}$/.test($(s).text()))
        .first();

      if (!titleEl.length || !posterEl.length) return;

      const title = titleEl.text().replace(/^\d+\.\s*/, "").trim();
      const year = yearEl.length ? yearEl.text() : "";

      let poster = posterEl.attr("src") || "";
      if (poster.startsWith("/")) poster = "https://www.imdb.com" + poster;

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
