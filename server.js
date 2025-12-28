const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

/* Serve o index.html e arquivos estáticos */
app.use(express.static("."));
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
        (ratingText.match(/★/g) || []).length +
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

  if (!username) {
    return res.status(400).json({ error: "Username não informado." });
  }

  try {
    const films = await getRatedFilms(username);

    if (films.length < 2) {
      return res.status(400).json({ error: "Poucos filmes encontrados." });
    }

    res.json({ films });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar filmes." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
