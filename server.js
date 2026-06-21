const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const DATA_FILE = "./data.json";

/* ======================
   UTILIDADES
====================== */

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { users: [], transactions: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ======================
   REGISTRO USUARIO
====================== */

app.post("/register", (req, res) => {
  const data = loadData();
  const { username } = req.body;

  if (!username) return res.json({ error: "no username" });

  const exists = data.users.find(u => u.username === username);
  if (exists) return res.json({ error: "user exists" });

  data.users.push({
    username,
    balance: 200
  });

  saveData(data);

  res.json({ ok: true });
});

/* ======================
   ENVIAR DINERO
====================== */

app.post("/send", (req, res) => {
  const data = loadData();
  const { from, to, amount } = req.body;

  const sender = data.users.find(u => u.username === from);
  const receiver = data.users.find(u => u.username === to);

  if (!sender || !receiver) {
    return res.json({ error: "user not found" });
  }

  if (sender.balance < amount) {
    return res.json({ error: "not enough balance" });
  }

  sender.balance -= amount;
  receiver.balance += amount;

  data.transactions.push({
    from,
    to,
    amount,
    date: new Date().toISOString()
  });

  saveData(data);

  res.json({ ok: true });
});

/* ======================
   HISTORIAL
====================== */

app.get("/history", (req, res) => {
  const data = loadData();
  res.json(data.transactions);
});

/* ======================
   USUARIOS
====================== */

app.get("/users", (req, res) => {
  const data = loadData();
  res.json(data.users);
});

/* ======================
   SERVIDOR
====================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🔥 PhiCoin running on port " + PORT);
});