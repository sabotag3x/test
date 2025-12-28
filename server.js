const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(express.static("."));
app.use(express.json());

async function getImdbTop250() {
  const url = "https://www.imdb.com/chart/top/";

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  const $ = cheerio.load(res.data);
  const films = [];

  $("td.titleColumn a").each((_, el) => {
    const title = $(el).text().trim();
    if (title) films.push(title);
  });

  return films;
}

app.post("/api/films", async (req, res) => {
  try {
    const films = await getImdbTop250();

    if (!films || films.length === 0) {
      return res.status(500).json({ error: "Falha ao carregar Top 250." });
    }

    res.json({ films });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar Top 250 do IMDb." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
