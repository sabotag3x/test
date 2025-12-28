const BASE_URL = "https://test-production-eac6.up.railway.app";

async function loadRatings() {
  const userId = document.getElementById("userId").value.trim();
  if (!userId) return;

  const tbody = document.querySelector("#table tbody");
  tbody.innerHTML = "";
  document.getElementById("table").style.display = "none";

  let page = 1;
  let movies = [];

  while (true) {
    const res = await fetch(`${BASE_URL}/imdb/${userId}/${page}`);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");
    const items = doc.querySelectorAll(".ipc-metadata-list-summary-item");

    if (items.length === 0) break;

    items.forEach(item => {
      const titleEl = item.querySelector("a.ipc-title-link-wrapper");
      const yearEl  = item.querySelector(".ipc-inline-list__item span");

      if (titleEl) {
        movies.push({
          title: titleEl.textContent.trim(),
          year: yearEl ? yearEl.textContent.trim() : ""
        });
      }
    });

    page++;
  }

  renderTable(movies);
  downloadJSON(movies);
}

function renderTable(movies) {
  const tbody = document.querySelector("#table tbody");

  movies.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.title}</td><td>${m.year}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("table").style.display = "table";
}

function downloadJSON(data) {
  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "imdb_filmes.json";
  a.click();
}
