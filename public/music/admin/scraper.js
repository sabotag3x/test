async function run(){
  const inputEl = document.getElementById("artists");
  const out = document.getElementById("output");

  if (!inputEl || !out) {
    alert("IDs do HTML não conferem");
    return;
  }

  const input = inputEl.value.trim();
  if (!input) {
    alert("Cole os nomes dos artistas, um por linha");
    return;
  }

  const names = input
    .split("\n")
    .map(n => n.trim())
    .filter(Boolean);

  out.value = "Carregando...\n";

  try {
    const artists = [];

    for (const name of names) {
      const res = await fetch(
        `/api/music/artist?name=${encodeURIComponent(name)}`
      );

      if (!res.ok) continue;

      const artist = await res.json();
      if (!artist) continue;

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

  } catch (e) {
    out.value = "Erro ao gerar lista";
  }
}
