import "dotenv/config";
import { Client, GatewayIntentBits, Events, Collection } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { games } from "./data/games.js";

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== CLIENT =====
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ===== LOAD COMMANDS =====
client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

const commandsJSON = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`./commands/${file}`);

    client.commands.set(command.data.name, command);
    commandsJSON.push(command.data.toJSON());
}

client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isButton()) return;
    console.log(interaction);

    if (interaction.commandName === Caro) {
        const player2 = interaction.channelId
    }
    // if (!interaction.customId.startsWith("caro_join_")) return;

    await interaction.deferReply({ ephemeral: true });
});

// ===== DEPLOY COMMANDS =====
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("🚀 Đang đẩy lệnh lên...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commandsJSON }
        );
        console.log("✅ Lệnh đã được đẩy lên nhe!");
    } catch (err) {
        console.error(err);
    }
})();

// ===== EVENTS =====
client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot online: ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.reply({ content: "❌ Có lỗi xảy ra", ephemeral: true });
    }
});

// ===== LOGIN =====
client.login(TOKEN);
