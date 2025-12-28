const express = require("express");
const path = require("path");

const TMDB_TOKEN = process.env.TMDB_TOKEN;

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= CACHE ================= */

const cache = {
  users: {},     // { sabotag3x: [...] }
  lists: {}      // { imdb250: [...] }
};

const LISTS = {
  imdb250: "https://letterboxd.com/dave/list/imdb-top-250/",
  top250: "https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/",
  popular: "https://letterboxd.com/jack/list/official-top-250-films-with-the-most-fans/",
  animation: "https://letterboxd.com/lifeasfiction/list/letterboxd-100-animation/",
  disney: "https://letterboxd.com/petitebutfierce/list/disney/",
  ghibli: "https://letterboxd.com/jaywill/list/ghibli/",
  brazil: "https://letterboxd.com/purecinema1/list/brazil/",
  docs: "https://letterboxd.com/jack/list/official-top-250-documentary-films/",
  scifi: "https://letterboxd.com/chris_coke/list/letterboxds-top-250-science-fiction-films/",
  international: "https://letterboxd.com/brsan/list/letterboxds-top-250-international-films/",
  oscar: "https://letterboxd.com/oscars/list/oscar-winning-films-best-picture/",
  palme: "https://letterboxd.com/festival_cannes/list/70-years-of-the-palme-dor-70-ans-de-la-palme/",
  bafta: "https://letterboxd.com/bafta/list/all-bafta-best-film-award-winners/",
  criterion: "https://letterboxd.com/jbutts15/list/the-complete-criterion-collection/",
  a24: "https://letterboxd.com/a24/list/every-a24-movie-ever/"
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= SCRAPER BASE ================= */

async function scrapeLetterboxd(url) {
  const films = [];
  let page = 1;

  while (true) {
    const pageUrl = `${url}page/${page}/`;
    const html = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    }).then(r => r.text());

    const items = html.match(/<li class="griditem">[\s\S]*?<\/li>/g);
    if (!items) break;

    for (const item of items) {
      const m = item.match(/data-item-full-display-name="([^"]+)"/);
      if (!m) continue;

      const raw = m[1];
      const y = raw.match(/\((\d{4})\)/);

      films.push({
        title: raw.replace(/\s*\(\d{4}\)/, "").trim(),
        year: y ? parseInt(y[1]) : null
      });
    }

    page++;
  }

  return films;
}

/* ================= API ================= */

app.get("/api/user/:user", async (req, res) => {
  const u = req.params.user;

  if (cache.users[u]) return res.json(cache.users[u]);

  const films = await scrapeLetterboxd(
    `https://letterboxd.com/${u}/films/`
  );

  cache.users[u] = films;
  res.json(films);
});

app.get("/api/list/:id", async (req, res) => {
  const id = req.params.id;
  if (!LISTS[id]) return res.status(404).end();

  if (cache.lists[id]) return res.json(cache.lists[id]);

  const films = await scrapeLetterboxd(LISTS[id]);
  cache.lists[id] = films;
  res.json(films);
});

/* ================= TMDb ================= */

app.post("/api/tmdb", async (req, res) => {
  const { films, lang } = req.body;
  const out = [];

  for (const f of films) {
    const url =
      `https://api.themoviedb.org/3/search/movie` +
      `?query=${encodeURIComponent(f.title)}` +
      `&language=${lang || "pt-BR"}`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        Accept: "application/json"
      }
    });

    const j = await r.json();
    let match = j.results?.find(x =>
      x.poster_path &&
      x.release_date &&
      (!f.year || Math.abs(parseInt(x.release_date) - f.year) <= 1)
    );

    out.push({
      title: match?.title || f.title,
      year: f.year || "",
      poster: match?.poster_path
        ? `https://image.tmdb.org/t/p/w500${match.poster_path}`
        : null
    });
  }

  res.json(out);
});

app.listen(PORT, () =>
  console.log("FilmDuel backend rodando")
);
