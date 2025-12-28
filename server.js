const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.static("."));
app.use(express.json());

function extractUserId(input) {
  if (input.startsWith("ur")) return input;
  const match = input.match(/ur\d+/);
  return match ? match[0] : null;
}

async function getImdbRatedMovies(userInput) {
  const userId = extractUserId(userInput);
  if (!userId) return [];

  const url = `https://www.imdb.com/user/${userId}/ratings`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  const html = res.data;

  // IMDb guarda tudo aqui
  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/
  );

  if (!jsonMatch) return [];

  const data = JSON.parse(jsonMatch[1]);

  const edges =
    data?.props?.pageProps?.mainColumnData?.ratings?.edges;

  if (!edges || !Array.isArray(edges)) return [];

  return edges
    .map(e => e?.node?.title?.titleText?.text)
    .filter(Boolean);
}

app.post("/api/films", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Usuário não informado." });
  }

  try {
    const films = await getImdbRatedMovies(username);

    if (films.length === 0) {
      return res.status(400).json({ error: "Nenhum filme encontrado." });
    }

    res.json({ films });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar filmes no IMDb." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta", PORT));
