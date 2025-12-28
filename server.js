const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.static("."));
app.use(express.json());

async function getRatedFilms(username) {
  let page = 1;
  let films = [];

  while (true) {
    const url = `https://letterboxd.com/ajax/username/${username}/films/ratings/?page=${page}`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const items = res.data?.items;
    if (!items || items.length === 0) break;

    for (const item of items) {
      if (item.film && item.film.name) {
        films.push(item.film.name);
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar filmes." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
