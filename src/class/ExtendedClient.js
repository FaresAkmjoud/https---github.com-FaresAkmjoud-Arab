const { Client, Partials, Collection, GatewayIntentBits } = require("discord.js");
const config = require('../config');
const commands = require("../handlers/commands");
const events = require("../handlers/events");
const deploy = require("../handlers/deploy");
const mongoose = require("../handlers/mongoose");

module.exports = class extends Client {
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        aliases: new Collection(),
    };
    applicationcommandsArray = [];

    constructor() {
        super({
            intents: 3276799, // Every intent
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User,
                Partials.ThreadMember
            ],
            presence: {
                activities: [{
                    name: 'something goes here',
                    type: 4,
                    state: 'Dev By Daser'
                }]
            }
        });
    };

    start = async () => {
        commands(this);
        events(this);

        if (config.handler.mongodb.enabled) mongoose();

        await this.login(process.env.CLIENT_TOKEN || config.client.token);

        if (config.handler.deploy) deploy(this, config);
    };
};