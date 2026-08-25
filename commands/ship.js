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
                    return message.reply("❌ Sunucuda eşleşebileceğin kimse yok!");
                }
                targetUser = validMembers.random().user;
            } catch(e) {
                return message.reply("❌ Kullanıcılar çekilemedi!");
            }
        }

        // Kendini etiketleme kontrolü
        if (targetUser.id === message.author.id) {
            return message.reply("❌ Kendini shipleyemezsin, biraz sosyalleş!");
        }

        const matchPercent = Math.floor(Math.random() * 101);

        const user1 = message.author;
        const user2 = targetUser;

        const isGood = matchPercent >= 50;
        const heartEmoji = isGood ? '❤️' : '💔';
        const primaryColor = isGood ? '#ff2d75' : '#6b7280';
        const glowColor = isGood ? 'rgba(255, 45, 117, 0.35)' : 'rgba(107, 114, 128, 0.2)';
        const accentHex = isGood ? 0xff2d75 : 0x6b7280;

        // --- YÜKSEK KALİTELİ CANVAS ÇİZİMİ ---
        const canvas = createCanvas(900, 360);
        const ctx = canvas.getContext('2d');

        // 1. Köşeleri şeffaf kırp
        drawRoundRect(ctx, 0, 0, 900, 360, 32);
        ctx.clip();

        // 2. Arka Plan Gradyanı
        const bgGrad = ctx.createLinearGradient(0, 0, 900, 360);
        bgGrad.addColorStop(0, isGood ? '#1a0614' : '#121214');
        bgGrad.addColorStop(0.5, isGood ? '#2e0a22' : '#1e1e24');
        bgGrad.addColorStop(1, isGood ? '#11040e' : '#0e0e10');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 900, 360);

        // Arka plan ışık efektleri (Bokeh)
        ctx.fillStyle = glowColor;
        ctx.beginPath(); ctx.arc(200, 100, 90, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(700, 260, 110, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(450, 60, 60, 0, Math.PI*2); ctx.fill();

        // Dış ince çerçeve
        ctx.strokeStyle = isGood ? 'rgba(255, 45, 117, 0.25)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 4;
        drawRoundRect(ctx, 2, 2, 896, 356, 30);
        ctx.stroke();

        // 3. Avatarlar
        const radius = 85;
        const yCenter = 160;
        const x1 = 175;
        const x2 = 725;

        async function drawAvatar(u, x) {
            // Neon Glow halkası
            ctx.beginPath();
            ctx.arc(x, yCenter, radius + 8, 0, Math.PI * 2);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 12;
            ctx.stroke();

            // Ana halka
            ctx.beginPath();
            ctx.arc(x, yCenter, radius + 2, 0, Math.PI * 2);
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 5;
            ctx.stroke();

            // Avatar Görseli
            try {
                const avatarURL = u.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await loadImage(avatarURL);
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, yCenter, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, x - radius, yCenter - radius, radius * 2, radius * 2);
                ctx.restore();
            } catch(e) {
                console.error("Avatar yüklenemedi", e);
            }

            // İsim
            const displayName = u.globalName || u.username;
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            
            let fittedName = displayName;
            while (ctx.measureText(fittedName).width > 220 && fittedName.length > 3) {
                fittedName = fittedName.slice(0, -1);
            }
            if (fittedName !== displayName) fittedName += '...';

            ctx.fillText(fittedName, x, 290);
            ctx.shadowBlur = 0;
        }

        await drawAvatar(user1, x1);
        await drawAvatar(user2, x2);

        // 4. Orta Bölüm: Kalp, LOVE MATCH, Yüzde, İlerleme Çubuğu
        const centerX = 450;

        // Vektör Kalp Çizimi (Emoji font hatasını önler)
        drawHeart(ctx, centerX, 68, 26, primaryColor);

        // LOVE MATCH Başlığı
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = isGood ? '#ff85a2' : '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText('═  LOVE MATCH  ═', centerX, 125);

        // Yüzdelik Oran
        ctx.font = 'bold 76px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 20;
        ctx.fillText(`%${matchPercent}`, centerX, 205);
        ctx.shadowBlur = 0;

        // İlerleme Çubuğu (Progress Bar)
        const barWidth = 220;
        const barHeight = 14;
        const barX = centerX - barWidth / 2;
        const barY = 230;

        // Arka plan rayı
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        drawRoundRect(ctx, barX, barY, barWidth, barHeight, 7);
        ctx.fill();

        // Doldurulan kısım
        const fillWidth = Math.max(14, (barWidth * matchPercent) / 100);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
        barGrad.addColorStop(0, isGood ? '#ff2d75' : '#6b7280');
        barGrad.addColorStop(1, isGood ? '#ff758c' : '#9ca3af');
        ctx.fillStyle = barGrad;
        drawRoundRect(ctx, barX, barY, fillWidth, barHeight, 7);
        ctx.fill();

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'ship.png' });

        // Açıklama Metni
        let messageText = "";
        if (matchPercent === 100) messageText = "💍 Ruh ikizleri bulundu! Sonsuza kadar mutlu yaşayacaksınız.";
        else if (matchPercent >= 80) messageText = "🔥 Mükemmel bir uyum! Düğün hazırlıklarına şimdiden başlayın.";
        else if (matchPercent >= 50) messageText = "✨ Fena değil, aranızda tatlı bir elektrik var. Bir şans verin!";
        else if (matchPercent >= 25) messageText = "💔 Biraz zor gibi görünüyor ama çabalarsanız neden olmasın?";
        else messageText = "💀 Sıfır uyum! Birbirinizden acilen uzak durun.";

        const container = new ContainerBuilder()
            .setAccentColor(accentHex)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${heartEmoji} <@${user1.id}> & <@${user2.id}>`),
                new TextDisplayBuilder().setContent(`**${user1.username}** ${heartEmoji} **${user2.username}**\n**Eşleşme Oranı:** \`%${matchPercent}\``)
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
