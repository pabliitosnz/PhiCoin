const express = require("express");
const fs = require("fs");
const session = require("express-session");

const app = express();

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: "phicoin-secret",
  resave: false,
  saveUninitialized: true
}));

const DATA_FILE = "./data.json";

/* ======================
   DB
====================== */

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const init = { users: [], transactions: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ======================
   REGISTER
====================== */

app.post("/register", (req, res) => {
  const data = loadData();
  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ error: "missing fields" });

  if (data.users.find(u => u.username === username))
    return res.json({ error: "user exists" });

  data.users.push({
    username,
    password,
    balance: 0
  });

  saveData(data);

  res.json({ ok: true });
});

/* ======================
   LOGIN
====================== */

app.post("/login", (req, res) => {
  const data = loadData();
  const { username, password } = req.body;

  const user = data.users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.json({ error: "invalid login" });

  req.session.user = username;

  res.json({ ok: true });
});

/* ======================
   LOGOUT
====================== */

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

/* ======================
   ME
====================== */

app.get("/me", (req, res) => {
  const data = loadData();

  if (!req.session.user)
    return res.json({ logged: false });

  const user = data.users.find(u => u.username === req.session.user);

  res.json({
    logged: true,
    username: user.username,
    balance: user.balance
  });
});

/* ======================
   SEND MONEY
====================== */

app.post("/send", (req, res) => {
  const data = loadData();

  if (!req.session.user)
    return res.json({ error: "not logged in" });

  const { to, amount } = req.body;

  const sender = data.users.find(u => u.username === req.session.user);
  const receiver = data.users.find(u => u.username === to);

  if (!receiver) return res.json({ error: "user not found" });
  if (sender.balance < amount) return res.json({ error: "no money" });

  sender.balance -= amount;
  receiver.balance += amount;

  data.transactions.push({
    from: sender.username,
    to,
    amount,
    date: new Date().toISOString()
  });

  saveData(data);

  res.json({ ok: true });
});

/* ======================
   USERS + HISTORY
====================== */

app.get("/users", (req, res) => {
  res.json(loadData().users);
});

app.get("/history", (req, res) => {
  res.json(loadData().transactions);
});

/* ======================
   START
====================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 PhiCoin running");
});

app.get("/me/give200", (req, res) => {
  const data = loadData();

  // 👇 cambia "pablo" por tu usuario real
  const user = data.users.find(u => u.username === "pablo");

  if (!user) return res.send("user not found");

  user.balance += 200;

  saveData(data);

  res.send("💸 +200 added");
});