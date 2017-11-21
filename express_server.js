const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const shortid = require("shortid");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Crappy in-memory database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  console.log("shortURL = ", shortURL);
  console.log(req.body.longURL);
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect(`/urls:${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// Delete existing URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log("Current state of urlDatabase:", urlDatabase);
  res.redirect("/urls");
});

// Update existing URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURLName;
  res.redirect("/urls");
});

// Login handler
app.post("/login", (req, res) => {
  let username = req.body.username
  res.cookie("username", username);
  res.redirect("/urls");

});

function generateRandomString() {
  return shortid.generate();
}
