const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, MessageFlags, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas } = require('canvas');
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
                    `### ${emojis.settings} Yönetim & Kurulum Sistemleri\n` +
                    `• **\`.adminrole <@rol/ID>\`** : Yetkili rolünü tanımlar (**İlk Zorunlu Adım**)\n` +
                    `• **\`.kurulum\`** : Başlangıç rehber kanalını (**#bot-kurulum**) oluşturur\n` +
                    `• **\`.sunucusablonu [isim]\`** : 4 farklı kategoride sunucu şablonu kurar\n` +
                    `• **\`.sunucudurum\`** : Kilitli canlı üye & ses istatistik kanallarını kurar/günceller\n` +
                    `• **\`.tagrol <tag> @rol\`** : Sunucu tagı alanlara otomatik rol verir/alır\n` +
                    `• **\`.welcome <#kanal>\`** : 3 temalı hoş geldin karşılama panelini ayarlar\n` +
                    `• **\`.verify <@rol>\`** : Parlak tik butonlu üye doğrulama panelini kurar\n` +
                    `• **\`.ticket\`** : Görsel kılavuzlu destek bilet sistemini kurar\n` +
                    `• **\`.cekilis <ödül> <kişi> <süre> <not>\`** : Butonlu şık çekiliş başlatır\n` +
                    `• **\`.reroll [mesajID]\`** : Çekilişte kazananı yeniden belirler\n` +
                    `• **\`.ozeloda\`** : Butonlu özel ses odası yönetim panelini kurar\n` +
                    `• **\`.log\`** : Moderasyon ve denetim log kanallarını otomatik açar\n` +
                    `• **\`.level <#kanal>\`** : Seviye atlama kutlama kanalını ayarlar\n` +
                    `• **\`.offadd\`** : Otomatik reklam & link engelleme korumasını açar/kapatır`
                ),
                new TextDisplayBuilder().setContent(
                    `### ${emojis.banhammer} Moderasyon & Güvenlik Komutları\n` +
                    `• **\`.sil <sayı>\`** : Belirtilen sayıda mesajı toplu siler\n` +
                    `• **\`.rolekle <@üye> <@rol>\`** : Üyeye güvenli şekilde rol verir\n` +
                    `• **\`.ban <@üye>\`** / **\`.kick <@üye>\`** : Kullanıcıyı sunucudan yasaklar veya atar\n` +
                    `• **\`.lock\`** / **\`.unlock\`** : Bulunduğunuz kanala mesaj yazımını kilitler veya açar\n` +
                    `• **\`.slowmode <saniye>\`** : Kanal için yavaş mod süresini ayarlar\n` +
                    `• **\`.nuke\`** : Kanalı klonlayıp tüm eski mesajları temizler`
                ),
                new TextDisplayBuilder().setContent(
                    '### 🎮 Genel & Eğlence Komutları\n' +
                    `• **\`.rank\`** : Seviye, XP ve sunucu sıralama kartınızı gösterir\n` +
                    `• **\`.toplevel\`** : En aktif üyelerin liderlik sıralamasını listeler\n` +
                    `• **\`.say\`** : Üye, kanal, rol ve boost istatistik kartını gösterir\n` +
                    `• **\`.dev\`** : Bot geliştiricisi (${emojis.developer} twexly) bilgilerini gösterir\n` +
                    `• **\`.ship <@üye>\`** : İki kullanıcı arasındaki aşk uyumunu hesaplar\n` +
                    `• **\`.ai <soru>\`** : Yapay zeka ile anlık sohbet eder ve yanıtlar\n` +
                    `• **\`.yardım\`** : Tüm komut rehberini ve bu menüyü açar`
                ),
                new TextDisplayBuilder().setContent(
                    `### 🪙 Canlı Döviz & Altın Kurları\n` +
                    `• **\`.dolar\`** / **\`.euro\`** : Anlık canlı Dolar ve Euro kurlarını gösterir\n` +
                    `• **\`.gramaltin\`** / **\`.yarimaltin\`** / **\`.tamaltin\`** : Canlı gram, yarım ve tam altın fiyatları\n` +
                    `• **\`.cumhuriyetaltini\`** / **\`.ceyrekaltin\`** : Canlı Cumhuriyet ve çeyrek altın fiyatları\n` +
                    `• **\`.doviz\`** : Tüm döviz ve altın piyasasını tek kartta listeler`
                ),
                new TextDisplayBuilder().setContent(
                    `### 🎰 Ekonomi & Casino Sistemi\n` +
                    `• **\`.bakiye [@üye]\`** : Cüzdan, banka ve toplam servet kartınızı gösterir\n` +
                    `• **\`.günlük\`** : 24 saatte bir günlük maaşınızı hesabınıza aktarır\n` +
                    `• **\`.çalış\`** : Çeşitli işlerde çalışarak 30 dakikada bir para kazandırır\n` +
                    `• **\`.soygun <@üye>\`** : Başka bir üyeyi soymayı denersiniz (%45 şans)\n` +
                    `• **\`.transfer <@üye> <miktar>\`** : Başka bir üyeye nakit para gönderir\n` +
                    `• **\`.slot <miktar>\`** : Slot makinesinde şansınızı denersiniz\n` +
                    `• **\`.blackjack <miktar>\`** : Krupiyeye karşı butonlu 21 kart oyunu oynarsınız\n` +
                    `• **\`.yazıtura <yazı/tura> <miktar>\`** : Parayı ikiye katlamak için yazı tura atarsınız\n` +
                    `• **\`.zenginler\`** : Sunucunun en zengin 10 üyesini listeler`
                ),
                new TextDisplayBuilder().setContent(
                    `### ${emojis.superlig} Süper Lig & Futbol\n` +
                    `• **\`.superlig\`** : Süper Lig takım rollerini oluşturur ve seçim menüsünü gönderir\n` +
                    `• **\`.puandurumu\`** : FlashScore üzerinden canlı Süper Lig puan durumu tablosunu çeker`
                )
            );

            await message.reply({
                components: [container],
                files: [attachment],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Yardım komutu hatası (Components V2):", error);
            try {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setTitle('📖 Komut Rehberi ve Kullanım Kılavuzu')
                    .setDescription('*Tüm komutları hem `.` hem de `!` prefixi ile kullanabilirsiniz.*')
                    .setImage('attachment://help_banner.png')
                    .addFields(
                        {
                            name: '⚙️ Yönetim & Kurulum',
                            value: '`adminrole`, `kurulum`, `sunucusablonu`, `sunucudurum`, `tagrol`, `welcome`, `verify`, `ticket`, `cekilis`, `reroll`, `ozeloda`, `log`, `level`, `offadd`'
                        },
                        {
                            name: '🛡️ Moderasyon & Güvenlik',
                            value: '`sil`, `rolekle`, `ban`, `kick`, `lock`, `unlock`, `slowmode`, `nuke`'
                        },
                        {
                            name: '🪙 Canlı Döviz & Altın',
                            value: '`dolar`, `euro`, `gramaltin`, `yarimaltin`, `tamaltin`, `cumhuriyetaltini`, `ceyrekaltin`, `doviz`'
                        },
                        {
                            name: '🎮 Genel & Eğlence',
                            value: '`rank`, `toplevel`, `say`, `dev`, `ship`, `ai`, `yardım`'
                        },
                        {
                            name: '🎰 Ekonomi & Casino',
                            value: '`bakiye`, `günlük`, `çalış`, `soygun`, `transfer`, `slot`, `blackjack`, `yazıtura`, `zenginler`'
                        },
                        {
                            name: '⚽ Süper Lig',
                            value: '`superlig`, `puandurumu`'
                        }
                    );
                const bannerBuffer = generateHelpBanner();
                const attachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });
                await message.reply({ embeds: [embed], files: [attachment] });
            } catch (fallbackErr) {
                console.error("Yardım fallback hatası:", fallbackErr);
                message.reply("Yardım menüsü oluşturulurken bir hata meydana geldi.");
            }
        }
    }
};
