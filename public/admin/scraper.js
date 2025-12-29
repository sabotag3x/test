async function run(){
  const slug = document.getElementById("key").value.trim();
  const url  = document.getElementById("url").value.trim();
  const out  = document.getElementById("output");

  if(!slug || !url){
    alert("Preencha o slug e a URL");
    return;
  }

  out.value = "Carregando...\n";

  try{
    const res = await fetch(`/api/list?url=${encodeURIComponent(url)}`);
    const films = await res.json();

    const valid = films.filter(f => f && f.poster);

    const json = {
      films: valid
    };

    out.value =
`// Salvar como: data/${slug}.json
${JSON.stringify(json, null, 2)}`;

  }catch(e){
    out.value = "Erro ao gerar lista";
  }
}
