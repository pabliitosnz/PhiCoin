console.log("🔥 ESTE ES EL SERVER QUE SE ESTÁ EJECUTANDO");
const express = require("express");
console.log("🔥 SERVER ACTIVO: estoy ejecutando ESTE archivo");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new Database("phicoin.db");

console.log("🔥 PhiCoin server activo");

// ---------------- TABLAS ----------------

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  balance REAL DEFAULT 0
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromUser TEXT,
  toUser TEXT,
  amount REAL,
  date TEXT
)
`);

// ---------------- TEST ----------------

app.get("/test", (req, res) => {
  res.json({ ok: true });
});

// ---------------- REGISTER ----------------

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password, balance) VALUES (?, ?, 0)",
    [username, hash],
    function (err) {
      if (err) return res.json({ error: "Usuario ya existe" });
      res.json({ success: true });
    }
  );
});

// ---------------- LOGIN ----------------

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.json({ error: "Usuario no existe" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ error: "Contraseña incorrecta" });

    res.json({ success: true, balance: user.balance });
  });
});

// ---------------- BALANCE ----------------

app.get("/balance/:user", (req, res) => {
  db.get(
    "SELECT balance FROM users WHERE username = ?",
    [req.params.user],
    (err, row) => {
      res.json({ balance: row?.balance || 0 });
    }
  );
});

// ---------------- SEND ----------------

app.post("/send", (req, res) => {
  const { from, to, amount } = req.body;

  db.get("SELECT balance FROM users WHERE username = ?", [from], (err, sender) => {
    if (!sender || sender.balance < amount) {
      return res.json({ error: "Saldo insuficiente" });
    }

    db.get("SELECT username FROM users WHERE username = ?", [to], (err, receiver) => {
      if (!receiver) {
        return res.json({ error: "Usuario destino no existe" });
      }

      db.run("UPDATE users SET balance = balance - ? WHERE username = ?", [amount, from]);
      db.run("UPDATE users SET balance = balance + ? WHERE username = ?", [amount, to]);

      db.run(
        "INSERT INTO transactions (fromUser, toUser, amount, date) VALUES (?, ?, ?, datetime('now'))",
        [from, to, amount]
      );

      res.json({ success: true });
    });
  });
});

// ---------------- HISTORY ----------------

app.get("/history", (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      console.log("ERROR HISTORY:", err);
      return res.json([]);
    }
    res.json(rows || []);
  });
});

// ---------------- START ----------------

app.listen(3000, () => {
  console.log("🚀 http://localhost:3000");
});

app.get("/history", (req, res) => {
  console.log("📡 HISTORY HIT");
  res.json([{ test: "ok" }]);
});

app.get("/clear", (req, res) => {
  db.run("DELETE FROM transactions", [], () => {
    res.json({ ok: true });
  });
});
