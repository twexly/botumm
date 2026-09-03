const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

function formatTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    const parts = [];
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0) parts.push(`${minutes} dakika`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} saniye`);
    return parts.join(' ');
}

module.exports = {
    name: 'günlük',
    aliases: ['gunluk', 'daily', 'maas', 'maaş'],
    description: 'Günlük para ödülünüzü almanızı sağlar (24 saatte bir).',
    async execute(message, client) {
        const userId = message.author.id;
        const eco = client.getEconomyStats(userId);
        const stats = client.userStats.get(userId);

        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        const lastDaily = eco.dailyCooldown || 0;

        if (now - lastDaily < cooldown) {
            const remaining = cooldown - (now - lastDaily);
            const waitContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# ⏳ Günlük Maaş Henüz Hazır Değil'),
                    new TextDisplayBuilder().setContent(
                        `${emojis.cross} Günlük ödülünü zaten aldın!\n\n` +
                        `${emojis.matter} Tekrar alabilmek için: **${formatTime(remaining)}** beklemelisin.`
                    )
                );

            return message.channel.send({
                components: [waitContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }

        // Seviyeye göre bonus: 500-1500 taban + level * 50
        const base = Math.floor(Math.random() * 1001) + 500;
        const levelBonus = (stats.level || 1) * 50;
        const reward = base + levelBonus;

        eco.balance = (eco.balance || 0) + reward;
        eco.dailyCooldown = now;
        client.saveDatabase();

        const successContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🎁 Günlük Maaş Alındı!'),
                new TextDisplayBuilder().setContent(
                    `Tebrikler ${message.author}! Günlük ödülün hesabına aktarıldı.\n\n` +
                    `${emojis.matter} **Kazanılan Miktar:** \`+${reward.toLocaleString('tr-TR')} ₺\`\n` +
                    `${emojis.matter} **Seviye Bonusu:** \`+${levelBonus} ₺\` (Seviye ${stats.level || 1})\n` +
                    `${emojis.matter} **Yeni Nakit Bakiyen:** \`${eco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                    `> *24 saat sonra tekrar gelerek yeni maaşını alabilirsin!*`
                )
            );

        return message.channel.send({
            components: [successContainer],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
