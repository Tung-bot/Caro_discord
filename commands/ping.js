import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Test bot");

export async function execute(interaction) {
    await interaction.reply("🏓 Pong!");
}
