require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const User = require("./models/User");
const formidableMiddleware = require("express-formidable");
const isAuthenticated = require("./middlewares/isAuthenticated");

const app = express();
app.use(cors());
app.use(formidableMiddleware());

mongoose.connect(process.env.MONGODB_URI);

app.get("/characters", async (req, res) => {
  try {
    //recherche par nom
    const searchCharacter = req.query.name ? `name=${req.query.name}` : "";
    //pagination
    const limit = 100;
    const page = req.query.page;
    const skip = (page - 1) * limit;

    //requête vers l'API
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/characters?${searchCharacter}&page=${page}&limit=${limit}&skip=${skip}&apiKey=${process.env.API_KEY}`
    );
    res.json(response.data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/handlecharacter", async (req, res) => {
  try {
    console.log("favorite ?", req.fields.favCharacter.favorite);

    const checkUser = await User.findOne({ token: req.fields.token });
    if (checkUser) {
      if (!req.fields.favCharacter.favorite) {
        checkUser.favoris_characters.push(req.fields.favCharacter);
      } else if (req.fields.favCharacter.favorite) {
        for (let i = 0; i < checkUser.favoris_characters.length; i++) {
          const element = checkUser.favoris_characters[i];

          if (element._id === req.fields.favCharacter._id) {
            console.log(
              "element_id",
              element._id,
              "req.fields.favCharacter._id",
              req.fields.favCharacter._id
            );
            checkUser.favoris_characters.splice(i, 1);
            console.log("retirer du tableau", req.fields.favCharacter);
          }
        }
      }
    }
    await checkUser.save();

    console.log("nouveau taleau", checkUser.favoris_characters);
    res.json(checkUser.favoris_characters);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/handlecomics", async (req, res) => {
  try {
    console.log("favorite ?", req.fields.favComics);

    const checkUser = await User.findOne({ token: req.fields.token });
    if (checkUser) {
      if (!req.fields.favComics.favorite) {
        checkUser.favoris_comics.push(req.fields.favComics);
      } else if (req.fields.favComics.favorite) {
        for (let i = 0; i < checkUser.favoris_comics.length; i++) {
          const element = checkUser.favoris_comics[i];
          if (element._id === req.fields.favComics._id) {
            console.log(
              "element_id",
              element._id,
              "req.fields.favComics._id",
              req.fields.favComics._id
            );
            checkUser.favoris_comics.splice(i, 1);
            console.log("retirer du tableau", req.fields.favComics);
          }
        }
      }
    }
    await checkUser.save();

    console.log("nouveau taleau", checkUser.favoris_comics);
    res.json(checkUser.favoris_comics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/comics", async (req, res) => {
  try {
    //recherche par nom
    const searchComics = req.query.title ? `title=${req.query.title}` : "";
    //pagination
    const limit = 100;
    const page = req.query.page;
    const skip = (page - 1) * limit;
    //requête à l'API
    const response = await axios.get(
      `https://lereacteur-marvel-api.herokuapp.com/comics?${searchComics}&page=${page}&limit=${limit}&skip=${skip}&apiKey=${process.env.API_KEY}`
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

app.get("/favoris", async (req, res) => {
  try {
    console.log("acces autorisé avec token", req.query.token);
    const checkUser = await User.findOne({ token: req.query.token });
    if (checkUser) console.log("token trouvé", checkUser);
    res.json(checkUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/favoris-comics", async (req, res) => {
  try {
    console.log("acces autorisé avec token", req.query.token);
    const checkUser = await User.findOne({ token: req.query.token });
    if (checkUser) console.log("token trouvé", checkUser);
    res.json(checkUser.favoris_comics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/signup", async (req, res) => {
  try {
    console.log("bonjour");
    const password = req.fields.password;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);

    const checkEmailUser = await User.findOne({ email: req.fields.email });
    if (checkEmailUser) {
      res.status(400).json({ error: "Email déjà utilisé" });
    } else {
      if (req.fields.username === undefined) {
        res.status(400).json({ error: "Username obligatoire" });
      } else {
        const newUser = new User({
          username: req.fields.username,
          email: req.fields.email,
          token: token,
          hash: hash,
          salt: salt,
        });
        console.log(newUser);
        await newUser.save();
        res.json({
          _id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          token: newUser.token,
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const checkUser = await User.findOne({ email: req.fields.email });

    if (checkUser) {
      const hash = SHA256(req.fields.password + checkUser.salt).toString(
        encBase64
      );
      if (hash === checkUser.hash) {
        res.json({
          id: checkUser.id,
          token: checkUser.token,
          favoris: checkUser.favoris,
        });
      } else {
        res.status(400).json({ error: "Email or Password are not correct" });
      }
    } else {
      res.status(400).json({ error: "Email or Password are not correct" });
    }
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
