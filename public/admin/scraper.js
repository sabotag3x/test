async function run(){
  const url = document.getElementById("url").value.trim();
  const out = document.getElementById("output");

  if(!url){
    alert("Preencha a URL da lista");
    return;
  }

  out.value = "Carregando...\n";

  try{
    const res = await fetch(`/api/list?url=${encodeURIComponent(url)}`);
    const films = await res.json();

    if(!Array.isArray(films) || films.length === 0){
      throw new Error();
    }

    const valid = films.filter(f => f && f.poster);

    out.value = JSON.stringify(
      { films: valid },
      null,
      2
    );

  }catch(e){
    out.value = "Erro ao gerar lista";
  }
}
