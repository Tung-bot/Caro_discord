import "dotenv/config";
import {
    Client, GatewayIntentBits, Events, Collection, ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
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
    intents: [GatewayIntentBits.Guilds,]
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

    const gameId = interaction.id;
    const game = games.get(gameId);
    games.set(gameId, {
        player1: interaction.user.id,
        player2: null,
        turn: null,
    });

    new ButtonBuilder()
        .setCustomId(`caro_join_${gameId}`)
        .setLabel("Tham gia làm Player 2")
        .setStyle(ButtonStyle.Primary);

    await interaction.deferReply({ ephemeral: true });

    console.log("JOIN GAME:", gameId);
    console.log("GAME DATA:", games.get(gameId));

    if (!game) {
        return interaction.editReply("❌ Trận đã bị hủy hoặc không tồn tại");
    }

    if (interaction.user.id === game.player1) {
        return interaction.editReply("❌ Bạn đã là Player 1 rồi");
    }

    if (game.player2) {
        return interaction.editReply("❌ Trận đã đủ người");
    }
    
    game.player2 = interaction.id;
    game.turn = game.player1;

    console.log(game.player2);
    if (!interaction.customId.startsWith("caro_join_")) return;


    if (game.player2) {
        return interaction.editReply("❌ Trận đã đủ người");
    }


    return interaction.editReply("✅ Bạn đã tham gia làm Player 2");
});


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

// ===== LOGIN =====
client.login(TOKEN);
