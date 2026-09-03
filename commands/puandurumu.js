const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const https = require('https');
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

// 5 dakikalık akıllı önbellek
let cachedBuffer = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

function fetchFlashscoreFeed() {
    return new Promise((resolve, reject) => {
        const url = 'https://2.flashscore.ninja/2/x/feed/to_ABdATjMP_2TRNmxYR_1';
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'x-fsign': 'SW9D1eZo'
            }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const blocks = data.split('~');
                    const logoMap = {};
                    for (const b of blocks) {
                        const parts = b.split('¬');
                        let currId = null;
                        for (const p of parts) {
                            if (p.startsWith('IPI÷')) currId = p.replace('IPI÷', '');
                            if (p.startsWith('IPU÷') && currId) {
                                logoMap[currId] = 'https://static.flashscore.com/res/image/data/' + p.replace('IPU÷', '');
                            }
                        }
                    }

                    const teams = [];
                    for (const b of blocks) {
                        if (!b.startsWith('TR÷')) continue;
                        const map = {};
                        b.split('¬').forEach(p => {
                            const [k, v] = p.split('÷');
                            if (k && v !== undefined) map[k] = v;
                        });

                        teams.push({
                            rank: map['TR'],
                            name: map['TN'],
                            played: map['TM'] || '0',
                            wins: map['TW'] || '0',
                            draws: map['TDR'] || '0',
                            losses: map['TL'] || '0',
                            goals: map['TG'] || '0:0',
                            diff: map['TPF'] || '0',
                            points: map['TP'] || '0',
                            logo: logoMap[map['TI']] || null
                        });
                    }
                    resolve(teams);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function generateStandingsImage() {
    const now = Date.now();
    if (cachedBuffer && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedBuffer;
    }

    const teams = await fetchFlashscoreFeed();
    if (!teams || teams.length === 0) {
        throw new Error('FlashScore puan tablosu verisi alınamadı.');
    }

    const width = 960;
    const rowHeight = 44;
    const headerHeight = 130;
    const height = headerHeight + (teams.length * rowHeight) + 40;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Koyu Futbol Atmosferi Gradyanı
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0A0B14');
    bgGrad.addColorStop(0.5, '#101328');
    bgGrad.addColorStop(1, '#07080F');
    ctx.fillStyle = bgGrad;
    drawRoundRect(ctx, 0, 0, width, height, 24);
    ctx.fill();

    // 2. Dış İnce Neon Çerçeve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 24);
    ctx.stroke();

    // 3. Başlık Bilgisi
    ctx.font = 'bold 26px "Poppins", "Segoe UI", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 TRENDYOL SÜPER LİG', 40, 52);

    ctx.font = '14px "Poppins", "Segoe UI", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Resmi Güncel Puan Durumu Tablosu • FlashScore Canlı Akışı', 40, 78);

    // 4. Tablo Sütun Başlıkları Çubuğu
    const barY = 95;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    drawRoundRect(ctx, 30, barY, width - 60, 32, 8);
    ctx.fill();

    ctx.font = 'bold 13px "Poppins", "Segoe UI", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    ctx.fillText('#', 55, barY + 21);

    ctx.textAlign = 'left';
    ctx.fillText('TAKIM', 110, barY + 21);

    ctx.textAlign = 'center';
    ctx.fillText('OM', 520, barY + 21);
    ctx.fillText('G', 575, barY + 21);
    ctx.fillText('B', 630, barY + 21);
    ctx.fillText('M', 685, barY + 21);
    ctx.fillText('AV', 745, barY + 21);

    ctx.fillStyle = '#F59E0B';
    ctx.fillText('PUAN', 840, barY + 21);

    // 5. Takım Satırları
    for (let i = 0; i < teams.length; i++) {
        const t = teams[i];
        const y = headerHeight + i * rowHeight + 10;
        const rankNum = parseInt(t.rank, 10);

        if (i % 2 === 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
            drawRoundRect(ctx, 30, y - 6, width - 60, rowHeight - 4, 8);
            ctx.fill();
        }

        // Sıra Rozeti Rengi
        let rankColor = 'rgba(255, 255, 255, 0.1)';
        let rankTextColor = '#94A3B8';
        if (rankNum === 1) {
            rankColor = '#004682'; // Şampiyonlar Ligi
            rankTextColor = '#FFFFFF';
        } else if (rankNum === 2) {
            rankColor = '#1EA8EC';
            rankTextColor = '#FFFFFF';
        } else if (rankNum === 3) {
            rankColor = '#7F0029';
            rankTextColor = '#FFFFFF';
        } else if (rankNum === 4) {
            rankColor = '#B8860B';
            rankTextColor = '#FFFFFF';
        } else if (rankNum >= teams.length - 2) {
            rankColor = '#BD0000'; // Düşme Hattı
            rankTextColor = '#FFFFFF';
        }

        ctx.fillStyle = rankColor;
        drawRoundRect(ctx, 40, y + 2, 30, 24, 6);
        ctx.fill();

        ctx.font = 'bold 13px "Poppins", "Segoe UI", sans-serif';
        ctx.fillStyle = rankTextColor;
        ctx.textAlign = 'center';
        ctx.fillText(t.rank, 55, y + 19);

        // Logo
        if (t.logo) {
            try {
                const img = await loadImage(t.logo);
                ctx.drawImage(img, 95, y + 2, 24, 24);
            } catch (_) {}
        }

        // Takım Adı
        ctx.font = '600 15px "Poppins", "Segoe UI", sans-serif';
        ctx.fillStyle = rankNum <= 4 ? '#FFFFFF' : '#E2E8F0';
        ctx.textAlign = 'left';
        ctx.fillText(t.name, 130, y + 19);

        // Maç İstatistikleri
        ctx.font = '14px "Poppins", "Segoe UI", sans-serif';
        ctx.fillStyle = '#CBD5E1';
        ctx.textAlign = 'center';
        ctx.fillText(t.played, 520, y + 19);
        ctx.fillText(t.wins, 575, y + 19);
        ctx.fillText(t.draws, 630, y + 19);
        ctx.fillText(t.losses, 685, y + 19);

        // Averaj
        const diffNum = parseInt(t.diff, 10);
        ctx.fillStyle = diffNum > 0 ? '#10B981' : diffNum < 0 ? '#EF4444' : '#94A3B8';
        ctx.fillText(diffNum > 0 ? `+${t.diff}` : t.diff, 745, y + 19);

        // Puan
        ctx.font = 'bold 16px "Poppins", "Segoe UI", sans-serif';
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(t.points, 840, y + 19);
    }

    const buffer = canvas.toBuffer('image/png');
    cachedBuffer = buffer;
    lastFetchTime = now;
    return buffer;
}

module.exports = {
    name: 'puandurumu',
    aliases: ['puan', 'standings', 'ligtablosu', 'siralamalar'],
    description: 'FlashScore üzerinden canlı Süper Lig puan durumunu çeker ve görsel tablo olarak gönderir.',
    async execute(message, client) {
        const waitMsg = await message.reply({
            content: `${emojis.settings} Güncel Süper Lig puan durumu FlashScore üzerinden alınıyor, lütfen bekleyin...`
        });

        try {
            const buffer = await generateStandingsImage();
            const attachment = new AttachmentBuilder(buffer, { name: 'puandurumu.png' });
            const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🏆 Trendyol Süper Lig — Canlı Puan Durumu'),
                    new TextDisplayBuilder().setContent(
                        `FlashScore verileriyle anlık olarak çekilen resmi lig sıralaması:\n\n` +
                        `${emojis.matter} **Kaynak:** [FlashScore Süper Lig](https://www.flashscore.com/football/turkey/super-lig/standings/2TRNmxYR/standings/overall/)\n` +
                        `${emojis.matter} **Son Güncelleme:** Saat \`${nowStr}\``
                    )
                )
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([
                        { media: { url: 'attachment://puandurumu.png' }, description: 'Süper Lig Puan Durumu' }
                    ])
                );

            await waitMsg.delete().catch(() => {});

            return message.channel.send({
                files: [attachment],
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (err) {
            console.error('Puan durumu alma hatası:', err);
            await waitMsg.edit({
                content: `${emojis.cross} Puan durumu tablosu hazırlanırken bir hata oluştu: \`${err.message}\``
            }).catch(() => {});
        }
    }
};
