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

    const human1 = games.player1 = interaction.user.id;

    // đoạn này là bấm nút check xem lỗi không
    if (interaction.isButton()) {
        await interaction.deferReply({ ephemeral: true });

        // check xem có trùng player 1 không
        if (interaction.user.id === human1) {
            console.log(interaction.user.id);
            return interaction.editReply("❌ Bạn đã là Player 1 rồi");   
        };
    }

    // ===== BUTTON =====
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("caro_join_")) return;
    
    // ACK NGAY để Discord không timeout
    await interaction.deferReply({ ephemeral: true });
    const gameId = interaction.customId.replace("caro_join_", "");
    const game = games.get(gameId);

    console.log("chạy đến đây rồi!");


    if (!game) {
        return interaction.editReply("❌ Trận đã bị hủy hoặc không tồn tại");
    }
    
    // Đã có Player 2
    if (game.player2) {
        return interaction.editReply("❌ Trận đã đủ người");
    }

    // Join thành công
    game.player2 = interaction.user.id;
    game.turn = game.player1;

    await interaction.message.edit({
        content:
            `🎮 **Trận cờ caro**\n\n` +
            `❌ Player 1: <@${game.player1}>\n` +
            `⭕ Player 2: <@${game.player2}>\n\n` +
            `⏳ Lượt đi: <@${game.turn}>`,
        components: []
    });

    await interaction.editReply("✅ Bạn đã tham gia làm Player 2");
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
