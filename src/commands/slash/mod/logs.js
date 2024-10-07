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
    .setName("logs")
    .setDescription("Manage logging settings for the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set a log channel for specific events")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel where logs will be sent")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("event")
            .setDescription(
              "The event to log (e.g., message_delete, member_ban)"
            )
            .setRequired(true)
            .addChoices(
              { name: "Message Delete", value: "messageDelete" },
              { name: "Member Ban", value: "guildBanAdd" },
              { name: "Member Unban", value: "guildBanRemove" },
              { name: "Message Edit", value: "messageUpdate" },
              { name: "Channel Create", value: "channelCreate" },
              { name: "Channel Delete", value: "channelDelete" },
              { name: "Role Create", value: "roleCreate" },
              { name: "Role Delete", value: "roleDelete" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("disable")
        .setDescription("Disable logging for a specific event")
        .addStringOption((option) =>
          option
            .setName("event")
            .setDescription("The event to disable logging for")
            .setRequired(true)
            .addChoices(
              { name: "Message Delete", value: "messageDelete" },
              { name: "Member Ban", value: "guildBanAdd" },
              { name: "Member Unban", value: "guildBanRemove" },
              { name: "Message Edit", value: "messageUpdate" },
              { name: "Channel Create", value: "channelCreate" },
              { name: "Channel Delete", value: "channelDelete" },
              { name: "Role Create", value: "roleCreate" },
              { name: "Role Delete", value: "roleDelete" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Check the current logging settings")
    ),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const logSettings = (await db.get(`logSettings_${guildId}`)) || {};

    if (subcommand === "set") {
      const logChannel = interaction.options.getChannel("channel");
      const logEvent = interaction.options.getString("event");

      logSettings[logEvent] = logChannel.id;
      await db.set(`logSettings_${guildId}`, logSettings);

      const embed = new EmbedBuilder()
        .setTitle("Logging Channel Set")
        .setDescription(
          `Logs for **${logEvent}** will now be sent to <#${logChannel.id}>.`
        )
        .setColor("GREEN")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subcommand === "disable") {
      const logEvent = interaction.options.getString("event");

      if (logSettings[logEvent]) {
        delete logSettings[logEvent];
        await db.set(`logSettings_${guildId}`, logSettings);

        const embed = new EmbedBuilder()
          .setTitle("Logging Disabled")
          .setDescription(`Logging for **${logEvent}** has been disabled.`)
          .setColor("RED")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = new EmbedBuilder()
          .setTitle("Logging Status")
          .setDescription(
            `Logging for **${logEvent}** is not currently enabled.`
          )
          .setColor("YELLOW")
          .setFooter({ text: "Dev By Daser" });

        interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subcommand === "status") {
      const enabledLogs =
        Object.keys(logSettings)
          .map((event) => `- **${event}**: <#${logSettings[event]}>`)
          .join("\n") || "No logs are currently enabled.";

      const embed = new EmbedBuilder()
        .setTitle("Current Logging Settings")
        .setDescription(`📊 **Current Logging Settings:**\n${enabledLogs}`)
        .setColor("BLUE")
        .setFooter({ text: "Dev By Daser" });

      interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Log event handlers
    client.on("messageDelete", async (message) => {
      if (!logSettings.messageDelete || message.author.bot) return;
      const logChannel = client.channels.cache.get(logSettings.messageDelete);
      if (!logChannel) return;

      logChannel.send({
        content: `🗑️ **Message Deleted**\n**Author:** ${
          message.author.tag
        }\n**Channel:** <#${message.channel.id}>\n**Content:** ${
          message.content || "No content"
        }`,
      });
    });

    client.on("guildBanAdd", async (ban) => {
      if (!logSettings.guildBanAdd) return;
      const logChannel = client.channels.cache.get(logSettings.guildBanAdd);
      if (!logChannel) return;

      logChannel.send({
        content: `🚫 **Member Banned**\n**User:** ${ban.user.tag}`,
      });
    });

    client.on("guildBanRemove", async (ban) => {
      if (!logSettings.guildBanRemove) return;
      const logChannel = client.channels.cache.get(logSettings.guildBanRemove);
      if (!logChannel) return;

      logChannel.send({
        content: `✅ **Member Unbanned**\n**User:** ${ban.user.tag}`,
      });
    });

    client.on("messageUpdate", async (oldMessage, newMessage) => {
      if (
        !logSettings.messageUpdate ||
        oldMessage.author.bot ||
        oldMessage.content === newMessage.content
      )
        return;
      const logChannel = client.channels.cache.get(logSettings.messageUpdate);
      if (!logChannel) return;

      logChannel.send({
        content: `✏️ **Message Edited**\n**Author:** ${
          oldMessage.author.tag
        }\n**Channel:** <#${oldMessage.channel.id}>\n**Before:** ${
          oldMessage.content || "No content"
        }\n**After:** ${newMessage.content || "No content"}`,
      });
    });

    client.on("channelCreate", async (channel) => {
      if (!logSettings.channelCreate) return;
      const logChannel = client.channels.cache.get(logSettings.channelCreate);
      if (!logChannel) return;

      logChannel.send({
        content: `📥 **Channel Created**\n**Channel:** ${channel.name} (${channel.type})\n**ID:** ${channel.id}`,
      });
    });

    client.on("channelDelete", async (channel) => {
      if (!logSettings.channelDelete) return;
      const logChannel = client.channels.cache.get(logSettings.channelDelete);
      if (!logChannel) return;

      logChannel.send({
        content: `🗑️ **Channel Deleted**\n**Channel:** ${channel.name}\n**ID:** ${channel.id}`,
      });
    });

    client.on("roleCreate", async (role) => {
      if (!logSettings.roleCreate) return;
      const logChannel = client.channels.cache.get(logSettings.roleCreate);
      if (!logChannel) return;

      logChannel.send({
        content: `🔧 **Role Created**\n**Role:** ${role.name}\n**ID:** ${role.id}`,
      });
    });

    client.on("roleDelete", async (role) => {
      if (!logSettings.roleDelete) return;
      const logChannel = client.channels.cache.get(logSettings.roleDelete);
      if (!logChannel) return;

      logChannel.send({
        content: `🗑️ **Role Deleted**\n**Role:** ${role.name}\n**ID:** ${role.id}`,
      });
    });
  },
};
