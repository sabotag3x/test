async function run(){
  const key  = document.getElementById("key").value.trim();
  const name = document.getElementById("name").value.trim();
  const url  = document.getElementById("url").value.trim();
  const log  = document.getElementById("log");

  if(!key || !name || !url){
    alert("Preencha todos os campos");
    return;
  }

  log.innerText = "Iniciando scraping...\n";

  const res = await fetch("/admin/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, name, url })
  });

  const data = await res.json();

  if(data.error){
    log.innerText += "Erro: " + data.error;
    return;
  }

  log.innerText += `Concluído.\nFilmes salvos: ${data.count}\n`;
}
