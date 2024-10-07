const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Moderation actions for server management")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ban")
        .setDescription("Ban a user from the server")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to ban")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for the ban")
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("duration")
            .setDescription("Duration of the ban in days (optional)")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kick")
        .setDescription("Kick a user from the server")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to kick")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for the kick")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("mute")
        .setDescription("Mute a user in the server")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to mute")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for the mute")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unmute")
        .setDescription("Unmute a user in the server")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("The user to unmute")
            .setRequired(true)
        )
    ),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const member = await interaction.guild.members.fetch(target.id);
    const logChannel = client.channels.cache.find(
      (channel) => channel.name === "moderation-logs"
    );

    if (!member) {
      return interaction.reply({
        content: "⚠️ Could not find that member.",
        ephemeral: true,
      });
    }

    switch (subcommand) {
      case "ban": {
        const duration = interaction.options.getInteger("duration") || 0;

        if (!member.bannable) {
          return interaction.reply({
            content: "❌ I cannot ban this user.",
            ephemeral: true,
          });
        }

        await member.ban({ days: duration, reason });

        const embed = new EmbedBuilder()
          .setTitle("User Banned")
          .setDescription(
            `✅ ${target.tag} has been banned.\n**Reason:** ${reason}\n**Duration:** ${duration} days`
          )
          .setColor("RED")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed] });

        if (logChannel) {
          logChannel.send({
            content: `🚫 **Ban Action**\n**User:** ${target.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Duration:** ${duration} days`,
          });
        }
        break;
      }

      case "kick": {
        if (!member.kickable) {
          return interaction.reply({
            content: "❌ I cannot kick this user.",
            ephemeral: true,
          });
        }

        await member.kick(reason);

        const embed = new EmbedBuilder()
          .setTitle("User Kicked")
          .setDescription(
            `✅ ${target.tag} has been kicked.\n**Reason:** ${reason}`
          )
          .setColor("ORANGE")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed] });

        if (logChannel) {
          logChannel.send({
            content: `👢 **Kick Action**\n**User:** ${target.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
          });
        }
        break;
      }

      case "mute": {
        const muteRole = interaction.guild.roles.cache.find(
          (role) => role.name === "Muted"
        );
        if (!muteRole) {
          return interaction.reply({
            content: '❌ There is no "Muted" role in this server.',
            ephemeral: true,
          });
        }

        if (member.roles.cache.has(muteRole.id)) {
          return interaction.reply({
            content: "⚠️ This user is already muted.",
            ephemeral: true,
          });
        }

        await member.roles.add(muteRole);

        const embed = new EmbedBuilder()
          .setTitle("User Muted")
          .setDescription(
            `🔇 ${target.tag} has been muted.\n**Reason:** ${reason}`
          )
          .setColor("BLUE")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed] });

        if (logChannel) {
          logChannel.send({
            content: `🔇 **Mute Action**\n**User:** ${target.tag}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
          });
        }
        break;
      }

      case "unmute": {
        const muteRole = interaction.guild.roles.cache.find(
          (role) => role.name === "Muted"
        );
        if (!muteRole) {
          return interaction.reply({
            content: '❌ There is no "Muted" role in this server.',
            ephemeral: true,
          });
        }

        if (!member.roles.cache.has(muteRole.id)) {
          return interaction.reply({
            content: "⚠️ This user is not muted.",
            ephemeral: true,
          });
        }

        await member.roles.remove(muteRole);

        const embed = new EmbedBuilder()
          .setTitle("User Unmuted")
          .setDescription(`🔊 ${target.tag} has been unmuted.`)
          .setColor("GREEN")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed] });

        if (logChannel) {
          logChannel.send({
            content: `🔊 **Unmute Action**\n**User:** ${target.tag}\n**Moderator:** ${interaction.user.tag}`,
          });
        }
        break;
      }
    }
  },
};
