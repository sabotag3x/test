const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.json());

async function getRatedFilms(username, minStars = 4) {
  let page = 1;
  let films = [];

  while (true) {
    const url = `https://letterboxd.com/${username}/films/ratings/page/${page}/`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(res.data);
    const posters = $("li.poster-container");

    if (posters.length === 0) break;

    posters.each((_, el) => {
      const title = $(el).find("img").attr("alt");
      const ratingText = $(el).find("span.rating").text();
      const stars =
        ratingText.split("★").length - 1 +
        (ratingText.includes("½") ? 0.5 : 0);

      if (stars >= minStars) {
        films.push(title);
      }
    });

    page++;
  }

  return films;
}

app.post("/api/films", async (req, res) => {
  const { username } = req.body;

  try {
    const films = await getRatedFilms(username);

    if (films.length < 2) {
      return res.status(400).json({ error: "Poucos filmes encontrados." });
    }

    res.json({ films });
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar filmes." });
  }
});

app.listen(3000, () =>
  console.log("Servidor rodando em http://localhost:3000")
);
