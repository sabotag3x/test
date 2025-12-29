async function run(){
  const input = document.getElementById("artists").value.trim();
  const out = document.getElementById("output");

  if(!input){
    alert("Cole os nomes dos artistas, um por linha");
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
      const res = await fetch(
        `/api/music/artist?name=${encodeURIComponent(name)}`
      );

      const artist = await res.json();
      if(!artist) continue;

      artists.push({
        name: artist.name,
        id: artist.id,
        country: artist.country || null,
        type: artist.type || null
      });
    }

    out.value = JSON.stringify(
      { artists },
      null,
      2
    );

  }catch{
    out.value = "Erro ao gerar lista";
  }
}
