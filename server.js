import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/imdb/:user/:page", async (req, res) => {
  const { user, page } = req.params;

  const url = `https://www.imdb.com/user/${user}/ratings?sort=date_added,desc&mode=detail&page=${page}`;

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const html = await r.text();

    res.set("Access-Control-Allow-Origin", "*");
    res.send(html);

  } catch (e) {
    res.status(500).send("Erro ao acessar IMDb");
  }
});

app.listen(PORT, () => {
  console.log("Proxy IMDb rodando");
});
