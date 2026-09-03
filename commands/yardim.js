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
    const width = 1040;
    const height = 580;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Köşeleri Kırp
    drawRoundRect(ctx, 0, 0, width, height, 28);
    ctx.clip();

    // 2. Arka Plan Gradyanı
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#08090f');
    bgGrad.addColorStop(0.5, '#0f111a');
    bgGrad.addColorStop(1, '#05060a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Arka Plan Işık Efektleri (Bokeh)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.beginPath(); ctx.arc(180, 100, 150, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.08)';
    ctx.beginPath(); ctx.arc(840, 140, 160, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath(); ctx.arc(520, 460, 180, 0, Math.PI * 2); ctx.fill();

    // Dış İnce Çerçeve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 26);
    ctx.stroke();

    // 3. Başlık Alanı
    ctx.textAlign = 'left';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('KOMUT REHBERİ VE KULLANIM KILAVUZU', 50, 62);

    // Prefix Rozeti (Pill Badge)
    const prefixText = 'Prefix: . ve !';
    ctx.font = 'bold 15px sans-serif';
    const pWidth = ctx.measureText(prefixText).width + 30;
    drawRoundRect(ctx, 50, 80, pWidth, 30, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText(prefixText, 50 + pWidth / 2, 100);

    // 4. İki Ana Kolon (Sol: Genel & Eğlence, Sağ: Yönetim & Sistemler)
    const colWidth = 450;
    const colHeight = 420;
    const colY = 125;

    // --- SOL KOLON (Genel & Eğlence) ---
    const leftX = 50;
    drawRoundRect(ctx, leftX, colY, colWidth, colHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sol Kolon Başlığı
    drawRoundRect(ctx, leftX + 20, colY + 16, 190, 32, 16);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GENEL & EĞLENCE', leftX + 115, colY + 36);

    const generalCmds = [
        { name: '.rank', desc: 'Seviye, XP ve sıralama kartını gösterir' },
        { name: '.toplevel', desc: 'En aktif üyelerin liderlik sıralaması' },
        { name: '.say', desc: 'Üye, kanal, rol ve boost sayım kartı' },
        { name: '.ship', desc: 'İki üye arasındaki aşk ve uyum yüzdesi' },
        { name: '.ai <soru>', desc: 'Yapay zeka ile anlık soru-cevap sohbeti' },
        { name: '.kurulum', desc: 'Rehber ve başlangıç kanalını oluşturur' },
        { name: '.yardım', desc: 'Tüm komutları ve rehber menüsünü açar' }
    ];

    ctx.textAlign = 'left';
    generalCmds.forEach((cmd, i) => {
        const itemY = colY + 68 + i * 48;
        drawRoundRect(ctx, leftX + 20, itemY - 18, 100, 28, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();

        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cmd.name, leftX + 28, itemY + 1);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(cmd.desc, leftX + 130, itemY);
    });

    // --- SAĞ KOLON (Yönetim & Sistemler) ---
    const rightX = 540;
    drawRoundRect(ctx, rightX, colY, colWidth, colHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Sağ Kolon Başlığı
    drawRoundRect(ctx, rightX + 20, colY + 16, 210, 32, 16);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YÖNETİM & SİSTEMLER', rightX + 125, colY + 36);

    const modCmds = [
        { name: '.adminrole', desc: 'Yetkili rolünü ayarlar (İlk Zorunlu Adım)' },
        { name: '.cekilis', desc: 'Butonlu şık çekiliş başlatır (.cekilis)' },
        { name: '.ticket', desc: 'İnteraktif destek bilet paneli kurar' },
        { name: '.welcome', desc: '3 temalı resimli hoş geldin kanalını ayarlar' },
        { name: '.ozeloda', desc: 'Özel ses kanalı oluşturma panelini kurar' },
        { name: '.log', desc: 'Sunucu ve mod denetim loglarını oluşturur' },
        { name: '.offadd', desc: 'Anti-link / Reklam korumasını açar/kapatır' }
    ];

    ctx.textAlign = 'left';
    modCmds.forEach((cmd, i) => {
        const itemY = colY + 68 + i * 48;
        drawRoundRect(ctx, rightX + 20, itemY - 16, 110, 26, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();

        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(cmd.name, rightX + 28, itemY + 2);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(cmd.desc, rightX + 140, itemY + 1);
    });

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'yardim',
    aliases: ['yardım', 'help'],
    generateHelpBanner,
    async execute(message, client, args) {
        try {
            const bannerBuffer = generateHelpBanner();
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 📖 Komut Rehberi ve Kullanım Kılavuzu'),
                    new TextDisplayBuilder().setContent('*Botun tüm komutlarını hem `.` hem de `!` prefixi ile kullanabilirsiniz.*')
                );

            const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://help_banner.png' } }]);
            container.addMediaGalleryComponents(media);

            container.addSeparatorComponents(new SeparatorBuilder());

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '### 🛠️ Yönetim & Kurulum Sistemleri\n' +
                    '• **`.adminrole <@rol/ID>`** : Botun yetkili rolünü tanımlar (**İlk Zorunlu Adım**).\n' +
                    '• **`.kurulum`** : Başlangıç rehber kanalını (**#bot-kurulum**) oluşturur.\n' +
                    '• **`.cekilis <ödül> <kişi> <süre> <açıklama>`** : Butonlu şık çekiliş başlatır.\n' +
                    '• **`.reroll [mesajID]`** : Sona eren çekiliş için yeniden kazanan belirler.\n' +
                    '• **`.ticket`** : Görsel kılavuzlu adım adım bilet paneli kurar.\n' +
                    '• **`.welcome <#kanal>`** : 3 temalı hoş geldin resimli karşılama kanalını ayarlar.\n' +
                    '• **`.ozeloda`** : Butonlu özel ses odası yönetim panelini kurar.\n' +
                    '• **`.log`** : Moderasyon ve sunucu denetim log kanallarını otomatik açar.\n' +
                    '• **`.level <#kanal>`** : Seviye atlama kutlama kanalını ayarlar.\n' +
                    '• **`.offadd`** : Otomatik reklam ve link engelleme korumasını açar/kapatır.'
                ),
                new TextDisplayBuilder().setContent(
                    '### 🛡️ Moderasyon & Güvenlik Komutları\n' +
                    '• **`.rolekle <@üye> <@rol>`** : Üyeye güvenli şekilde rol verir.\n' +
                    '• **`.ban <@üye>`** / **`.kick <@üye>`** : Kullanıcıyı sunucudan yasaklar veya atar.\n' +
                    '• **`.lock`** / **`.unlock`** : Bulunduğunuz kanala mesaj yazımını kilitler veya açar.\n' +
                    '• **`.slowmode <saniye>`** : Kanal için yavaş mod süresini ayarlar.\n' +
                    '• **`.nuke`** : Kanalı klonlayıp tüm eski mesajları temizler.'
                ),
                new TextDisplayBuilder().setContent(
                    '### 🎮 Genel & Eğlence Komutları\n' +
                    '• **`.rank`** : Seviye, XP ve sunucu sıralama kartınızı gösterir.\n' +
                    '• **`.toplevel`** : Sunucunun en aktif üyelerini (mesaj, ses, seviye) listeler.\n' +
                    '• **`.say`** : Sunucudaki üye, kanal, rol ve boost istatistiklerini resimli kartla gösterir.\n' +
                    '• **`.ship <@üye>`** : İki kullanıcı arasındaki aşk ve uyum yüzdesini hesaplar.\n' +
                    '• **`.ai <soru>`** : Yapay zeka ile anlık sohbet eder ve sorularınızı yanıtlar.\n' +
                    '• **`.yardım`** : Tüm komut rehberini ve bu menüyü açar.'
                )
            );

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
