const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');

const express = require("express");
const app = express();

// 🌐 Mini servidor para Render (evita que se reinicie)
app.get("/", (req, res) => {
    res.send("Bot is running");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Web server started");
});

// 🤖 Crear cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ✅ Evento listo
client.once('clientReady', async () => {
    console.log(`Bot ready as ${client.user.tag}`);

    const STAFF_ROLE_ID = "1473013475650568294";

    const guild = client.guilds.cache.first(); // Si solo usás 1 servidor
    if (!guild) return;

    await guild.members.fetch();

    for (const member of guild.members.cache.values()) {

        if (member.user.bot) continue;

        const channelName = member.displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");

        const existingChannel = guild.channels.cache.find(
            ch => ch.name === channelName
        );

        if (!existingChannel) {
            console.log(`Creating missing channel for ${member.user.tag}`);
        }
    }
});});

// 👥 Cuando entra un miembro
client.on('guildMemberAdd', async (member) => {
    try {

        // 🔎 Buscar categorías que empiecen con "Private Channels"
        let categories = member.guild.channels.cache.filter(
            c => c.type === ChannelType.GuildCategory &&
                 c.name.startsWith("Private Channels")
        );

        let targetCategory = null;

        // Buscar una categoría con menos de 50 canales
        for (const category of categories.values()) {
            const children = member.guild.channels.cache.filter(
                ch => ch.parentId === category.id
            );

            if (children.size < 50) {
                targetCategory = category;
                break;
            }
        }

        // Si todas están llenas o no existe ninguna, crear nueva
        if (!targetCategory) {
            const number = categories.size + 1;
            targetCategory = await member.guild.channels.create({
                name: `Private Channels ${number}`,
                type: ChannelType.GuildCategory
            });
        }

        const STAFF_ROLE_ID = "1473013475650568294";

        // 🆕 Crear canal
        const newChannel = await member.guild.channels.create({
            name: member.displayName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-"),
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

// 🔑 Login con variable de entorno
client.login(process.env.TOKEN);