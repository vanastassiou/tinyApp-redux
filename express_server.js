const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const shortid = require("shortid");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// Problematic in-memory URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Problematic in-memory user database

const users = {
  1: {
    id: "1",
    email: "weebl@weebls-stuff.com",
    password: "12345678",
  },
  2: {
    id: "2",
    email: "bob@weebls-stuff.com",
    password: "abcdefg",
  },
};

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

// Begin routes

app.get("/", (req, res) => {
  res.redirect("urls_index");
});

app.get("/urls", (req, res) => {
  let loggedIn = false;
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
  console.log("New shortURL", shortURL, "registed for", req.body.longURL);
  urlDatabase[shortURL] = req.body.longURL;
  console.log("Current state of URL DB:", urlDatabase);
  res.redirect(`/urls:${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Login handler
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = validateCredentials(username, password);
  if (user) {
    console.log(user, "has logged in.");
    res.redirect("/urls_show");
  } else {
    res.redirect("/urls_index");
  }
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

function generateRandomString() {
  return shortid.generate();
}

function findUserByEmail(email) {
  return users.find((user) => user.email == email);
}

function validateCredentials(username, password) {
  return users.find((user) => user.email == username && user.password == password);
}
