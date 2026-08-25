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

function drawChatIcon(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -size * 0.2, size * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, size * 0.3);
    ctx.lineTo(-size * 0.9, size * 0.8);
    ctx.lineTo(-size * 0.05, size * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawMicIcon(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.22;
    drawRoundRect(ctx, -size * 0.35, -size * 0.85, size * 0.7, size * 1.0, size * 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -size * 0.2, size * 0.65, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, size * 0.45);
    ctx.lineTo(0, size * 0.85);
    ctx.stroke();
    ctx.restore();
}

module.exports = {
    name: 'rank',
    async execute(message, client, args) {
        try {
            // 1. Hedef Kullanıcıyı Belirle
            const targetMember = message.mentions.members.first() || 
                (args && args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) || 
                message.member;

            const user = targetMember.user;
            const userId = user.id;

            // 2. İstatistikleri Çek
            const stats = client.userStats?.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };
            
            // Eğer seste ise anlık süreyi dahil et
            const activeJoin = client.voiceSessions?.get(userId);
            let totalVoiceTime = stats.voiceTime || 0;
            if (activeJoin) {
                totalVoiceTime += (Date.now() - activeJoin);
            }

            const voiceHours = (totalVoiceTime / (1000 * 60 * 60)).toFixed(1);
            const neededXP = stats.level * 150 + 50;
            const xpPercent = Math.min(100, Math.floor((stats.xp / neededXP) * 100));

            // 3. Sunucu Sıralamasını Hesapla
            const allUsers = Array.from(client.userStats.entries()).map(([id, s]) => ({
                id,
                totalScore: (s.level || 1) * 10000 + (s.xp || 0)
            }));
            allUsers.sort((a, b) => b.totalScore - a.totalScore);
            const rankIndex = allUsers.findIndex(u => u.id === userId);
            const rankPos = rankIndex !== -1 ? rankIndex + 1 : allUsers.length + 1;

            // 4. Görsel Çizimi (Canvas 900x280)
            const canvas = createCanvas(900, 280);
            const ctx = canvas.getContext('2d');

            // Şeffaf Köşeler
            drawRoundRect(ctx, 0, 0, 900, 280, 26);
            ctx.clip();

            // Arka Plan Gradyanı
            const bgGrad = ctx.createLinearGradient(0, 0, 900, 280);
            bgGrad.addColorStop(0, '#0f111a');
            bgGrad.addColorStop(0.5, '#191b28');
            bgGrad.addColorStop(1, '#0b0c13');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 900, 280);

            // Arka Plan Işık Efektleri (Glow)
            ctx.fillStyle = 'rgba(241, 196, 15, 0.08)';
            ctx.beginPath(); ctx.arc(120, 140, 100, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'rgba(52, 152, 219, 0.08)';
            ctx.beginPath(); ctx.arc(800, 80, 120, 0, Math.PI*2); ctx.fill();

            // Dış Çerçeve
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 3;
            drawRoundRect(ctx, 2, 2, 896, 276, 24);
            ctx.stroke();

            // Avatar
            const avX = 115, avY = 140, avRadius = 65;
            try {
                const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await loadImage(avatarURL);
                ctx.save();
                ctx.beginPath();
                ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
                ctx.restore();
            } catch (e) {}

            // Avatar Altın Halka
            ctx.beginPath();
            ctx.arc(avX, avY, avRadius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Sağ Üst Rozetler: Seviye ve Sıralama
            // 1. Seviye Rozeti
            ctx.font = 'bold 18px sans-serif';
            const lvlText = 'SEVİYE ' + stats.level;
            const lvlWidth = ctx.measureText(lvlText).width + 30;
            const lvlX = 900 - lvlWidth - 30;
            drawRoundRect(ctx, lvlX, 30, lvlWidth, 38, 19);
            ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#f1c40f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(lvlText, lvlX + lvlWidth / 2, 49);

            // 2. Sıralama Rozeti
            const rankText = '#' + rankPos + ' SIRALAMA';
            const rankWidth = ctx.measureText(rankText).width + 30;
            const rankX = lvlX - rankWidth - 15;
            drawRoundRect(ctx, rankX, 30, rankWidth, 38, 19);
            ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#3498db';
            ctx.fillText(rankText, rankX + rankWidth / 2, 49);

            // İsim ve Kullanıcı Adı
            const displayName = user.globalName || targetMember.displayName || user.username;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillStyle = '#ffffff';

            let fittedName = displayName;
            const maxNameWidth = rankX - 220;
            while (ctx.measureText(fittedName).width > maxNameWidth && fittedName.length > 3) {
                fittedName = fittedName.slice(0, -1);
            }
            if (fittedName !== displayName) fittedName += '...';
            ctx.fillText(fittedName, 215, 62);

            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#8e9297';
            ctx.fillText(`@${user.username}`, 215, 92);

            // İstatistikler Satırı (Vektör İkonlar ile)
            drawChatIcon(ctx, 226, 140, 11, '#38bdf8');
            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText((stats.messages || 0).toLocaleString('tr-TR') + ' Mesaj', 246, 145);

            drawMicIcon(ctx, 420, 138, 11, '#a78bfa');
            ctx.fillText(voiceHours + ' Saat Ses', 438, 145);

            // XP İlerleme Çubuğu (Progress Bar)
            const barX = 215;
            const barY = 195;
            const barWidth = 650;
            const barHeight = 22;

            // Bar Rayı
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            drawRoundRect(ctx, barX, barY, barWidth, barHeight, 11);
            ctx.fill();

            // Doldurulan Bar
            const fillW = Math.max(22, (barWidth * xpPercent) / 100);
            const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
            fillGrad.addColorStop(0, '#f1c40f');
            fillGrad.addColorStop(1, '#f39c12');
            ctx.fillStyle = fillGrad;
            drawRoundRect(ctx, barX, barY, fillW, barHeight, 11);
            ctx.fill();

            // XP Metni
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#cbd5e1';
            ctx.textAlign = 'right';
            ctx.fillText(`${stats.xp} / ${neededXP} XP (%${xpPercent})`, barX + barWidth, 182);

            const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'rank.png' });

            const container = new ContainerBuilder()
                .setAccentColor(0xf1c40f)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🏆 ${user.username} - Seviye Kartı`),
                    new TextDisplayBuilder().setContent(`⭐ **Seviye:** \`${stats.level}\` | 🥇 **Sıralama:** \`#${rankPos}\` | ✨ **XP:** \`${stats.xp}/${neededXP}\``)
                );

            const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://rank.png' } }]);
            container.addMediaGalleryComponents(media);

            await message.reply({ 
                components: [container],
                files: [attachment],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Rank komutu hatası:", error);
            message.reply("❌ Sıralama kartı oluşturulurken bir hata meydana geldi!");
        }
    }
};