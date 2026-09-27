const queue = require("./queue");

function submitSensorEvent(distance, obstacle, battery) {

    const event = {
        distance,
        obstacle,
        battery
    };

    queue.push(event);

    console.log("Sensor Event Submitted:", event);
}

module.exports = { submitSensorEvent };