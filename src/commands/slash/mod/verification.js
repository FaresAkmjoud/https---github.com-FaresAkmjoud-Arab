const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Setup the verification system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Role to give after verification')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where the verification message will be sent')
                .setRequired(true)),

    /**
     * @param {ExtendedClient} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const verificationRole = interaction.options.getRole('role');
        const verificationChannel = interaction.options.getChannel('channel');

        const verificationEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔒 Verify Yourself')
            .setDescription('Click the button below to verify yourself and gain access to the server!')
            .setFooter({ text: 'Verification System - Dev By Daser' });

        const verifyButton = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success);

        const actionRow = new ActionRowBuilder().addComponents(verifyButton);

        await verificationChannel.send({
            embeds: [verificationEmbed],
            components: [actionRow]
        });

        interaction.reply({
            content: `✅ The verification system has been set up in <#${verificationChannel.id}> with the role **${verificationRole.name}**.`,
            ephemeral: true
        });

        client.on('interactionCreate', async (buttonInteraction) => {
            if (!buttonInteraction.isButton()) return;
            if (buttonInteraction.customId !== 'verify') return;

            const member = buttonInteraction.member;
            if (member.roles.cache.has(verificationRole.id)) {
                return buttonInteraction.reply({
                    content: '⚠️ You are already verified!',
                    ephemeral: true
                });
            }

            try {
                await member.roles.add(verificationRole);

                await buttonInteraction.reply({
                    content: '✅ You have been verified and now have access to the server!',
                    ephemeral: true
                });

                const logChannel = client.channels.cache.find(channel => channel.name === 'verification-logs');
                if (logChannel) {
                    logChannel.send({
                        content: `✅ **${member.user.tag}** has been verified and given the **${verificationRole.name}** role.`
                    });
                }

            } catch (error) {
                console.error('Error assigning verification role:', error);
                await buttonInteraction.reply({
                    content: '❌ There was an error verifying you. Please contact an admin.',
                    ephemeral: true
                });
            }
        });
    }
};
