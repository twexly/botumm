const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const emojis = require('../emojis');

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

function formatMoney(num) {
    return Number(num || 0).toLocaleString('tr-TR');
}

module.exports = {
    name: 'bakiye',
    aliases: ['para', 'cuzdan', 'wallet', 'param'],
    description: 'Kullanıcının bakiye, banka ve cüzdan bilgilerini gösterir.',
    async execute(message, client, args) {
        try {
            const targetMember = message.mentions.members.first() || 
                (args && args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null) || 
                message.member;

            const user = targetMember.user;
            const eco = client.getEconomyStats(user.id);
            const stats = client.userStats?.get(user.id) || { level: 1, xp: 0 };

            const cash = eco.balance || 0;
            const bank = eco.bank || 0;
            const total = cash + bank;

            // Sıralama hesabı
            await message.guild.members.fetch().catch(() => {});
            const guildMemberIds = new Set(message.guild.members.cache.keys());
            const sortedUsers = Array.from(client.userStats?.entries() || [])
                .filter(([id]) => guildMemberIds.has(id))
                .map(([id, s]) => ({
                    id,
                    total: (s.balance || 0) + (s.bank || 0)
                }))
                .sort((a, b) => b.total - a.total);

            let rankIndex = sortedUsers.findIndex(u => u.id === user.id);
            if (rankIndex === -1) rankIndex = sortedUsers.length;
            const rankPos = rankIndex + 1;

            // Canvas Oluşturma (950 x 440)
            const canvas = createCanvas(950, 440);
            const ctx = canvas.getContext('2d');

            // 1. Arka Plan Gradyanı
            const bgGrad = ctx.createLinearGradient(0, 0, 950, 440);
            bgGrad.addColorStop(0, '#090A10');
            bgGrad.addColorStop(0.5, '#121324');
            bgGrad.addColorStop(1, '#080912');
            ctx.fillStyle = bgGrad;
            drawRoundRect(ctx, 0, 0, 950, 440, 28);
            ctx.fill();

            // 2. Parıltı Efektleri (Glow)
            const glow1 = ctx.createRadialGradient(850, 60, 0, 850, 60, 300);
            glow1.addColorStop(0, 'rgba(255, 184, 0, 0.18)');
            glow1.addColorStop(1, 'rgba(255, 184, 0, 0)');
            ctx.fillStyle = glow1;
            ctx.fillRect(500, 0, 450, 350);

            const glow2 = ctx.createRadialGradient(100, 380, 0, 100, 380, 250);
            glow2.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
            glow2.addColorStop(1, 'rgba(99, 102, 241, 0)');
            ctx.fillStyle = glow2;
            ctx.fillRect(0, 150, 450, 290);

            // Dış İnce Neon Çerçeve
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 2;
            drawRoundRect(ctx, 1, 1, 948, 438, 28);
            ctx.stroke();

            // 3. Sol Profil Kart Bölümü (Cam Efekti)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            drawRoundRect(ctx, 35, 35, 300, 370, 22);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.stroke();

            // Kullanıcı Avatarı
            const avatarX = 185;
            const avatarY = 140;
            const avatarRadius = 65;

            try {
                const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
                const avatarImg = await loadImage(avatarURL);

                // Avatar Dış Halka
                ctx.save();
                const ringGrad = ctx.createLinearGradient(avatarX - 70, avatarY - 70, avatarX + 70, avatarY + 70);
                ringGrad.addColorStop(0, '#FFD700');
                ringGrad.addColorStop(0.5, '#FFA500');
                ringGrad.addColorStop(1, '#6366F1');
                ctx.strokeStyle = ringGrad;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius + 5, 0, Math.PI * 2);
                ctx.stroke();

                // Avatar Kırpma
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
                ctx.restore();
            } catch (e) {
                ctx.fillStyle = '#6366F1';
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Kullanıcı İsmi
            ctx.font = 'bold 22px "Poppins", "Segoe UI", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            const cleanName = user.username.length > 15 ? user.username.substring(0, 13) + '..' : user.username;
            ctx.fillText(cleanName, 185, 245);

            // Seviye & Sıralama Rozeti
            ctx.fillStyle = 'rgba(255, 184, 0, 0.15)';
            drawRoundRect(ctx, 85, 265, 200, 34, 17);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 184, 0, 0.4)';
            ctx.stroke();

            ctx.font = 'bold 14px "Poppins", "Segoe UI", sans-serif';
            ctx.fillStyle = '#FFB800';
            ctx.fillText(`🏆 Sıra: #${rankPos}  •  Lvl: ${stats.level || 1}`, 185, 287);

            // Sunucu Rozet Altlığı
            ctx.font = '13px "Poppins", "Segoe UI", sans-serif';
            ctx.fillStyle = '#94A3B8';
            ctx.fillText(message.guild.name.substring(0, 20), 185, 335);

            // 4. Sağ Bakiye Kartları
            // Card A: Nakit (Cüzdan)
            const drawStatBox = (x, y, w, h, title, amount, subText, icon, colorGradStart, colorGradEnd, borderColor) => {
                ctx.save();
                const boxGrad = ctx.createLinearGradient(x, y, x + w, y + h);
                boxGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
                boxGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
                ctx.fillStyle = boxGrad;
                drawRoundRect(ctx, x, y, w, h, 18);
                ctx.fill();

                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Sol İkon Rozeti
                ctx.fillStyle = colorGradStart;
                drawRoundRect(ctx, x + 20, y + 20, 48, 48, 14);
                ctx.fill();

                ctx.font = '24px "Segoe UI Emoji", sans-serif';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(icon, x + 44, y + 53);

                // Başlık
                ctx.font = '600 14px "Poppins", "Segoe UI", sans-serif';
                ctx.fillStyle = '#94A3B8';
                ctx.textAlign = 'left';
                ctx.fillText(title, x + 82, y + 38);

                // Miktar
                ctx.font = 'bold 26px "Poppins", "Segoe UI", sans-serif';
                const amtGrad = ctx.createLinearGradient(x + 82, y + 65, x + 250, y + 65);
                amtGrad.addColorStop(0, '#FFFFFF');
                amtGrad.addColorStop(1, colorGradEnd);
                ctx.fillStyle = amtGrad;
                ctx.fillText(`${amount} ₺`, x + 82, y + 68);

                // Alt bilgi
                ctx.font = '12px "Poppins", "Segoe UI", sans-serif';
                ctx.fillStyle = '#64748B';
                ctx.fillText(subText, x + 82, y + 88);

                ctx.restore();
            };

            // Nakit Cüzdan Kutusu
            drawStatBox(365, 35, 545, 105, 'CÜZDAN (NAKİT)', formatMoney(cash), 'Hemen harcanabilir para', '💵', 'rgba(16, 185, 129, 0.25)', '#34D399', 'rgba(16, 185, 129, 0.3)');

            // Banka Kutusu
            drawStatBox(365, 165, 545, 105, 'BANKA HESABI', formatMoney(bank), 'Soygunlara karşı korumalı', '🏦', 'rgba(59, 130, 246, 0.25)', '#60A5FA', 'rgba(59, 130, 246, 0.3)');

            // Toplam Net Servet Kutusu
            drawStatBox(365, 295, 545, 110, 'TOPLAM SERVET', formatMoney(total), `Sunucu sıralamasında #${rankPos}. sırada`, '👑', 'rgba(255, 184, 0, 0.3)', '#FBBF24', 'rgba(255, 184, 0, 0.4)');

            const buffer = canvas.toBuffer('image/png');
            const attachment = new AttachmentBuilder(buffer, { name: 'bakiye.png' });

            // Discord Components V2 Container
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# 💳 ${user.username} — Cüzdan ve Finans Kartı`),
                    new TextDisplayBuilder().setContent(
                        `${emojis.matter} **Nakit Para:** \`${formatMoney(cash)} ₺\`\n` +
                        `${emojis.matter} **Banka Hesabı:** \`${formatMoney(bank)} ₺\`\n` +
                        `${emojis.matter} **Toplam Servet:** \`${formatMoney(total)} ₺\` • **Sıra:** \`#${rankPos}\`\n\n` +
                        `> *Para kazanmak için \`.günlük\` veya \`.çalış\` komutlarını kullanabilir, casino oyunlarında şansını deneyebilirsin!*`
                    )
                )
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([
                        { description: 'Bakiye Kartı', url: 'attachment://bakiye.png' }
                    ])
                );

            return message.channel.send({
                files: [attachment],
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error('Bakiye komutu hatası:', error);
            return message.reply({
                content: `${emojis.cross} Bakiye kartı oluşturulurken bir hata meydana geldi: \`${error.message}\``
            });
        }
    }
};
