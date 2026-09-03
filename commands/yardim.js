const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const { createCanvas } = require('canvas');

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

function generateHelpBanner() {
    const width = 1000;
    const height = 520;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Köşeleri Kırp
    drawRoundRect(ctx, 0, 0, width, height, 28);
    ctx.clip();

    // 2. Arka Plan Gradyanı
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(0.5, '#12131c');
    bgGrad.addColorStop(1, '#07070b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Arka Plan Işık Efektleri (Bokeh)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.beginPath(); ctx.arc(180, 100, 140, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
    ctx.beginPath(); ctx.arc(820, 140, 160, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath(); ctx.arc(500, 420, 180, 0, Math.PI * 2); ctx.fill();

    // Dış İnce Çerçeve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 26);
    ctx.stroke();

    // 3. Başlık Alanı
    ctx.textAlign = 'left';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KOMUT REHBERİ', 50, 65);

    // Prefix Rozeti (Pill Badge)
    const prefixText = 'Prefix: . ve !';
    ctx.font = 'bold 16px sans-serif';
    const pWidth = ctx.measureText(prefixText).width + 30;
    drawRoundRect(ctx, 50, 85, pWidth, 32, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(prefixText, 50 + pWidth / 2, 106);

    // 4. İki Ana Kolon (Sol: Genel & Eğlence, Sağ: Moderasyon & Sistem)
    const colWidth = 430;
    const colHeight = 350;
    const colY = 135;

    // --- SOL KOLON (Genel & Eğlence) ---
    const leftX = 50;
    drawRoundRect(ctx, leftX, colY, colWidth, colHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sol Kolon Başlığı
    drawRoundRect(ctx, leftX + 20, colY + 18, 180, 32, 16);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GENEL & EĞLENCE', leftX + 110, colY + 39);

    // Sol Kolon Komut Listesi
    const generalCmds = [
        { name: '.rank', desc: 'Seviye, XP ve sıralama kartını gösterir' },
        { name: '.toplevel', desc: 'En aktif üyelerin liderlik tablosu' },
        { name: '.ship', desc: 'İki üye arasındaki aşk ve uyum yüzdesi' },
        { name: '.ai <soru>', desc: 'Yapay zeka ile anlık sohbet ve yanıt' },
        { name: '.yardım', desc: 'Tüm komutları ve kullanım rehberini açar' }
    ];

    ctx.textAlign = 'left';
    generalCmds.forEach((cmd, i) => {
        const itemY = colY + 80 + i * 54;
        
        // Komut hap kutusu
        drawRoundRect(ctx, leftX + 20, itemY - 18, 100, 28, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();

        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cmd.name, leftX + 30, itemY + 1);

        // Açıklama
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(cmd.desc, leftX + 130, itemY);
    });

    // --- SAĞ KOLON (Yönetim & Moderasyon) ---
    const rightX = 520;
    drawRoundRect(ctx, rightX, colY, colWidth, colHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sağ Kolon Başlığı
    drawRoundRect(ctx, rightX + 20, colY + 18, 200, 32, 16);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YÖNETİM & MODERASYON', rightX + 120, colY + 39);

    // Sağ Kolon Komut Listesi
    const modCmds = [
        { name: '.adminrole', desc: 'Botun moderatör yetkili rolünü ayarlar' },
        { name: '.ozeloda', desc: 'Özel ses kanalı oluşturma panelini kurar' },
        { name: '.log', desc: 'Sunucu ve mod log kanallarını oluşturur' },
        { name: '.welcome', desc: 'Resimli karşılama kanalını ayarlar' },
        { name: '.offadd', desc: 'Anti-link / Reklam korumasını açar/kapatır' },
        { name: '.rolekle', desc: 'Üyeye güvenli şekilde rol verir' }
    ];

    ctx.textAlign = 'left';
    modCmds.forEach((cmd, i) => {
        const itemY = colY + 74 + i * 44;
        
        // Komut hap kutusu
        drawRoundRect(ctx, rightX + 20, itemY - 16, 105, 26, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();

        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cmd.name, rightX + 28, itemY + 2);

        // Açıklama
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(cmd.desc, rightX + 135, itemY + 1);
    });

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'yardim',
    aliases: ['yardım', 'help'],
    async execute(message, client, args) {
        try {
            const bannerBuffer = generateHelpBanner();
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# Komut Rehberi ve Kullanım Kılavuzu'),
                    new TextDisplayBuilder().setContent('*Botun tüm komutlarını hem `.` hem de `!` prefixi ile kullanabilirsiniz.*')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '### Genel & Eğlence Komutları\n' +
                        '• **`.rank`** `[!rank]` : Seviye, kazanılan XP ve sunucu sıralama kartını gösterir.\n' +
                        '• **`.toplevel`** `[!toplevel]` : Sunucunun en aktif (mesaj, ses, seviye) üyelerini listeler.\n' +
                        '• **`.ship`** `[!ship @üye]` : İki kullanıcı arasındaki aşk ve uyum yüzdesini hesaplar.\n' +
                        '• **`.ai <soru>`** `[!ai]` : Yapay zeka ile anlık sohbet eder ve sorularınızı yanıtlar.'
                    ),
                    new TextDisplayBuilder().setContent(
                        '### Yönetim & Moderasyon Komutları\n' +
                        '• **`.ticket`** `[!ticket]` : Adım adım interaktif destek paneli kurulum sihirbazını başlatır.\n' +
                        '• **`.adminrole <@rol/ID>`** : Botun yetkili/moderatör rolünü belirler.\n' +
                        '• **`.ozeloda`** : Gelişmiş butonlu özel ses odası yönetim panelini kurar.\n' +
                        '• **`.log`** : Sunucu ve moderasyon log kayıt kanallarını otomatik oluşturur.\n' +
                        '• **`.welcome <#kanal>`** : Yeni üyelere özel resimli hoş geldin karşılama kanalını ayarlar.\n' +
                        '• **`.level`** : Seviye atlama bildirimlerinin gönderileceği kanalı kilitler ve ayarlar.\n' +
                        '• **`.offadd`** : Otomatik reklam ve link engelleme korumasını açar / kapatır.\n' +
                        '• **`.rolekle <@üye> <@rol>`** : Belirtilen kullanıcıya güvenli şekilde rol verir.\n' +
                        '• **`.ban <@üye>`** / **`.kick <@üye>`** : Kullanıcıyı sunucudan yasaklar veya atar.\n' +
                        '• **`.lock`** / **`.unlock`** : Bulunduğunuz kanala mesaj yazımını kilitler veya açar.\n' +
                        '• **`.slowmode <saniye>`** : Kanal için yavaş mod süresini ayarlar.\n' +
                        '• **`.nuke`** : Kanalı klonlayıp tüm mesajları temizler.'
                    )
                );

            const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://help_banner.png' } }]);
            container.addMediaGalleryComponents(media);

            await message.reply({
                components: [container],
                files: [attachment],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Yardım komutu hatası:", error);
            message.reply("Yardım menüsü oluşturulurken bir hata meydana geldi.");
        }
    }
};
