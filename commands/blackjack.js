const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const val of VALUES) {
            deck.push({ suit, val });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function calculateHand(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.val === 'A') {
            aces++;
            score += 11;
        } else if (['K', 'Q', 'J'].includes(card.val)) {
            score += 10;
        } else {
            score += parseInt(card.val, 10);
        }
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

function formatHand(hand, hideSecond = false) {
    if (hideSecond && hand.length > 1) {
        return `\`${hand[0].suit} ${hand[0].val}\`  \`🂠 ?\``;
    }
    return hand.map(c => `\`${c.suit} ${c.val}\``).join('  ');
}

module.exports = {
    name: 'blackjack',
    aliases: ['bj', '21'],
    description: 'Krupiyeye karşı klasik Blackjack (21) oyunu oynarsınız.',
    async execute(message, client, args) {
        const userId = message.author.id;
        const eco = client.getEconomyStats(userId);

        if (!client.activeBlackjack) {
            client.activeBlackjack = new Map();
        }

        if (client.activeBlackjack.has(userId)) {
            return message.reply({
                content: `${emojis.cross} Halihazırda devam eden bir Blackjack oyunun var! Lütfen önce onu tamamla.`
            });
        }

        if (!args[0]) {
            return message.reply({
                content: `${emojis.cross} Oynamak istediğin bahis miktarını yazmalısın!\n*Örnek:* \`.blackjack 250\` veya \`.bj hepsi\``
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

        eco.balance -= bet;
        client.saveDatabase();

        const deck = createDeck();
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        const playerScore = calculateHand(playerHand);
        const dealerScore = calculateHand(dealerHand);

        // Doğal Blackjack kontrolü
        if (playerScore === 21) {
            if (dealerScore === 21) {
                // Beraberlik (Push)
                eco.balance += bet;
                client.saveDatabase();
                const tieContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🤝 BERABERE! (Çift Blackjack)'),
                        new TextDisplayBuilder().setContent(
                            `Hem senin hem de krupîyenin eli 21!\n\n` +
                            `• **Senin Elin (21):** ${formatHand(playerHand)}\n` +
                            `• **Krupiye Eli (21):** ${formatHand(dealerHand)}\n\n` +
                            `${emojis.matter} **Bahis İade:** \`${bet.toLocaleString('tr-TR')} ₺\`\n` +
                            `${emojis.matter} **Güncel Bakiyen:** \`${eco.balance.toLocaleString('tr-TR')} ₺\``
                        )
                    );
                return message.channel.send({ components: [tieContainer], flags: MessageFlags.IsComponentsV2 });
            } else {
                // Oyuncu Doğal Blackjack (3:2 = 2.5x)
                const winAmt = Math.floor(bet * 2.5);
                eco.balance += winAmt;
                client.saveDatabase();
                const bjContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🃏 BLACKJACK! (Doğal 21 Kazancı) 🎉'),
                        new TextDisplayBuilder().setContent(
                            `İlk elde 21 yaparak muazzam bir kazanç sağladın!\n\n` +
                            `• **Senin Elin (21):** ${formatHand(playerHand)}\n` +
                            `• **Krupiye Eli (${dealerScore}):** ${formatHand(dealerHand)}\n\n` +
                            `${emojis.matter} **Kazanılan Miktar:** \`+${(winAmt - bet).toLocaleString('tr-TR')} ₺\` (3:2 Payout)\n` +
                            `${emojis.matter} **Güncel Bakiyen:** \`${eco.balance.toLocaleString('tr-TR')} ₺\``
                        )
                    );
                return message.channel.send({ components: [bjContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }

        // Oyunu başlat ve butonları hazırla
        const gameContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 🃏 Blackjack Masası (21)'),
                new TextDisplayBuilder().setContent(
                    `Krupiyeye karşı oynuyorsun, 21'e en yakın olan kazanır!\n\n` +
                    `• **Senin Elin (${playerScore}):** ${formatHand(playerHand)}\n` +
                    `• **Krupiye Eli (?):** ${formatHand(dealerHand, true)}\n\n` +
                    `${emojis.matter} **Bahis Tutarı:** \`${bet.toLocaleString('tr-TR')} ₺\`\n\n` +
                    `> *Bir kart daha almak için **Kart Çek**, elini tutmak için **Dur** butonuna bas.*`
                )
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`bj_hit_${userId}`)
                .setLabel('Kart Çek (Hit)')
                .setEmoji('🃏')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`bj_stand_${userId}`)
                .setLabel('Dur (Stand)')
                .setEmoji('🛑')
                .setStyle(ButtonStyle.Success)
        );

        gameContainer.addActionRowComponents(row);

        const gameMsg = await message.channel.send({
            components: [gameContainer],
            flags: MessageFlags.IsComponentsV2
        });

        // Oyunu hafızaya kaydet (60 saniye zaman aşımı)
        const timeout = setTimeout(() => {
            if (client.activeBlackjack.has(userId)) {
                client.activeBlackjack.delete(userId);
                gameMsg.edit({
                    components: [
                        new ContainerBuilder().addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# ⏰ Blackjack Zaman Aşımı'),
                            new TextDisplayBuilder().setContent(`Zamanında hamle yapmadığın için bahis (${bet} ₺) masada kaldı.`)
                        )
                    ],
                    flags: MessageFlags.IsComponentsV2
                }).catch(() => {});
            }
        }, 60000);

        client.activeBlackjack.set(userId, {
            deck,
            playerHand,
            dealerHand,
            bet,
            messageId: gameMsg.id,
            channelId: message.channel.id,
            timeout
        });
    }
};
