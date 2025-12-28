const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/*
  DEBUG ENDPOINT
  Não extrai filmes.
  Apenas mostra o que o IMDb está retornando.
*/
app.get("/api/debug/:user", async (req, res) => {
  const user = req.params.user;

  const report = [];

  try {
    for (let start = 0; start <= 1000; start += 250) {
      const url =
        `https://www.imdb.com/user/${user}/ratings/_ajax` +
        `?start=${start}&count=250&sort=date_added,desc`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      const html = await r.text();

      const itemCount =
        (html.match(/ipc-metadata-list-summary-item/g) || []).length;

      const looksBlocked =
        html.includes("captcha") ||
        html.includes("verify you are a human") ||
        html.includes("Cloudflare");

      report.push({
        start,
        status: r.status,
        htmlLength: html.length,
        itemsFound: itemCount,
        blocked: looksBlocked
      });

      // se não veio nada, para
      if (html.length < 500) break;
    }

    res.json(report);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb DEBUG app rodando");
});
