async function run(){
  const name = document.getElementById("name").value.trim();
  const key  = document.getElementById("key").value.trim();
  const url  = document.getElementById("url").value.trim();
  const out  = document.getElementById("output");

  if(!name || !key || !url){
    alert("Preencha todos os campos");
    return;
  }

  out.value = "Carregando...\n";

  const res = await fetch(`/api/list?url=${encodeURIComponent(url)}`);
  const films = await res.json();

  const json = {
    [key]: {
      name,
      source: url,
      updated_at: new Date().toISOString().slice(0,10),
      films
    }
  };

  out.value = JSON.stringify(json, null, 2);
}
