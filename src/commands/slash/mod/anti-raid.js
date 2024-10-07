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
    .setName("antiraid")
    .setDescription("Advanced Anti-Raid system to prevent mass-joining raids")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("enable")
        .setDescription("Enable the anti-raid system")
        .addIntegerOption((option) =>
          option
            .setName("join_threshold")
            .setDescription("Number of members joining within a time frame")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("time_frame")
            .setDescription(
              "Time frame in seconds within which mass joins are detected"
            )
            .setRequired(true)
        )
        .addBooleanOption((option) =>
          option
            .setName("auto_ban")
            .setDescription("Automatically ban the users")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("disable")
        .setDescription("Disable the anti-raid system")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Check the current status of the anti-raid system")
    ),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const antiRaidSettings = (await db.get(`antiraid_${guildId}`)) || {
      enabled: false,
      joinThreshold: 0,
      timeFrame: 0,
      autoBan: false,
      joinLog: [],
    };

    if (subcommand === "enable") {
      const joinThreshold = interaction.options.getInteger("join_threshold");
      const timeFrame = interaction.options.getInteger("time_frame");
      const autoBan = interaction.options.getBoolean("auto_ban");

      antiRaidSettings.enabled = true;
      antiRaidSettings.joinThreshold = joinThreshold;
      antiRaidSettings.timeFrame = timeFrame;
      antiRaidSettings.autoBan = autoBan;
      antiRaidSettings.joinLog = [];

      await db.set(`antiraid_${guildId}`, antiRaidSettings);

      const embed = new EmbedBuilder()
        .setTitle("Anti-Raid System Enabled")
        .setDescription(
          "Anti-Raid system has been successfully enabled with the following settings:"
        )
        .addFields(
          {
            name: "Join Threshold",
            value: `${joinThreshold} members`,
            inline: true,
          },
          { name: "Time Frame", value: `${timeFrame} seconds`, inline: true },
          {
            name: "Auto-Ban",
            value: autoBan ? "Enabled" : "Disabled",
            inline: true,
          }
        )
        .setColor("Green")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "disable") {
      antiRaidSettings.enabled = false;
      await db.set(`antiraid_${guildId}`, antiRaidSettings);

      const embed = new EmbedBuilder()
        .setTitle("Anti-Raid System Disabled")
        .setColor("Red")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "status") {
      const statusMessage = antiRaidSettings.enabled
        ? "✅ Anti-Raid is currently **enabled** with the following settings:"
        : "❌ Anti-Raid is currently **disabled**.";

      const embed = new EmbedBuilder()
        .setTitle("Anti-Raid System Status")
        .setDescription(statusMessage)
        .addFields(
          {
            name: "Join Threshold",
            value: `${antiRaidSettings.joinThreshold} members`,
            inline: true,
          },
          {
            name: "Time Frame",
            value: `${antiRaidSettings.timeFrame} seconds`,
            inline: true,
          },
          {
            name: "Auto-Ban",
            value: antiRaidSettings.autoBan ? "Enabled" : "Disabled",
            inline: true,
          }
        )
        .setColor(antiRaidSettings.enabled ? "Green" : "Red")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
