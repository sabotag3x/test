const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

/* ================= Letterboxd ================= */

app.get("/api/letterboxd/:user", async (req, res) => {
  const user = req.params.user;
  const movies = [];
  let index = 1;
  let page = 1;

  try {
    while (true) {
      const url = `https://letterboxd.com/${user}/films/page/${page}/`;

      const html = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      }).then(r => r.text());

      const items = html.match(/<li class="griditem">[\s\S]*?<\/li>/g);
      if (!items || items.length === 0) break;

      for (const item of items) {
        const titleMatch =
          item.match(/data-item-full-display-name="([^"]+)"/);
        const posterMatch =
          item.match(/<img[^>]+src="([^"]+)"/);

        if (!titleMatch || !posterMatch) continue;

        const raw = titleMatch[1];
        const yearMatch = raw.match(/\((\d{4})\)/);

        movies.push({
          index,
          title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
          year: yearMatch ? yearMatch[1] : "",
          poster: posterMatch[1]
        });

        index++;
      }

      page++;
    }

    res.json(movies);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Letterboxd Battle rodando");
});
