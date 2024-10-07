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
    .setName("whitelist")
    .setDescription("Manage the server whitelist")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a user to the whitelist")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to whitelist")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a user from the whitelist")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to remove from the whitelist")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all users currently whitelisted")
    ),

  /**
   * @param {ExtendedClient} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    let whitelist = (await db.get(`whitelist_${guildId}`)) || [];

    if (subcommand === "add") {
      const user = interaction.options.getUser("user");

      if (whitelist.includes(user.id)) {
        return interaction.reply({
          content: `⚠️ **${user.tag}** is already on the whitelist.`,
          ephemeral: true,
        });
      }

      whitelist.push(user.id);
      await db.set(`whitelist_${guildId}`, whitelist);

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Whitelist Management")
        .setDescription(`✅ **${user.tag}** has been added to the whitelist.`)
        .setFooter({ text: 'Dev By Daser' });

      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });

      const logChannel = client.channels.cache.find(
        (channel) => channel.name === "whitelist-logs"
      );
      if (logChannel) {
        logChannel.send({
          embeds: [embed],
        });
      }
    } else if (subcommand === "remove") {
      const user = interaction.options.getUser("user");

      if (!whitelist.includes(user.id)) {
        return interaction.reply({
          content: `⚠️ **${user.tag}** is not on the whitelist.`,
          ephemeral: true,
        });
      }

      whitelist = whitelist.filter((id) => id !== user.id);
      await db.set(`whitelist_${guildId}`, whitelist);

      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Whitelist Management")
        .setDescription(
          `❌ **${user.tag}** has been removed from the whitelist.`
        )
        .setFooter({ text: 'Dev By Daser' });

      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });

      const logChannel = client.channels.cache.find(
        (channel) => channel.name === "whitelist-logs"
      );
      if (logChannel) {
        logChannel.send({
          embeds: [embed],
        });
      }
    } else if (subcommand === "list") {
      const whitelistedUsers = await Promise.all(
        whitelist.map(async (id) => {
          const user = await client.users.fetch(id);
          return user.tag;
        })
      );

      const embed = new EmbedBuilder()
        .setColor("#7289DA")
        .setTitle("Whitelist Management")
        .setDescription(
          whitelistedUsers.length > 0
            ? `📜 **Whitelist:**\n${whitelistedUsers.join("\n")}`
            : "ℹ️ The whitelist is currently empty."
        )
        .setFooter({ text: 'Dev By Daser' });

      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
