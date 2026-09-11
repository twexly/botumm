const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MediaGalleryBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags, 
    AttachmentBuilder 
} = require('discord.js');
const https = require('https');
const { createCanvas, loadImage } = require('canvas');
const emojis = require('../emojis');
const { TOURNAMENTS, resolveTournament } = require('../data/leagues');

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

// 5 dakikalık akıllı lig bazlı önbellek
const standingsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function fetchFlashscoreFeed(feedCode) {
    return new Promise((resolve, reject) => {
        const url = 'https://2.flashscore.ninja/2/x/feed/' + feedCode;
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
                            id: map['TI'],
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

function fetchFlashscoreFormFeed(formCode) {
    return new Promise((resolve) => {
        const url = 'https://2.flashscore.ninja/2/x/feed/' + formCode;
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
                    const formMap = {};
                    let currentId = null;
                    let currentName = null;

                    for (const b of blocks) {
                        if (b.startsWith('TR÷')) {
                            const parts = b.split('¬');
                            for (const p of parts) {
                                if (p.startsWith('TI÷')) currentId = p.replace('TI÷', '');
                                if (p.startsWith('TN÷')) currentName = p.replace('TN÷', '');
                            }
                            if (currentId) formMap[currentId] = [];
                            if (currentName) formMap[currentName] = [];
                        } else if (b.startsWith('LMS÷')) {
                            const parts = b.split('¬');
                            let outcome = null;
                            for (const p of parts) {
                                if (p.startsWith('LMU÷')) outcome = p.replace('LMU÷', '');
                            }
                            if (outcome && ['w', 'd', 'l'].includes(outcome)) {
                                if (currentId && formMap[currentId].length < 5) formMap[currentId].push(outcome);
                                if (currentName && formMap[currentName].length < 5) formMap[currentName].push(outcome);
                            }
                        }
                    }

                    // Feed ters kronolojik verir (en yeni maç başta).
                    // Tabloda soldan sağa kronolojik akış için tersine çeviriyoruz (en son maç sağda).
                    for (const k of Object.keys(formMap)) {
                        formMap[k].reverse();
                    }

                    resolve(formMap);
                } catch (e) {
                    resolve({});
                }
            });
        }).on('error', () => resolve({}));
    });
}

function drawFormBadge(ctx, cx, cy, radius, outcome) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);

    if (outcome === 'w') {
        // Galibiyet: Yeşil daire + beyaz tik
        ctx.fillStyle = '#10B981';
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.45, cy);
        ctx.lineTo(cx - radius * 0.1, cy + radius * 0.38);
        ctx.lineTo(cx + radius * 0.45, cy - radius * 0.35);
        ctx.stroke();

    } else if (outcome === 'l') {
        // Mağlubiyet: Kırmızı daire + beyaz çarpı
        ctx.fillStyle = '#EF4444';
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const off = radius * 0.36;
        ctx.moveTo(cx - off, cy - off);
        ctx.lineTo(cx + off, cy + off);
        ctx.moveTo(cx + off, cy - off);
        ctx.lineTo(cx - off, cy + off);
        ctx.stroke();

    } else if (outcome === 'd') {
        // Beraberlik: Direkt gri daire + beyaz çizgi
        ctx.fillStyle = '#64748B';
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.36, cy);
        ctx.lineTo(cx + radius * 0.36, cy);
        ctx.stroke();
    } else {
        // Boş / Henüz oynanmamış maç slotu
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

async function generateStandingsImage(tournament) {
    const now = Date.now();
    const cached = standingsCache.get(tournament.id);
    if (cached && (now - cached.time < CACHE_DURATION)) {
        return cached.buffer;
    }

    const baseCode = tournament.feedCode.replace(/_\d+$/, '');
    const formCode = baseCode + '_5';

    const [teams, formMap] = await Promise.all([
        fetchFlashscoreFeed(tournament.feedCode),
        fetchFlashscoreFormFeed(formCode).catch(() => ({}))
    ]);

    if (!teams || teams.length === 0) {
        throw new Error(`${tournament.name} puan durumu verisi alınamadı.`);
    }

    const width = 1200;
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
    ctx.fillText(tournament.name.toUpperCase(), 40, 52);

    ctx.font = '14px "Poppins", "Segoe UI", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText(`Resmi Canlı Puan Durumu Tablosu • FlashScore Veri Akışı • ${tournament.shortName || tournament.name}`, 40, 78);

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
    ctx.fillText('OM', 510, barY + 21);
    ctx.fillText('G', 560, barY + 21);
    ctx.fillText('B', 610, barY + 21);
    ctx.fillText('M', 660, barY + 21);
    ctx.fillText('AV', 715, barY + 21);

    ctx.fillStyle = '#F59E0B';
    ctx.fillText('PUAN', 775, barY + 21);

    ctx.fillStyle = '#64748B';
    ctx.fillText('SON 5 MAÇ (FORM)', 915, barY + 21);
    ctx.fillText('DURUM', 1090, barY + 21);

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

        // Sıra Rozeti Rengi (Turnuva Türüne Göre Akıllı Renklendirme)
        let rankColor = 'rgba(255, 255, 255, 0.1)';
        let rankTextColor = '#94A3B8';

        if (tournament.topRankType === 'euro') {
            // Avrupa Kupaları Yeni Lig Formatı (36 Takım)
            if (rankNum <= 8) {
                rankColor = '#059669'; // Doğrudan Son 16 (Yeşil)
                rankTextColor = '#FFFFFF';
            } else if (rankNum <= 24) {
                rankColor = '#2563EB'; // Play-off Turu (Mavi)
                rankTextColor = '#FFFFFF';
            } else {
                rankColor = '#475569'; // Elenenler (Koyu Gri)
                rankTextColor = '#CBD5E1';
            }
        } else {
            // Yerel Ligler (Süper Lig, Premier League vb.)
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
        ctx.fillText(t.played, 510, y + 19);
        ctx.fillText(t.wins, 560, y + 19);
        ctx.fillText(t.draws, 610, y + 19);
        ctx.fillText(t.losses, 660, y + 19);

        // Averaj
        const diffNum = parseInt(t.diff, 10);
        ctx.fillStyle = diffNum > 0 ? '#10B981' : diffNum < 0 ? '#EF4444' : '#94A3B8';
        ctx.fillText(diffNum > 0 ? `+${t.diff}` : t.diff, 715, y + 19);

        // Puan
        ctx.font = 'bold 16px "Poppins", "Segoe UI", sans-serif';
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(t.points, 775, y + 19);

        // Son 5 Maç (Form Badges)
        const teamForm = (formMap && (formMap[t.id] || formMap[t.name])) || [];
        const badgeRadius = 11;
        const badgeSpacing = 28;
        const startX = 915 - ((5 - 1) * badgeSpacing) / 2;

        for (let m = 0; m < 5; m++) {
            const bx = startX + m * badgeSpacing;
            const by = y + 14;
            const outcome = teamForm[m] || null;
            drawFormBadge(ctx, bx, by, badgeRadius, outcome);
        }

        // Form Özeti Yazısı (Son 5 maçtan kaç galibiyet, beraberlik, mağlubiyet)
        if (teamForm.length > 0) {
            const wCount = teamForm.filter(x => x === 'w').length;
            const dCount = teamForm.filter(x => x === 'd').length;
            const lCount = teamForm.filter(x => x === 'l').length;
            let summaryStr = [];
            if (wCount > 0) summaryStr.push(`${wCount}G`);
            if (dCount > 0) summaryStr.push(`${dCount}B`);
            if (lCount > 0) summaryStr.push(`${lCount}M`);

            ctx.font = 'bold 12px "Poppins", "Segoe UI", sans-serif';
            ctx.fillStyle = '#94A3B8';
            ctx.textAlign = 'center';
            ctx.fillText(summaryStr.length > 0 ? summaryStr.join(' ') : '-', 1090, y + 19);
        } else {
            ctx.font = '13px "Poppins", "Segoe UI", sans-serif';
            ctx.fillStyle = '#64748B';
            ctx.textAlign = 'center';
            ctx.fillText('-', 1090, y + 19);
        }
    }

    const buffer = canvas.toBuffer('image/png');
    standingsCache.set(tournament.id, { buffer, time: now });
    return buffer;
}

// Buton Çubuklarını Oluştur
function createStandingsButtons(activeId) {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_superlig')
            .setLabel('Süper Lig')
            .setEmoji('1548051464310755460')
            .setStyle(activeId === 'superlig' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_premierleague')
            .setLabel('Premier League')
            .setEmoji('1548086673689288844')
            .setStyle(activeId === 'premierleague' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_laliga')
            .setLabel('La Liga')
            .setEmoji('1548086645818007613')
            .setStyle(activeId === 'laliga' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_seriea')
            .setLabel('Serie A')
            .setEmoji('1548086699505094769')
            .setStyle(activeId === 'seriea' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_bundesliga')
            .setLabel('Bundesliga')
            .setEmoji('1548086595234828328')
            .setStyle(activeId === 'bundesliga' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_championsleague')
            .setLabel('Şampiyonlar Ligi')
            .setStyle(activeId === 'championsleague' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_europaleague')
            .setLabel('Avrupa Ligi')
            .setStyle(activeId === 'europaleague' ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('puandurumu_lig_conferenceleague')
            .setLabel('Konferans Ligi')
            .setStyle(activeId === 'conferenceleague' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

    return [row1, row2];
}

module.exports = {
    name: 'puandurumu',
    aliases: ['puan', 'standings', 'ligtablosu', 'siralamalar', 'puanlar'],
    description: 'Süper Lig, Premier League, La Liga, Serie A, Bundesliga ve Şampiyonlar Ligi puan tablolarını görsel olarak gönderir.',
    async execute(message, client, args) {
        const query = args && args.length > 0 ? args.join(' ') : 'superlig';
        const tournament = resolveTournament(query);

        const waitMsg = await message.reply({
            content: `${emojis.settings} Güncel **${tournament.name}** puan durumu FlashScore üzerinden alınıyor, lütfen bekleyin...`
        });

        try {
            const buffer = await generateStandingsImage(tournament);
            const attachment = new AttachmentBuilder(buffer, { name: 'puandurumu.png' });
            const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const buttonRows = createStandingsButtons(tournament.id);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ${tournament.emoji} ${tournament.name} — Canlı Puan Tablosu`),
                    new TextDisplayBuilder().setContent(
                        `FlashScore verileriyle anlık olarak çekilen resmi lig ve turnuva sıralaması:\n\n` +
                        `${emojis.matter} **Turnuva:** **${tournament.name}**\n` +
                        `${emojis.matter} **Kaynak:** [FlashScore Resmi Tablo](${tournament.url})\n` +
                        `${emojis.matter} **Son Güncelleme:** Saat \`${nowStr}\`\n\n` +
                        `*Diğer liglerin puan durumuna hızlıca geçmek için aşağıdaki butonları kullanabilirsiniz.*`
                    )
                )
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([
                        { media: { url: 'attachment://puandurumu.png' }, description: `${tournament.name} Puan Durumu` }
                    ])
                )
                .addActionRowComponents(buttonRows[0], buttonRows[1]);

            await waitMsg.delete().catch(() => {});

            return message.channel.send({
                files: [attachment],
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (err) {
            console.error('Puan durumu alma hatası:', err);
            await waitMsg.edit({
                content: `${emojis.cross} **${tournament.name}** puan durumu tablosu hazırlanırken bir hata oluştu: \`${err.message}\``
            }).catch(() => {});
        }
    },
    generateStandingsImage,
    createStandingsButtons
};
