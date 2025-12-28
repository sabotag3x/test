const express = require("express");
const path = require("path");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/imdb-stream/:user", async (req, res) => {
  const user = req.params.user;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let browser;

  try {
    send("log", "Iniciando navegador…");

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    const url = `https://www.imdb.com/user/${user}/ratings`;
    send("log", `Abrindo ${url}`);

    await page.goto(url, { waitUntil: "networkidle" });

    let lastCount = 0;
    let stableRounds = 0;
    const MAX_STABLE = 3;

    while (true) {
      // força scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitForTimeout(1200);

      const items = await page.$$eval(
        ".ipc-metadata-list-summary-item",
        els =>
          els.map(el => {
            const title =
              el.querySelector(".ipc-title__text")?.textContent?.trim() || "";
            const year =
              el.textContent.match(/\b(19|20)\d{2}\b/)?.[0] || "";
            return { title, year };
          })
      );

      const count = items.length;
      send("progress", { count });
      send("log", `Itens detectados no DOM: ${count}`);

      if (count === lastCount) {
        stableRounds++;
      } else {
        stableRounds = 0;
      }

      if (stableRounds >= MAX_STABLE) {
        send("log", "Nenhum item novo após scroll. Encerrando.");
        send("done", { total: count, items });
        break;
      }

      lastCount = count;
    }
  } catch (err) {
    send("error", {
      message: err.message,
      stack: err.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }
    res.end();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("IMDb Playwright Debug rodando");
});
