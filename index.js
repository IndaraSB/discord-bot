const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`Bot ready as ${client.user.tag}`);
});

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

        // Crear canal dentro de la categoría encontrada
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

// 🔑 REEMPLAZÁ ESTO CON TU TOKEN REAL
client.login(process.env.TOKEN);