const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'zenginler',
    aliases: ['baltop', 'leaderboard', 'sıralama', 'eniyiler'],
    description: 'Sunucunun en zengin 10 üyesini listeler.',
    async execute(message, client) {
        await message.guild.members.fetch().catch(() => {});
        const guildMemberIds = new Set(message.guild.members.cache.keys());

        const sorted = Array.from(client.userStats?.entries() || [])
            .filter(([id]) => guildMemberIds.has(id))
            .map(([id, s]) => ({
                id,
                cash: s.balance || 0,
                bank: s.bank || 0,
                total: (s.balance || 0) + (s.bank || 0)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (sorted.length === 0) {
            return message.reply({
                content: `${emojis.cross} Sunucuda henüz bakiye kaydı olan üye bulunamadı.`
            });
        }

        const medals = ['🥇', '🥈', '🥉'];
        let descriptionLines = [];

        for (let i = 0; i < sorted.length; i++) {
            const entry = sorted[i];
            const member = message.guild.members.cache.get(entry.id);
            const medal = medals[i] || `\`#${i + 1}\``;
            const name = member ? member.user.username : 'Bilinmeyen Üye';

            descriptionLines.push(
                `${medal} **${name}**\n` +
                `${emojis.matter} Toplam: \`${entry.total.toLocaleString('tr-TR')} ₺\` • Cüzdan: \`${entry.cash.toLocaleString('tr-TR')} ₺\` • Banka: \`${entry.bank.toLocaleString('tr-TR')} ₺\``
            );
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# 👑 ${message.guild.name} — En Zenginler Listesi`),
                new TextDisplayBuilder().setContent(
                    descriptionLines.join('\n\n') +
                    `\n\n> *Kendi bakiyeni görmek için \`.bakiye\` yazabilirsin.*`
                )
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
