async function loadRatings() {
  const userId = document.getElementById("userId").value.trim();
  if (!userId) return;

  const table = document.getElementById("table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  table.style.display = "none";

  let page = 1;
  let hasMore = true;
  let allMovies = [];

  while (hasMore) {
    const url = `https://corsproxy.io/?https://www.imdb.com/user/${userId}/ratings?sort=date_added,desc&mode=detail&page=${page}`;

    const res = await fetch(url);
    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const items = doc.querySelectorAll(".lister-item");

    if (items.length === 0) {
      hasMore = false;
      break;
    }

    items.forEach(item => {
      const titleEl = item.querySelector(".lister-item-header a");
      const yearEl = item.querySelector(".lister-item-year");

      if (titleEl) {
        allMovies.push({
          title: titleEl.textContent.trim(),
          year: yearEl ? yearEl.textContent.replace(/[()]/g, "") : ""
        });
      }
    });

    page++;
  }

  renderTable(allMovies);
  exportJSON(allMovies);
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

function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "imdb_filmes_avaliados.json";
  a.click();

  URL.revokeObjectURL(url);
}
