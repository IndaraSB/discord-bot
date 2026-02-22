const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot is running");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Web server started");
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const STAFF_ROLE_ID = "1473013475650568294";

client.once('clientReady', () => {
    console.log(`Bot ready as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
    try {

        const channelName = member.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");

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
`Hi ${member}, this is the channel for personal use of your account!
If you need anything or have a question, just tag us.
You can also share your general stats here on Tuesdays.

Welcome 🎉`
        );

    } catch (error) {
        console.error(error);
    }
});
const reservations = new Map();

const RESERVATION_CHANNEL_ID = "1466912347099496589";

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    message.reply("I am alive");
});
console.log("TOKEN EXISTS:", !!process.env.TOKEN);