const express = require("express");

const app = express();

app.use(express.json());

// Queue
const queue = [];

// PRODUCER
app.post("/sensor-event", (req, res) => {

    queue.push(req.body);

    console.log("Sensor Event Submitted:", req.body);

    res.json({
        success: true,
        message: "Sensor event added to queue"
    });
});

// CONSUMER
app.get("/process-events", (req, res) => {

    const results = [];

    while (queue.length > 0) {

        const event = queue.shift();

        results.push({
            distance: event.distance,
            obstacle: event.obstacle,
            battery: event.battery,
            action: event.obstacle
                ? "STOP MOWER"
                : "CONTINUE OPERATION"
        });
    }

    res.json(results);
});

app.listen(3000, () => {
    console.log("ECOMOW Middleware API running on port 3000");
});
