const queue = require("./queue");

function processEvents() {

    console.log("\n=================================");
    console.log(" MOWER CONTROL MODULE / CONSUMER ");
    console.log("=================================\n");

    let eventNumber = 1;

    while (queue.length > 0) {

        const event = queue.shift();

        console.log(`Processing Event #${eventNumber}`);
        console.log(`Distance: ${event.distance} cm`);
        console.log(`Obstacle: ${event.obstacle}`);
        console.log(`Battery: ${event.battery}%`);

        if (event.obstacle) {

            console.log("Action: STOP MOWER");

        } else {

            console.log("Action: CONTINUE OPERATION");

        }

        console.log("---------------------------------\n");

        eventNumber++;
    }

    console.log("All queued events processed.");
}

module.exports = { processEvents };