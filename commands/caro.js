import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("caro")
    .setDescription("Tạo trận cờ caro");

export async function execute(interaction) {
    const joinBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("caro_join")
            .setLabel("Tham gia làm Player 2")
            .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
        content:
            `🎮 **Trận cờ caro**\n\n` +
            `❌ Player 1: ${interaction.user}\n` +
            `⭕ Player 2: _Chưa có_\n\n` +
            `👉 Nhấn nút để tham gia`,
        components: [joinBtn]
    });
}
