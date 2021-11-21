const mongoose = require("mongoose");

const User = mongoose.model("User", {
  username: String,
  email: String,
  token: String,
  hash: String,
  salt: String,
  favoris_characters: [{ type: mongoose.Schema.Types.Mixed, default: {} }],
  favoris_comics: [{ type: mongoose.Schema.Types.Mixed, default: {} }],
});

module.exports = User;
