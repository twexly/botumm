const { 
    ChannelType, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    AttachmentBuilder 
} = require('discord.js');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

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

function drawIcons(ctx, index, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch(index) {
        case 0: // İsim Değiştir (Kalem)
            ctx.beginPath();
            ctx.moveTo(-10, 10); ctx.lineTo(-10, 5); ctx.lineTo(7, -12); ctx.lineTo(12, -7); ctx.lineTo(-5, 10);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath(); ctx.moveTo(4, -9); ctx.lineTo(9, -4); ctx.stroke();
            break;
        case 1: // Kişi Limiti (#)
            ctx.beginPath();
            ctx.moveTo(-5, -12); ctx.lineTo(-7, 12);
            ctx.moveTo(5, -12); ctx.lineTo(3, 12);
            ctx.moveTo(-12, -4); ctx.lineTo(12, -4);
            ctx.moveTo(-12, 4); ctx.lineTo(12, 4);
            ctx.stroke();
            break;
        case 2: // Oda Kilidi
            drawRoundRect(ctx, -10, -2, 20, 15, 4);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(0, -2, 7, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 5, 2, 0, Math.PI * 2); ctx.fill();
            break;
        case 3: // Kullanıcı At (Kapı)
            ctx.strokeRect(-12, -12, 14, 24);
            ctx.beginPath();
            ctx.moveTo(2, 0); ctx.lineTo(12, 0);
            ctx.lineTo(8, -4);
            ctx.moveTo(12, 0); ctx.lineTo(8, 4);
            ctx.stroke();
            break;
        case 4: // Erişim Ver (+)
            ctx.beginPath(); ctx.arc(-4, -6, 5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(-4, 9, 8, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(14, 0);
            ctx.moveTo(11, -3); ctx.lineTo(11, 3); ctx.stroke();
            break;
        case 5: // Erişim Kaldır (-)
            ctx.beginPath(); ctx.arc(-4, -6, 5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(-4, 9, 8, Math.PI, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(14, 0); ctx.stroke();
            break;
        case 6: // Sahip Devret (Taç)
            ctx.beginPath();
            ctx.moveTo(-12, 8); ctx.lineTo(-12, -4); ctx.lineTo(-6, 2); ctx.lineTo(0, -8); ctx.lineTo(6, 2); ctx.lineTo(12, -4); ctx.lineTo(12, 8);
            ctx.closePath();
            ctx.stroke();
            break;
        case 7: // Odayı Sil (Çöp Kutusu)
            ctx.beginPath();
            ctx.moveTo(-12, -6); ctx.lineTo(12, -6);
            ctx.moveTo(-4, -6); ctx.lineTo(-4, -10); ctx.lineTo(4, -10); ctx.lineTo(4, -6);
            ctx.moveTo(-8, -6); ctx.lineTo(-6, 11); ctx.lineTo(6, 11); ctx.lineTo(8, -6);
            ctx.stroke();
            break;
    }
    ctx.restore();
}

function generateCustomVoiceBanner() {
    const width = 1000;
    const height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Şeffaf Köşeler
    drawRoundRect(ctx, 0, 0, width, height, 32);
    ctx.clip();

    // 2. Arka Plan
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090a0f');
    bgGrad.addColorStop(0.5, '#12141d');
    bgGrad.addColorStop(1, '#08080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Glow Efektleri
    ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.beginPath(); ctx.arc(150, 100, 140, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
    ctx.beginPath(); ctx.arc(850, 420, 160, 0, Math.PI*2); ctx.fill();

    // Dış İnce Çerçeve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 30);
    ctx.stroke();

    // 3. Üst Başlık Bölümü
    drawRoundRect(ctx, 40, 36, 48, 48, 14);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(56, 60); ctx.lineTo(56, 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(64, 52); ctx.lineTo(64, 68); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(72, 46); ctx.lineTo(72, 74); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('ÖZEL SES KANALI PANELİ', 105, 58);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Kendi özel ses odanızı aşağıdaki butonlar aracılığıyla hızlı ve kolayca yönetin.', 105, 82);

    // 4. 8 Adet Grid Kartı
    const cards = [
        { title: 'Oda İsmi', desc: 'Odanın adını değiştirir' },
        { title: 'Kişi Limiti', desc: 'Oda limitini ayarlar' },
        { title: 'Oda Kilidi', desc: 'Odayı kilitler veya açar' },
        { title: 'Kullanıcı At', desc: 'Kişiyi odadan çıkartır' },
        { title: 'Erişim Ver', desc: 'Odaya giriş izni verir' },
        { title: 'Erişim Kaldır', desc: 'Giriş iznini kaldırır' },
        { title: 'Sahip Devret', desc: 'Oda sahipliğini aktarır' },
        { title: 'Odayı Sil', desc: 'Özel odayı sonlandırır' }
    ];

    const cardW = 215;
    const cardH = 170;
    const gapX = 20;
    const gapY = 20;
    const startX = 40;
    const startY = 120;

    cards.forEach((c, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        drawRoundRect(ctx, x, y, cardW, cardH, 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        drawIcons(ctx, i, x + cardW / 2, y + 45);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(c.title, x + cardW / 2, y + 95);

        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText(c.desc, x + cardW / 2, y + 128);
    });

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'ozeloda',
    modOnly: true,
    async execute(message, client, args) {
        try {
            const guild = message.guild;

            // 1. Özel Odalar Kategorisi Oluştur / Bul
            let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === 'özel odalar');
            if (!category) {
                category = await guild.channels.create({
                    name: 'ÖZEL ODALAR',
                    type: ChannelType.GuildCategory
                });
            }

            // 2. Metin Kanalı (Panel) Oluştur / Bul
            let panelChannel = guild.channels.cache.find(c => c.parentId === category.id && c.type === ChannelType.GuildText && c.name.includes('ozel-oda-panel'));
            if (!panelChannel) {
                panelChannel = await guild.channels.create({
                    name: 'ozel-oda-panel',
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                            deny: [PermissionFlagsBits.SendMessages]
                        }
                    ]
                });
            }

            // 3. Ses Kanalı (Oda Oluştur) Oluştur / Bul
            let createVoiceChannel = guild.channels.cache.find(c => c.parentId === category.id && c.type === ChannelType.GuildVoice && c.name.includes('oda-olustur'));
            if (!createVoiceChannel) {
                createVoiceChannel = await guild.channels.create({
                    name: '➕ Oda Oluştur',
                    type: ChannelType.GuildVoice,
                    parent: category.id
                });
            }

            // 4. Panel Mesajını Gönder
            const bannerBuffer = generateCustomVoiceBanner();
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'custom_voice_panel.png' });

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ozeloda_rename').setLabel('İsim Değiştir').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('ozeloda_limit').setLabel('Kişi Limiti').setStyle(ButtonStyle.Secondary).setEmoji('👥'),
                new ButtonBuilder().setCustomId('ozeloda_lock').setLabel('Kilitle / Aç').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
                new ButtonBuilder().setCustomId('ozeloda_kick').setLabel('Kullanıcı At').setStyle(ButtonStyle.Secondary).setEmoji('🚪')
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ozeloda_allow').setLabel('Erişim Ver').setStyle(ButtonStyle.Secondary).setEmoji('➕'),
                new ButtonBuilder().setCustomId('ozeloda_deny').setLabel('Erişim Kaldır').setStyle(ButtonStyle.Secondary).setEmoji('➖'),
                new ButtonBuilder().setCustomId('ozeloda_transfer').setLabel('Sahip Devret').setStyle(ButtonStyle.Secondary).setEmoji('👑'),
                new ButtonBuilder().setCustomId('ozeloda_delete').setLabel('Odayı Kapat').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
            );

            await panelChannel.send({
                files: [attachment],
                components: [row1, row2]
            });

            // 5. Config'e Kaydet
            client.serverConfig.customVoiceCategory = category.id;
            client.serverConfig.customVoiceChannel = createVoiceChannel.id;
            client.serverConfig.customVoicePanel = panelChannel.id;

            fs.writeFileSync('./config.json', JSON.stringify(client.serverConfig, null, 2));

            message.reply(`✅ Özel oda sistemi başarıyla kuruldu!\n📁 Kategori: ${category.name}\n💬 Panel Kanalı: ${panelChannel}\n🔊 Oluşturma Kanalı: ${createVoiceChannel}`);

        } catch (error) {
            console.error("Özel oda komutu hatası:", error);
            message.reply("❌ Özel oda sistemi kurulurken bir hata oluştu!");
        }
    }
};
