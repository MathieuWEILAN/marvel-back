require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/characters", async (req, res) => {
  try {
    //recherche par nom
    const searchCharacter = req.query.name ? `name=${req.query.name}` : "";

    //requête vers l'API
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?${searchCharacter}&apiKey=${process.env.API_KEY}`
    );

    const limit = 100;
    let page = 1;

    let result = response.data;
    result = res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/comics", async (req, res) => {
  try {
    //recherche par nom
    const searchComics = req.query.title ? `title=${req.query.title}` : "";
    //requête à l'API
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?${searchComics}&apiKey=${process.env.API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/comics/:characterId", async (req, res) => {
  try {
    //requête à l'API
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics/${req.params.characterId}?apiKey=${process.env.API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Si route inexistante
app.all("*", function (req, res) {
  res.json({ message: "Page not found" });
});

//Ecoute des requetes du port 3001
app.listen(3001, () => {
  console.log("Server has started");
});
