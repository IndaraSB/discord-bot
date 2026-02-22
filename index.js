console.log("APP STARTED");

const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("ok"));

app.listen(PORT, () => {
    console.log("WEB SERVER RUNNING ON", PORT);
});

console.log("TOKEN VALUE:", process.env.TOKEN);
console.log("TOKEN LENGTH:", process.env.TOKEN?.length);

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.on("ready", () => {
    console.log("BOT READY EVENT FIRED");
});

client.on("error", (err) => {
    console.error("CLIENT ERROR:", err);
});

client.login(process.env.TOKEN);