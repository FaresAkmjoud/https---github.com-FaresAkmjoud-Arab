require('dotenv').config();
const ExtendedClient = require('./class/ExtendedClient');

const client = new ExtendedClient();

client.start();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

/////////////////////////////////////////////
client.on('guildMemberAdd', async (member) => {
    if (!antiRaidSettings.enabled) return;

    const now = Date.now();
    antiRaidSettings.joinLog.push(now);

    antiRaidSettings.joinLog = antiRaidSettings.joinLog.filter(timestamp => now - timestamp <= antiRaidSettings.timeFrame * 1000);

    if (antiRaidSettings.joinLog.length >= antiRaidSettings.joinThreshold) {
        const logChannel = client.channels.cache.find(channel => channel.name === 'logs'); 

        if (logChannel) {
            logChannel.send(`🚨 Anti-Raid triggered! More than ${antiRaidSettings.joinThreshold} members joined in ${antiRaidSettings.timeFrame} seconds.`);
        }

        if (antiRaidSettings.autoBan) {
            const newMembers = antiRaidSettings.joinLog.length;
            for (const member of interaction.guild.members.cache.filter(m => !m.user.bot && (Date.now() - m.joinedTimestamp) < antiRaidSettings.timeFrame * 1000)) {
                try {
                    await member.ban({ reason: 'Raid prevention: too many members joined in a short time' });
                } catch (error) {
                    console.error(`Failed to ban ${member.user.tag}:`, error);
                }
            }

            if (logChannel) {
                logChannel.send(`✅ ${newMembers} members were automatically banned for triggering the Anti-Raid system.`);
            }
        }

        antiRaidSettings.joinLog = [];
        await client.db.set(`antiraid_${guildId}`, antiRaidSettings);
    }
});