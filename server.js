const express = require("express");
const axios = require("axios");

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
    const response = await axios.get("https://www.imdb.com/pt/user/ur55777575/ratings/", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const html = response.data;

    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
    );

    if (!match) {
      return res.status(500).json({ error: "NEXT_DATA não encontrado" });
    }

    const data = JSON.parse(match[1]);

    const items =
      data.props.pageProps.pageData.chartTitles.edges;

    const films = items.map(edge => {
      const n = edge.node;
      return {
        title: n.titleText.text,
        year: n.releaseYear.year,
        poster: n.primaryImage?.url || ""
      };
    });

    const selected = shuffle(films).slice(0, 16);

    res.setHeader("Cache-Control", "no-store");
    res.json({ films: selected });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar IMDb Top 250" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);

