const express = require("express");

const app = express();
const PORT = 3001;

app.use(express.json());

// ==============================
// MODULE 1: MOWERS
// ==============================
let mowers = [
  {
    id: 1,
    name: "ECOMOW-01",
    status: "online",
    battery: 85
  }
];

// GET /mowers
app.get("/mowers", (req, res) => {
  res.status(200).json(mowers);
});

// POST /mowers
app.post("/mowers", (req, res) => {
  const { name, status, battery } = req.body;

  const newMower = {
    id: mowers.length + 1,
    name: name,
    status: status,
    battery: battery
  };

  mowers.push(newMower);

  res.status(201).json(newMower);
});

// ==============================
// MODULE 2: COMMANDS
// ==============================
let commands = [
  {
    id: 1,
    mowerId: 1,
    command: "stop",
    timestamp: new Date().toISOString()
  }
];

// GET /commands
app.get("/commands", (req, res) => {
  res.status(200).json(commands);
});

// POST /commands
app.post("/commands", (req, res) => {
  const { mowerId, command } = req.body;

  const newCommand = {
    id: commands.length + 1,
    mowerId: mowerId,
    command: command,
    timestamp: new Date().toISOString()
  };

  commands.push(newCommand);

  res.status(201).json(newCommand);
});

// ==============================
// START SERVER
// ==============================
app.listen(PORT, () => {
  console.log(`ECOMOW REST API running at http://localhost:${PORT}`);
});