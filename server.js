const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/*
  SSE endpoint
  Envia logs + progresso em tempo real
*/
app.get("/api/imdb-stream/:user", async (req, res) => {
  const user = req.params.user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let total = 0;
  let index = 1;

  try {
    for (let page = 1; page <= 10; page++) {
      send("log", `Buscando página ${page}…`);

      const url =
        `https://www.imdb.com/user/${user}/ratings` +
        `?sort=date_added,desc&count=250&page=${page}`;

      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const html = await r.text();

      send("log", `Página ${page}: ${Math.round(html.length / 1024)} KB recebidos`);

      const blocks = html.split("ipc-metadata-list-summary-item");
      const found = Math.max(0, blocks.length - 1);

      send("log", `Página ${page}: ${found} itens detectados no HTML`);

      if (found === 0) {
        send("log", "Nenhum item encontrado, encerrando.");
        break;
      }

      total += found;

      send("progress", {
        page,
        total
      });

      // delay visível para o usuário acompanhar
      await new Promise(r => setTimeout(r, 800));
    }

    send("done", {
      total,
      message: "Processo finalizado"
    });

    res.end();

  } catch (err) {
    send("error", err.message);
    res.end();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb debug streamer rodando");
});
