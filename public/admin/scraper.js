async function run(){
  const url = document.getElementById("url").value.trim();
  const out = document.getElementById("output");

  if(!url){
    alert("Preencha a URL da lista");
    return;
  }

  out.value = "Carregando...\n";

  try{
    const films = [];
    let page = 1;
    const MAX_PAGES = 20;

    while(page <= MAX_PAGES){
      const pageUrl = `${url}page/${page}/`;
      const proxyUrl =
        "https://api.allorigins.win/raw?url=" +
        encodeURIComponent(pageUrl);

      const html = await fetch(proxyUrl).then(r => r.text());

      const items = html.match(/data-item-full-display-name="([^"]+)"/g);
      if(!items) break;

      for(const raw of items){
        const m = raw.match(/="(.+?)"/)[1];
        const y = m.match(/\((\d{4})\)/);

        films.push({
          title: m.replace(/\s*\(\d{4}\)/, "").trim(),
          year: y ? y[1] : null
        });
      }

      page++;
    }

    if(films.length === 0) throw new Error();

    out.value = JSON.stringify(
      { films },
      null,
      2
    );

  }catch{
    out.value = "Erro ao gerar lista";
  }
}
