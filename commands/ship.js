const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
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

function drawHeart(ctx, x, y, size, color) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.scale(size / 30, size / 30);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-15, -15, -30, 10, 0, 30);
    ctx.bezierCurveTo(30, 10, 15, -15, 0, 0);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
}

module.exports = {
    name: 'ship',
    async execute(message, client, args) {
        let targetUser = null;
        const mentioned = message.mentions.members.first();

        if (mentioned) {
            targetUser = mentioned.user;
        } else {
            try {
                const members = await message.guild.members.fetch();
                const validMembers = members.filter(m => !m.user.bot && m.id !== message.author.id);
                if (validMembers.size === 0) {
                    return message.reply("Sunucuda eşleşebileceğin kimse yok.");
                }
                targetUser = validMembers.random().user;
            } catch(e) {
                return message.reply("Kullanıcılar çekilemedi.");
            }
        }

        // Kendini etiketleme kontrolü
        if (targetUser.id === message.author.id) {
            return message.reply("Kendini shipleyemezsin.");
        }

        const matchPercent = Math.floor(Math.random() * 101);

        const user1 = message.author;
        const user2 = targetUser;

        const isGood = matchPercent >= 50;
        const primaryColor = isGood ? '#ff2d75' : '#6b7280';
        const glowColor = isGood ? 'rgba(255, 45, 117, 0.35)' : 'rgba(107, 114, 128, 0.2)';

        // --- YÜKSEK KALİTELİ CANVAS ÇİZİMİ ---
        const canvas = createCanvas(800, 300);
        const ctx = canvas.getContext('2d');

        // Şeffaf Köşeler
        drawRoundRect(ctx, 0, 0, 800, 300, 24);
        ctx.clip();

        // 1. Arka Plan
        const bgGrad = ctx.createLinearGradient(0, 0, 800, 300);
        bgGrad.addColorStop(0, '#0d0d12');
        bgGrad.addColorStop(0.5, '#161722');
        bgGrad.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 300);

        // Bokeh Işıkları
        ctx.fillStyle = glowColor;
        ctx.beginPath(); ctx.arc(170, 130, 90, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(630, 130, 90, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(400, 130, 110, 0, Math.PI * 2); ctx.fill();

        // Dış İnce Çerçeve
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, 1, 1, 798, 298, 22);
        ctx.stroke();

        // 2. Avatarları Yükle ve Çiz
        const avatarSize = 130;
        const avatarY = 65;

        // Sol Avatar (User 1)
        const av1X = 105;
        try {
            const av1URL = user1.displayAvatarURL({ extension: 'png', size: 256 });
            const img1 = await loadImage(av1URL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(av1X + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img1, av1X, avatarY, avatarSize, avatarSize);
            ctx.restore();
        } catch (e) {}

        // Sol Avatar Çerçevesi
        ctx.beginPath();
        ctx.arc(av1X + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sağ Avatar (User 2)
        const av2X = 565;
        try {
            const av2URL = user2.displayAvatarURL({ extension: 'png', size: 256 });
            const img2 = await loadImage(av2URL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(av2X + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img2, av2X, avatarY, avatarSize, avatarSize);
            ctx.restore();
        } catch (e) {}

        // Sağ Avatar Çerçevesi
        ctx.beginPath();
        ctx.arc(av2X + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 3. Orta Kısım: Vektör Kalp & Yüzde
        const heartCenterX = 400;
        const heartCenterY = 120;

        drawHeart(ctx, heartCenterX, heartCenterY - 10, 48, primaryColor);

        // Yüzde Metni
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.fillText(`%${matchPercent}`, heartCenterX, heartCenterY + 52);
        ctx.shadowBlur = 0;

        // 4. İsimler
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#f8fafc';

        let name1 = user1.globalName || user1.username;
        if (ctx.measureText(name1).width > 160) name1 = name1.slice(0, 12) + '...';
        ctx.fillText(name1, av1X + avatarSize / 2, avatarY + avatarSize + 25);

        let name2 = user2.globalName || user2.username;
        if (ctx.measureText(name2).width > 160) name2 = name2.slice(0, 12) + '...';
        ctx.fillText(name2, av2X + avatarSize / 2, avatarY + avatarSize + 25);

        // 5. Alt İlerleme Çubuğu (Progress Bar)
        const barX = 180;
        const barY = 255;
        const barWidth = 440;
        const barHeight = 14;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        drawRoundRect(ctx, barX, barY, barWidth, barHeight, 7);
        ctx.fill();

        const fillWidth = Math.max(14, (barWidth * matchPercent) / 100);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        barGrad.addColorStop(0, primaryColor);
        barGrad.addColorStop(1, isGood ? '#ff758c' : '#9ca3af');
        ctx.fillStyle = barGrad;
        drawRoundRect(ctx, barX, barY, fillWidth, barHeight, 7);
        ctx.fill();

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'ship.png' });

        // Açıklama Metni
        let messageText = "";
        if (matchPercent === 100) messageText = "Ruh ikizleri bulundu! Sonsuza kadar mutlu yaşayacaksınız.";
        else if (matchPercent >= 80) messageText = "Mükemmel bir uyum! Düğün hazırlıklarına şimdiden başlayın.";
        else if (matchPercent >= 50) messageText = "Fena değil, aranızda tatlı bir elektrik var. Bir şans verin!";
        else if (matchPercent >= 25) messageText = "Biraz zor gibi görünüyor ama çabalarsanız neden olmasın?";
        else messageText = "Sıfır uyum! Birbirinizden acilen uzak durun.";

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`<@${user1.id}> & <@${user2.id}>`),
                new TextDisplayBuilder().setContent(`**${user1.username}** & **${user2.username}**\n**Eşleşme Oranı:** \`%${matchPercent}\``)
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`> ${messageText}`)
            );
            
        const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://ship.png' } }]);
        container.addMediaGalleryComponents(media);

        await message.reply({
            components: [container],
            files: [attachment],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
