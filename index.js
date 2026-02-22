const express = require("express");
const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionsBitField 
} = require("discord.js");

// ==========================
// EXPRESS (Render Web Service)
// ==========================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Bot is running");
});

app.listen(PORT, () => {
    console.log("Web server started on port", PORT);
});

// ==========================
// DISCORD CLIENT
// ==========================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const STAFF_ROLE_ID = "1473013475650568294";
const RESERVATION_CHANNEL_ID = "1466912347099496589";

const reservations = new Map();

// ==========================
// BOT READY
// ==========================
client.once("ready", () => {
    console.log(`Bot ready as ${client.user.tag}`);
});

// ==========================
// AUTO PRIVATE CHANNEL
// ==========================
client.on("guildMemberAdd", async (member) => {
    try {

        const channelName = `${member.displayName}-${member.id}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

        const existingChannel = member.guild.channels.cache.find(
            ch => ch.name === channelName
        );

        if (existingChannel) return;

        let categories = member.guild.channels.cache.filter(
            c => c.type === ChannelType.GuildCategory &&
                 c.name.startsWith("Private Channels")
        );

        let targetCategory = null;

        for (const category of categories.values()) {
            const children = member.guild.channels.cache.filter(
                ch => ch.parentId === category.id
            );

            if (children.size < 50) {
                targetCategory = category;
                break;
            }
        }

        if (!targetCategory) {
            const number = categories.size + 1;
            targetCategory = await member.guild.channels.create({
                name: `Private Channels ${number}`,
                type: ChannelType.GuildCategory
            });
        }

        const newChannel = await member.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: targetCategory.id,
            permissionOverwrites: [
                {
                    id: member.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                },
                {
                    id: STAFF_ROLE_ID,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages
                    ]
                }
            ]
        });

        await newChannel.send(
`Hi ${member}, this is your private channel!
If you need anything, tag staff.
Welcome 🎉`
        );

    } catch (error) {
        console.error("Channel creation error:", error);
    }
});

// ==========================
// RESERVATION SYSTEM
// ==========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.id !== RESERVATION_CHANNEL_ID) return;

    const args = message.content.trim().split(/\s+/);
    const command = args[0];
    const coords = args[1];

    const regex = /^-?\d+\/-?\d+$/;

    // ===== TAKE =====
    if (command === "!take") {

        if (!coords || !regex.test(coords)) {
            return message.reply("Usage: !take x/y (example: !take -10/23)");
        }

        if (reservations.has(coords)) {
            const reservedBy = reservations.get(coords);
            return message.reply(`❌ ${coords} is already reserved by <@${reservedBy}>`);
        }

        reservations.set(coords, message.author.id);

        return message.channel.send(`✅ ${coords} reserved by ${message.author}`);
    }

    // ===== FREE =====
    if (command === "!free") {

        if (!coords || !regex.test(coords)) {
            return message.reply("Usage: !free x/y (example: !free -10/23)");
        }

        if (!reservations.has(coords)) {
            return message.reply(`❌ ${coords} is not reserved.`);
        }

        const reservedBy = reservations.get(coords);
        const isStaff = message.member.roles.cache.has(STAFF_ROLE_ID);

        if (reservedBy !== message.author.id && !isStaff) {
            return message.reply("❌ You cannot free this coordinate.");
        }

        reservations.delete(coords);

        return message.channel.send(`🗑️ ${coords} freed by ${message.author}`);
    }
});

// ==========================
// LOGIN
// ==========================
console.log("TOKEN EXISTS:", !!process.env.TOKEN);

client.login(process.env.TOKEN);