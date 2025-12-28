const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/imdb/:user/:page", async (req, res) => {
  const { user, page } = req.params;

  const url = `https://www.imdb.com/user/${user}/ratings?sort=date_added,desc&mode=detail&page=${page}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const html = await r.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar IMDb");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Proxy IMDb ativo na porta", PORT);
});
