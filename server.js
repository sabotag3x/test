const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));

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
      const posterEl = $(el).find("img");
      if (!titleEl.length || !posterEl.length) return;

      const title = titleEl.text().replace(/^\d+\.\s*/, "").trim();

      const yearEl = $(el)
        .find("span.ipc-metadata-list-summary-item__li")
        .filter((_, s) => /^\d{4}$/.test($(s).text()))
        .first();
      const year = yearEl.length ? yearEl.text() : "";

      let poster =
        posterEl.attr("srcset")?.split(",").pop()?.trim().split(" ")[0] ||
        posterEl.attr("src") ||
        "";
      if (poster.startsWith("/")) poster = "https://www.imdb.com" + poster;

      films.push({ title, year, poster });
    });

    res.json({ films });
  } catch {
    res.status(500).json({ error: "Erro" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
