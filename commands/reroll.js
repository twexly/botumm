const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'reroll',
    aliases: ['yenidencek', 'tekrarcek'],
    modOnly: true,
    async execute(message, client, args) {
        if (!message.guild) return;

        let targetMessageId = null;

        // 1. Yanıtlanan Mesaj Var mı?
        if (message.reference && message.reference.messageId) {
            targetMessageId = message.reference.messageId;
        } else if (args[0]) {
            targetMessageId = args[0];
        }

        if (!targetMessageId) {
            return message.reply("Lütfen sona ermiş çekiliş mesajını yanıtlayarak veya mesaj ID'sini belirterek komutu kullanın. (Örnek: `.reroll 1234567890`)");
        }

        // Çekilişi Bul
        let targetGiveaway = null;
        if (client.activeGiveaways) {
            for (const g of client.activeGiveaways.values()) {
                if (g.messageId === targetMessageId && g.guildId === message.guild.id) {
                    targetGiveaway = g;
                    break;
                }
            }
        }

        if (!targetGiveaway) {
            return message.reply("Belirtilen mesaja ait bir çekiliş kaydı bulunamadı.");
        }

        if (targetGiveaway.participants.length === 0) {
            return message.reply("Bu çekilişe hiç kimse katılmadığı için kazanan yeniden belirlenemiyor.");
        }

        // Rastgele Yeni Kazanan(lar) Seç
        const shuffled = [...targetGiveaway.participants].sort(() => 0.5 - Math.random());
        const count = Math.min(targetGiveaway.winnerCount, shuffled.length);
        const winners = shuffled.slice(0, count);

        const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

        await message.channel.send({
            content: `🎉 **[YENİDEN ÇEKİLİŞ]** Tebrikler ${winnerMentions}! **${targetGiveaway.prize}** çekilişinin yeni kazananı oldunuz!`
        });
    }
};
