const fs = require("fs");

app.post("/admin/scrape", async (req, res) => {
  const { key, name, url } = req.body;
  if(!key || !name || !url){
    return res.status(400).json({ error: "Missing fields" });
  }

  try{
    const films = [];
    let page = 1;

    while(page <= 20){
      const html = await fetch(`${url}page/${page}/`).then(r => r.text());
      const items = html.match(/data-item-full-display-name="([^"]+)"/g);
      if(!items) break;

      for(const raw of items){
        const m = raw.match(/="(.+?)"/)[1];
        const y = m.match(/\((\d{4})\)/);
        films.push({
          title: m.replace(/\s*\(\d{4}\)/, "").trim(),
          year: y ? parseInt(y[1]) : null
        });
      }
      page++;
    }

    const enriched = await tmdbEnrich(films);

    fs.mkdirSync("data", { recursive:true });

    let db = {};
    if(fs.existsSync("data/lists.json")){
      db = JSON.parse(fs.readFileSync("data/lists.json","utf8"));
    }

    db[key] = {
      name,
      source: url,
      updated_at: new Date().toISOString().slice(0,10),
      films: enriched
    };

    fs.writeFileSync("data/lists.json", JSON.stringify(db, null, 2));

    res.json({ ok:true, count: enriched.length });

  }catch(e){
    res.status(500).json({ error: "Scraping failed" });
  }
});
