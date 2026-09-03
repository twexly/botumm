const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MediaGalleryBuilder, 
    MessageFlags, 
    AttachmentBuilder, 
    ChannelType 
} = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

async function generateSayCard(guild, stats) {
    const width = 1000;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Köşeleri Kırp ve Arka Plan
    drawRoundRect(ctx, 0, 0, width, height, 28);
    ctx.clip();

    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090a10');
    bgGrad.addColorStop(0.5, '#101322');
    bgGrad.addColorStop(1, '#07080d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Arka plan neon bokeh ışıkları
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath(); ctx.arc(160, 120, 160, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
    ctx.beginPath(); ctx.arc(840, 150, 180, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.beginPath(); ctx.arc(500, 480, 180, 0, Math.PI * 2); ctx.fill();

    // Dış İnce Çerçeve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 26);
    ctx.stroke();

    // 2. Sunucu İkonu
    const iconSize = 64;
    const iconX = 50;
    const iconY = 40;

    let iconLoaded = false;
    const iconUrl = guild.iconURL({ extension: 'png', size: 256 });
    if (iconUrl) {
        try {
            const iconImg = await loadImage(iconUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);
            ctx.restore();

            // İkon neon halkası
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
            ctx.stroke();
            iconLoaded = true;
        } catch (e) {
            iconLoaded = false;
        }
    }

    if (!iconLoaded) {
        // İkon yoksa renkli harf avatarı
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.restore();

        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(guild.name.charAt(0).toUpperCase(), iconX + iconSize / 2, iconY + iconSize / 2 + 10);
    }

    // 3. Başlık ve Sunucu İsmi
    const textStartX = iconX + iconSize + 20;
    ctx.textAlign = 'left';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffffff';

    const maxTitleW = width - textStartX - 50;
    let fittedName = guild.name;
    while (ctx.measureText(fittedName).width > maxTitleW && fittedName.length > 5) {
        fittedName = fittedName.slice(0, -2);
    }
    if (fittedName !== guild.name) fittedName += '...';
    ctx.fillText(fittedName, textStartX, 66);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Sunucu Genel İstatistikleri ve Sayım Kartı', textStartX, 94);

    // 4. 4 Büyük İstatistik Kartı
    const cardData = [
        {
            title: 'TOPLAM ÜYE',
            val: stats.totalMembers.toLocaleString('tr-TR'),
            sub: `👤 ${stats.humans.toLocaleString('tr-TR')} Üye  •  🤖 ${stats.bots} Bot  •  🔊 ${stats.voiceCount} Seste`,
            color: '#6366f1',
            iconBg: 'rgba(99, 102, 241, 0.2)'
        },
        {
            title: 'KANALLAR',
            val: stats.totalChannels.toString(),
            sub: `💬 ${stats.textChannels} Metin  •  🔊 ${stats.voiceChannels} Ses  •  📁 ${stats.categories} Kategori`,
            color: '#38bdf8',
            iconBg: 'rgba(56, 189, 248, 0.2)'
        },
        {
            title: 'ROLLER',
            val: stats.totalRoles.toString(),
            sub: `🛡️ Sunucuya özel tanımlı ${stats.totalRoles} adet rol`,
            color: '#ec4899',
            iconBg: 'rgba(236, 72, 153, 0.2)'
        },
        {
            title: 'BOOST & SEVİYE',
            val: `${stats.boostCount} Boost`,
            sub: `💎 Seviye ${stats.boostLevel} Sunucu Takviyesi`,
            color: '#a855f7',
            iconBg: 'rgba(168, 85, 247, 0.2)'
        }
    ];

    const cardW = 435;
    const cardH = 160;
    const startX = 50;
    const startY = 135;
    const gapX = 30;
    const gapY = 25;

    cardData.forEach((s, i) => {
        const x = startX + (i % 2) * (cardW + gapX);
        const y = startY + Math.floor(i / 2) * (cardH + gapY);

        // Kart Kutusu
        drawRoundRect(ctx, x, y, cardW, cardH, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Sol Renkli Vurgu Çizgisi
        drawRoundRect(ctx, x, y + 20, 6, cardH - 40, 3);
        ctx.fillStyle = s.color;
        ctx.fill();

        // Başlık Rozeti (Pill)
        drawRoundRect(ctx, x + 24, y + 22, 140, 26, 8);
        ctx.fillStyle = s.iconBg;
        ctx.fill();
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = s.color;
        ctx.textAlign = 'center';
        ctx.fillText(s.title, x + 94, y + 39);

        // Büyük Değer
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(s.val, x + 24, y + 98);

        // Alt Açıklama
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(s.sub, x + 24, y + 130);
    });

    // 5. Alt Bilgi
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'right';
    ctx.fillText('Twexly Bot • Canlı İstatistikler', width - 50, height - 25);

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'say',
    aliases: ['sunucubilgi', 'serverinfo', 'istatistik', 'stats'],
    async execute(message, client, args) {
        if (!message.guild) return;

        try {
            const guild = message.guild;

            // Üyeleri fetch et (güvenli)
            await guild.members.fetch().catch(() => {});

            const allMembers = guild.members.cache;
            const totalMembers = guild.memberCount || allMembers.size;
            const humans = allMembers.filter(m => !m.user.bot).size;
            const bots = allMembers.filter(m => m.user.bot).size;
            const voiceCount = allMembers.filter(m => m.voice?.channelId).size;

            // Kanallar
            const allChannels = guild.channels.cache;
            const textChannels = allChannels.filter(c => c.type === ChannelType.GuildText).size;
            const voiceChannels = allChannels.filter(c => c.isVoiceBased()).size;
            const categories = allChannels.filter(c => c.type === ChannelType.GuildCategory).size;
            const totalChannels = allChannels.size;

            // Roller
            const totalRoles = guild.roles.cache.size;

            // Boost
            const boostCount = guild.premiumSubscriptionCount || 0;
            const boostTierMap = {
                0: '0',
                1: '1',
                2: '2',
                3: '3',
                None: '0',
                Tier1: '1',
                Tier2: '2',
                Tier3: '3'
            };
            const boostLevel = boostTierMap[guild.premiumTier] || '0';

            const stats = {
                totalMembers,
                humans,
                bots,
                voiceCount,
                totalChannels,
                textChannels,
                voiceChannels,
                categories,
                totalRoles,
                boostCount,
                boostLevel
            };

            const cardBuffer = await generateSayCard(guild, stats);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'say_stats.png' });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# 📊 ${guild.name} — Sunucu İstatistikleri`),
                    new TextDisplayBuilder().setContent(
                        `• **Toplam Üye:** **${totalMembers.toLocaleString('tr-TR')}** *(👤 ${humans.toLocaleString('tr-TR')} Üye, 🤖 ${bots} Bot, 🔊 ${voiceCount} Seste)*\n` +
                        `• **Toplam Kanal:** **${totalChannels}** *(💬 ${textChannels} Metin, 🔊 ${voiceChannels} Ses, 📁 ${categories} Kategori)*\n` +
                        `• **Toplam Rol:** **${totalRoles}** Adet\n` +
                        `• **Sunucu Takviyesi:** **${boostCount}** Boost *(Seviye ${boostLevel})*\n` +
                        `• **Sunucu Sahibi:** <@${guild.ownerId}>\n` +
                        `• **Kuruluş Tarihi:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`
                    )
                );

            const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://say_stats.png' } }]);
            container.addMediaGalleryComponents(media);

            await message.reply({
                components: [container],
                files: [attachment],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Say komutu hatası:", error);
            message.reply("Sunucu istatistikleri alınırken bir hata meydana geldi.");
        }
    }
};
