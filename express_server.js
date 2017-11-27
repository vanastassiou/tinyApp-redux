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
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "1"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "2"
  },
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
  if (!req.cookies.user_id) {
    res.status(400).send("You must be logged in to use TinyApp.");
  } else {
  let urlObject = getLoggedInUserURLs(req.cookies.user_id);
  console.log(urlObject);
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id],
    userURLs: urlObject
   };
  res.render("urls_index", templateVars);
  };
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    console.log("Non-logged-in user accessing /urls/new");
    res.redirect("/login");
  } else {
    console.log("Logged-in user accessing /urls/new");
    let templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  };
});

app.get("/urls/:id", (req, res) => {
  console.log("This is the Edit URLs endpoint.");
  let requestedURL = req.params.id;
  let templateVars = {
    shortURL: req.params.id,
    user: users[req.cookies.user_id]
  };
  if (req.cookies.user_id != urlDatabase[requestedURL].userID) {
    res.status(400).send("Sorry, you can only edit your own URLs.");
  } else {
  res.render("urls_show", templateVars);
  };
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  console.log("New shortURL", shortURL, "registered for", req.body.newLongURL);
  urlDatabase[shortURL] = {
  "longURL": req.body.newLongURL,
  "userID": req.cookies.user_id
  }
  console.log("Current state of URL DB:", urlDatabase);
  res.redirect(`http://localhost:8080/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  let redirectURL = req.params.shortURL;
  let destination = urlDatabase[redirectURL]["longURL"];
  res.redirect(destination);
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
  } else if (validatePassword(password) === false) {
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
    const hash = bcrypt.hashSync(password, 10);
    let user = {
      "id": userId,
      "email": email,
      "password": hash
    };
    users[userId] = user;
    console.log("New user created:", email, userId);
    res.cookie("user_id", userId);
    res.redirect("/urls");
  };
});

// Delete existing URL
app.post("/urls/:id/delete", (req, res) => {
  if (req.cookies.user_id != req.params.id) {
    res.status(400).send("Sorry, you can only delete your own TinyURLs.");
  } else {
  delete urlDatabase[req.params.id];
  console.log("Current state of urlDatabase:", urlDatabase);
  res.redirect("/urls");
  };
});

// Update existing URL
app.post("/urls/:id", (req, res) => {
  if (!req.body.longURLName) {
    res.status(400).send("Sorry, you cannot add a blank URL.");
  } else {
  urlDatabase[req.params.id] = req.body.longURLName;
  console.log(req.params.id, "updated to", req.body.longURLName)
  res.redirect("/urls");
  };
});


// Helper functions

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
  for (var key in users) {
    const storedHash = users[key].password;
    if (bcrypt.compareSync(password, storedHash)) {
      return true;
    };
  };
  return false;
};

function getLoggedInUserURLs(loggedInUser) {
  let result = { };
  for (var i in urlDatabase) {
    if (urlDatabase[i].userID == loggedInUser) {
      result[i] = urlDatabase[i].longURL;
      };
  };
  return result;
};
