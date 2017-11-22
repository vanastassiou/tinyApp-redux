const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const shortid = require("shortid");
const cookieParser = require("cookie-parser")
//const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");


app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");


// Problematic in-memory URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Problematic in-memory user database

const users = {
  user1: {
    id: "1",
    email: "weebl@weebls-stuff.com",
    password: "12345678"
  },
  user2: {
    id: "2",
    email: "bob@weebls-stuff.com",
    password: "abcdefg"
  }
};

app.listen(PORT, () => {
  console.log(`TinyApp server listening on port ${PORT}!`);
});

// Begin routes

app.get("/", (req, res) => {
  res.redirect("urls");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
   };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    user: users[req.cookies.user_id]
 };
  res.render("urls_show", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
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

// Login handler
app.get("/login", (req, res) => {
  if (req.cookie) {
    let templateVars = {
      user: users[req.cookies.user_id]
    };
    res.redirect("/urls");
  } else {
    res.render("urls_login");
  };
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("Login inputs:", email, password);
  if (findUserByEmail(email) && validatePassword(password)) {
    res.cookie("user_id", findUserByEmail(email).id);
    res.redirect("/urls");
  } else if (!findUserByEmail(email)) {
    res.status(403).send("User not found.");
  } else if (!validatePassword(password)) {
    res.status(403).send("Invalid password.");
  }
});

// Logout handler

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Registration handler

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    let templateVars = {
      urls: urlDatabase,
      user: users[req.cookies.user_id]
    };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userId = generateRandomString();
  if (!email || !password) {
    res.status(400).send("Neither e-mail nor password may be blank.");
  } else if (findUserByEmail(email)) {
    res.status(400).send("This e-mail address has already been registered.");
  } else {
    let user = {
      "id": userId,
      "email": email,
      "password": password,
    };
    users[userId] = user;
    console.log("New user created:", email, userId);
    res.cookie("user_id", userId);
    res.redirect("/urls");
  };
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
  for (const key in users) {
    if (users[key].email === email) {
      console.log("User found:", users[key].email);
      return users[key];
    };
  };
};

function validatePassword(password) {
  for (const key in users) {
    if (users[key].password === password) {
      console.log("Successful login by", users[key]);
      return users[key].password;
    };
  };
  return false;
};
