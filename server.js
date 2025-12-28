const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));

app.get("/api/films", async (req, res) => {
  try {
    const listUrl =
      req.query.url ||
      "https://letterboxd.com/sabotag3x/list/1-year-1-movie/";

    const films = [];
    let page = 1;

    while (true) {
      const url = page === 1 ? listUrl : `${listUrl}page/${page}/`;

      const r = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const $ = cheerio.load(r.data);
      const posters = $("li.poster-container");

      if (posters.length === 0) break;

      posters.each((_, el) => {
        const img = $(el).find("img");
        const title = img.attr("alt") || "";

        const poster =
          img.attr("src") ||
          img.attr("data-src") ||
          img.attr("data-srcset")?.split(",")[0]?.split(" ")[0] ||
          "";

        films.push({
          title,
          year: "",
          poster
        });
      });

      page++;
      if (page > 10) break; // segurança
    }

    res.json({ films });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar lista" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Servidor rodando em http://localhost:" + PORT)
);
