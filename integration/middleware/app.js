const { submitSensorEvent } = require("./producer");
const { processEvents } = require("./consumer");

console.log("=================================");
console.log("         ECOMOW SYSTEM");
console.log("   MESSAGING MIDDLEWARE DEMO");
console.log("=================================");

console.log("\n--- SENSOR MODULE ---\n");

submitSensorEvent(15, true, 78);
submitSensorEvent(50, false, 70);
submitSensorEvent(10, true, 65);

console.log("\nAll sensor events have been added to the queue.");

console.log("\nProcessing queued events...\n");

processEvents();