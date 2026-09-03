const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

const ICONS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];

const MULTIPLIERS = {
    '7️⃣': 25,
    '💎': 12,
    '🔔': 6,
    '🍇': 4,
    '🍋': 3,
    '🍒': 2
};

module.exports = {
    name: 'slot',
    aliases: ['s', 'slots', 'kumar'],
    description: 'Slot makinesinde şansınızı deneyin.',
    async execute(message, client, args) {
        const userId = message.author.id;
        const eco = client.getEconomyStats(userId);

        if (!args[0]) {
            return message.reply({
                content: `${emojis.cross} Ne kadar bahis oynamak istediğini yazmalısın!\n*Örnek:* \`.slot 100\` veya \`.slot hepsi\``
            });
        }

        let bet = 0;
        if (args[0].toLowerCase() === 'hepsi' || args[0].toLowerCase() === 'all') {
            bet = eco.balance || 0;
        } else {
            bet = parseInt(args[0], 10);
        }

        if (isNaN(bet) || bet < 20) {
            return message.reply({
                content: `${emojis.cross} Minimum bahis tutarı **20 ₺** olmalıdır!`
            });
        }

        if (bet > 100000) {
            return message.reply({
                content: `${emojis.cross} Tek seferde en fazla **100.000 ₺** bahis oynayabilirsin!`
            });
        }

        if ((eco.balance || 0) < bet) {
            return message.reply({
                content: `${emojis.cross} Yeterli nakit paran yok! Mevcut nakitin: **${(eco.balance || 0).toLocaleString('tr-TR')} ₺**`
            });
        }

        // Bahsi düş
        eco.balance -= bet;

        // Slot Çarklarını Çevir
        const r1 = ICONS[Math.floor(Math.random() * ICONS.length)];
        const r2 = ICONS[Math.floor(Math.random() * ICONS.length)];
        const r3 = ICONS[Math.floor(Math.random() * ICONS.length)];

        let won = 0;
        let resultTitle = '';
        let multiplier = 0;

        if (r1 === r2 && r2 === r3) {
            // 3'lü Eşleşme (Büyük Kazanç)
            multiplier = MULTIPLIERS[r1] || 3;
            won = bet * multiplier;
            resultTitle = r1 === '7️⃣' ? '🎰 JACKPOT! ÜÇLÜ YEDİ! 🎉' : `🎉 TEBRİKLER! ${multiplier}X KAZANDIN!`;
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            // 2'li Eşleşme (Teselli Kazancı)
            multiplier = 1.5;
            won = Math.floor(bet * multiplier);
            resultTitle = '✨ İkili Eşleşme! 1.5x Kazandın!';
        } else {
            // Kayıp
            resultTitle = '❌ Maalesef Kaybettin...';
        }

        if (won > 0) {
            eco.balance += won;
        }
        client.saveDatabase();

        const slotBoard = 
            `╔═══════════════╗\n` +
            `║  ${r1}  │  ${r2}  │  ${r3}  ║\n` +
            `╚═══════════════╝`;

        const netChange = won > 0 ? `+${(won - bet).toLocaleString('tr-TR')}` : `-${bet.toLocaleString('tr-TR')}`;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${resultTitle}`),
                new TextDisplayBuilder().setContent(
                    `\`\`\`\n${slotBoard}\n\`\`\`\n` +
                    `${emojis.matter} **Oynanan Bahis:** \`${bet.toLocaleString('tr-TR')} ₺\`\n` +
                    `${emojis.matter} **Net Değişim:** \`${netChange} ₺\`\n` +
                    `${emojis.matter} **Güncel Nakitin:** \`${eco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                    `> *Şansını tekrar denemek için \`.slot ${bet}\` yazabilirsin.*`
                )
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
