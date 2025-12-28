const express = require("express");
const app = express();

app.use(express.static("."));

const films = [
  "The Shawshank Redemption",
  "The Godfather",
  "The Dark Knight",
  "The Godfather Part II",
  "12 Angry Men",
  "Schindler's List",
  "The Lord of the Rings: The Return of the King",
  "Pulp Fiction",
  "The Lord of the Rings: The Fellowship of the Ring",
  "The Good, the Bad and the Ugly",
  "Forrest Gump",
  "Fight Club",
  "Inception",
  "The Lord of the Rings: The Two Towers",
  "Star Wars: Episode V – The Empire Strikes Back",
  "The Matrix",
  "Goodfellas",
  "One Flew Over the Cuckoo's Nest",
  "Se7en",
  "Seven Samurai",
  "Interstellar",
  "City of God",
  "Spirited Away",
  "Saving Private Ryan",
  "The Green Mile"
];

app.get("/api/films", (req, res) => {
  res.json({ films });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
