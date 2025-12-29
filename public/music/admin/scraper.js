async function run(){
  const input = document.getElementById("input").value.trim();
  const out   = document.getElementById("output");

  if(!input){
    alert("Cole ao menos um nome de artista");
    return;
  }

  const names = input
    .split("\n")
    .map(n => n.trim())
    .filter(Boolean);

  out.value = "Carregando...\n";

  try{
    const artists = [];

    for(const name of names){
      const url =
        "https://musicbrainz.org/ws/2/artist" +
        "?query=" + encodeURIComponent(name) +
        "&fmt=json&limit=1";

      const res = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      const data = await res.json();
      if(!data.artists || !data.artists[0]) continue;

      const a = data.artists[0];

      artists.push({
        name: a.name,
        country: a.country || null,
        begin_year: a["life-span"]?.begin
          ? a["life-span"].begin.slice(0,4)
          : null
      });
    }

    if(artists.length === 0) throw new Error();

    out.value = JSON.stringify(
      { artists },
      null,
      2
    );

  }catch{
    out.value = "Erro ao gerar lista";
  }
}
