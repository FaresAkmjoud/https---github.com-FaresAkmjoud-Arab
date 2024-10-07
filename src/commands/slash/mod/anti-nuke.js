const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const ExtendedClient = require("../../../class/ExtendedClient");
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription(
      "Advanced Anti-Nuke system to protect the server from raids"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enable")
        .setDescription("Enable the anti-nuke system ")
        .addIntegerOption((option) =>
          option
            .setName("kick_threshold")
            .setDescription("Number of kicks within a time frame")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("ban_threshold")
            .setDescription("Number of bans within a time frame")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("role_delete_threshold")
            .setDescription("Number of role deletions within a time frame")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("channel_delete_threshold")
            .setDescription("Number of channel deletions within a time frame")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("disable")
        .setDescription("Disable the anti-nuke system")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Check the current status of the anti-nuke system")
    ),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const antiNukeSettings = (await db.get(`antinuke_${guildId}`)) || {
      enabled: false,
      kickThreshold: 0,
      banThreshold: 0,
      roleDeleteThreshold: 0,
      channelDeleteThreshold: 0,
    };

    if (subcommand === "enable") {
      const kickThreshold = interaction.options.getInteger("kick_threshold");
      const banThreshold = interaction.options.getInteger("ban_threshold");
      const roleDeleteThreshold = interaction.options.getInteger(
        "role_delete_threshold"
      );
      const channelDeleteThreshold = interaction.options.getInteger(
        "channel_delete_threshold"
      );

      antiNukeSettings.enabled = true;
      antiNukeSettings.kickThreshold = kickThreshold;
      antiNukeSettings.banThreshold = banThreshold;
      antiNukeSettings.roleDeleteThreshold = roleDeleteThreshold;
      antiNukeSettings.channelDeleteThreshold = channelDeleteThreshold;

      await db.set(`antinuke_${guildId}`, antiNukeSettings);

      const embed = new EmbedBuilder()
        .setTitle("Anti-Nuke System Enabled")
        .setDescription(`Thresholds have been set as follows:`)
        .addFields(
          {
            name: "Kick Threshold",
            value: kickThreshold.toString(),
            inline: true,
          },
          {
            name: "Ban Threshold",
            value: banThreshold.toString(),
            inline: true,
          },
          {
            name: "Role Delete Threshold",
            value: roleDeleteThreshold.toString(),
            inline: true,
          },
          {
            name: "Channel Delete Threshold",
            value: channelDeleteThreshold.toString(),
            inline: true,
          }
        )
        .setColor("Green")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "disable") {
      antiNukeSettings.enabled = false;
      await db.set(`antinuke_${guildId}`, antiNukeSettings);

      const embed = new EmbedBuilder()
        .setTitle("Anti-Nuke System Disabled")
        .setColor("Red")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "status") {
      const statusMessage = antiNukeSettings.enabled
        ? `✅ Anti-Nuke is currently **enabled** with the following thresholds:`
        : "❌ Anti-Nuke is currently **disabled**.";

      const embed = new EmbedBuilder()
        .setTitle("Anti-Nuke System Status")
        .setDescription(statusMessage)
        .addFields(
          {
            name: "Kick Threshold",
            value: antiNukeSettings.kickThreshold.toString(),
            inline: true,
          },
          {
            name: "Ban Threshold",
            value: antiNukeSettings.banThreshold.toString(),
            inline: true,
          },
          {
            name: "Role Delete Threshold",
            value: antiNukeSettings.roleDeleteThreshold.toString(),
            inline: true,
          },
          {
            name: "Channel Delete Threshold",
            value: antiNukeSettings.channelDeleteThreshold.toString(),
            inline: true,
          }
        )
        .setColor(antiNukeSettings.enabled ? "Green" : "Red")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
