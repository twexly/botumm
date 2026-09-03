const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');

const emojis = require('../emojis');

function parseArgs(str) {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
        matches.push(match[1] || match[2] || match[0]);
    }
    return matches;
}

function parseDuration(str) {
    if (!str) return null;
    const match = str.toLowerCase().match(/^(\d+)(s|sn|m|dk|h|sa|d|g)$/);
    if (!match) return null;
    const val = parseInt(match[1]);
    const unit = match[2];
    if (['s', 'sn'].includes(unit)) return val * 1000;
    if (['m', 'dk'].includes(unit)) return val * 60 * 1000;
    if (['h', 'sa'].includes(unit)) return val * 60 * 60 * 1000;
    if (['d', 'g'].includes(unit)) return val * 24 * 60 * 60 * 1000;
    return null;
}

module.exports = {
    name: 'cekilis',
    aliases: ['çekiliş', 'giveaway'],
    modOnly: true,
    async execute(message, client, args) {
        if (!message.guild) return;

        // Argümanları Tırnakları Koruyarak Ayrıştır
        const rawText = message.content.replace(/^[!.]\S+\s*/i, '').trim();
        const parsed = parseArgs(rawText);

        if (parsed.length < 3) {
            const guideContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🎉 Çekiliş Sistemi Kullanım Kılavuzu'),
                    new TextDisplayBuilder().setContent(
                        'Lütfen çekiliş komutunu aşağıdaki formatta kullanın:\n\n' +
                        '👉 **`.cekilis <Ödül> <KişiSayısı> <Süre> <Açıklama>`**\n\n' +
                        '**Örnekler:**\n' +
                        `${emojis.matter} \`.cekilis Nitro 1 30m Sunucumuza özel Discord Nitro çekilişi!\`\n` +
                        `${emojis.matter} \`.cekilis "1 Aylık Spotify" 3 2h Müzik severlere özel hediye!\`\n` +
                        `${emojis.matter} \`.cekilis VIP_Rol 2 1d Sunucu aktiflik ödülü!\`\n\n` +
                        '**Süre Formatları:** `s` / `sn` (saniye), `m` / `dk` (dakika), `h` / `sa` (saat), `d` / `g` (gün)'
                    )
                );

            return message.reply({ components: [guideContainer], flags: MessageFlags.IsComponentsV2 });
        }

        const prize = parsed[0];
        const winnerCount = parseInt(parsed[1]);
        const durationMs = parseDuration(parsed[2]);
        const description = parsed.slice(3).join(' ') || 'Katılmak için aşağıdaki butona basabilirsiniz!';

        if (!winnerCount || isNaN(winnerCount) || winnerCount < 1) {
            return message.reply(`${emojis.cross} Lütfen geçerli bir kazanan kişi sayısı belirtin. (Örn: \`1\`, \`2\`, \`5\`)`);
        }

        if (!durationMs || durationMs < 10000) {
            return message.reply(`${emojis.cross} Lütfen geçerli bir süre belirtin (en az 10 saniye). Örnek: \`30s\`, \`10m\`, \`2h\`, \`1d\``);
        }

        const endTime = Date.now() + durationMs;
        const endTimestamp = Math.floor(endTime / 1000);
        const giveawayId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        // Çekiliş Container Tasarımı
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# 🎉 ${prize}`),
                new TextDisplayBuilder().setContent(
                    `${description}\n\n` +
                    `${emojis.matter} **Kazanan Sayısı:** ${winnerCount} Kişi\n` +
                    `${emojis.matter} **Bitiş Zamanı:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
                    `${emojis.matter} **Başlatan:** ${message.author}\n` +
                    `${emojis.matter} **Katılımcı Sayısı:** 0`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder());

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveawayId}`)
                .setLabel('Katıl (0)')
                .setStyle(ButtonStyle.Primary)
        );
        container.addActionRowComponents(row);

        try {
            const giveawayMessage = await message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

            // Komut mesajını temizle
            message.delete().catch(() => {});

            // Çekiliş Verisini Kaydet
            const giveawayData = {
                id: giveawayId,
                messageId: giveawayMessage.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                prize,
                winnerCount,
                description,
                endTime,
                authorId: message.author.id,
                participants: [],
                ended: false
            };

            if (!client.activeGiveaways) client.activeGiveaways = new Map();
            client.activeGiveaways.set(giveawayId, giveawayData);
            client.saveGiveaways();

            // Bitiş Zamanlayıcısı
            client.scheduleGiveaway(giveawayData);

        } catch (error) {
            console.error("Çekiliş başlatma hatası:", error);
            message.reply("Çekiliş başlatılırken bir hata meydana geldi.");
        }
    }
};
