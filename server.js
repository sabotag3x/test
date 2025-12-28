const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));
app.use(express.json());

async function getRatedFilms(username) {
  let page = 1;
  let films = [];

  while (true) {
    const url =
      page === 1
        ? `https://letterboxd.com/${username}/films/ratings/`
        : `https://letterboxd.com/${username}/films/ratings/page/${page}/`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(res.data);

    const jsonLd = $('script[type="application/ld+json"]').html();
    if (!jsonLd) break;

    const data = JSON.parse(jsonLd);
    if (!data.itemListElement || data.itemListElement.length === 0) break;

    for (const item of data.itemListElement) {
      if (item.item && item.item.name) {
        films.push(item.item.name);
      }
    }

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
    if (films.length === 0) {
      return res.status(400).json({ error: "Nenhum filme encontrado." });
    }
    res.json({ films });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar filmes." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
