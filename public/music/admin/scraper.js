async function run(){
  const q = document.getElementById("query").value.trim();
  const out = document.getElementById("output");

  if(!q){
    alert("Digite o nome da banda ou artista");
    return;
  }

  out.value = "Carregando...\n";

  try{
    const url =
      "https://musicbrainz.org/ws/2/artist" +
      "?query=" + encodeURIComponent(q) +
      "&fmt=json&limit=10";

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    const data = await res.json();

    if(!data.artists || data.artists.length === 0){
      throw new Error();
    }

    const artists = data.artists.map(a => ({
      name: a.name,
      country: a.country || null,
      begin_year: a["life-span"]?.begin
        ? a["life-span"].begin.slice(0,4)
        : null
    }));

    out.value = JSON.stringify(
      { artists },
      null,
      2
    );

  }catch{
    out.value = "Erro ao gerar lista";
  }
}
