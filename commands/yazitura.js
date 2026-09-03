const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'yazıtura',
    aliases: ['yazitura', 'cf', 'coinflip'],
    description: 'Yazı tura atarak paranızı ikiye katlamaya çalışırsınız.',
    async execute(message, client, args) {
        const userId = message.author.id;
        const eco = client.getEconomyStats(userId);

        if (!args[0] || !args[1]) {
            return message.reply({
                content: `${emojis.cross} Hatalı kullanım!\n*Kullanım:* \`.yazıtura <yazı/tura> <miktar>\`\n*Örnek:* \`.yazıtura yazı 200\``
            });
        }

        const choiceInput = args[0].toLowerCase();
        let userChoice = null;
        if (choiceInput === 'yazı' || choiceInput === 'yazi' || choiceInput === 'y') {
            userChoice = 'yazı';
        } else if (choiceInput === 'tura' || choiceInput === 't') {
            userChoice = 'tura';
        } else {
            return message.reply({
                content: `${emojis.cross} Lütfen geçerli bir seçim yap: \`yazı\` veya \`tura\`!`
            });
        }

        let bet = 0;
        if (args[1].toLowerCase() === 'hepsi' || args[1].toLowerCase() === 'all') {
            bet = eco.balance || 0;
        } else {
            bet = parseInt(args[1], 10);
        }

        if (isNaN(bet) || bet < 20) {
            return message.reply({
                content: `${emojis.cross} Minimum bahis tutarı **20 ₺** olmalıdır!`
            });
        }

        if ((eco.balance || 0) < bet) {
            return message.reply({
                content: `${emojis.cross} Yeterli nakit paran yok! Mevcut nakitin: **${(eco.balance || 0).toLocaleString('tr-TR')} ₺**`
            });
        }

        eco.balance -= bet;

        const outcome = Math.random() < 0.5 ? 'yazı' : 'tura';
        const isWin = outcome === userChoice;

        let title = '';
        let netChange = '';

        if (isWin) {
            const won = bet * 2;
            eco.balance += won;
            title = '🪙 TEBRİKLER KAZANDIN! 🎉';
            netChange = `+${bet.toLocaleString('tr-TR')} ₺`;
        } else {
            title = '🪙 KAYBETTİN...';
            netChange = `-${bet.toLocaleString('tr-TR')} ₺`;
        }

        client.saveDatabase();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${title}`),
                new TextDisplayBuilder().setContent(
                    `Para havaya atıldı ve **${outcome.toUpperCase()}** geldi!\n\n` +
                    `${emojis.matter} **Senin Seçimin:** \`${userChoice.toUpperCase()}\`\n` +
                    `${emojis.matter} **Gelen Sonuç:** \`${outcome.toUpperCase()}\`\n` +
                    `${emojis.matter} **Oynanan Bahis:** \`${bet.toLocaleString('tr-TR')} ₺\`\n` +
                    `${emojis.matter} **Net Değişim:** \`${netChange}\`\n` +
                    `${emojis.matter} **Güncel Bakiyen:** \`${eco.balance.toLocaleString('tr-TR')} ₺\``
                )
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
