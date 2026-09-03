const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SectionBuilder, 
    ThumbnailBuilder, 
    MediaGalleryBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags, 
    AttachmentBuilder 
} = require('discord.js');
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

function generateVerifyBanner() {
    const width = 920;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Arka Plan
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#080C0B');
    bgGrad.addColorStop(0.5, '#0D1814');
    bgGrad.addColorStop(1, '#070B0A');
    ctx.fillStyle = bgGrad;
    drawRoundRect(ctx, 0, 0, width, height, 24);
    ctx.fill();

    // 2. Neon Yeşil Parıltılar (Glow Effects)
    const glow1 = ctx.createRadialGradient(180, 150, 10, 180, 150, 220);
    glow1.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    glow1.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
    glow1.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 450, height);

    const glow2 = ctx.createRadialGradient(800, 50, 0, 800, 50, 250);
    glow2.addColorStop(0, 'rgba(52, 211, 153, 0.15)');
    glow2.addColorStop(1, 'rgba(52, 211, 153, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(500, 0, 420, height);

    // Dış Neon Çerçeve
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, 1, 1, width - 2, height - 2, 24);
    ctx.stroke();

    // 3. Sol Taraf: Büyük Şık Parlak Yeşil Tik & Kalkan İkonu
    const iconCenterX = 170;
    const iconCenterY = 150;

    // Dış Halka
    ctx.save();
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, 82, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // İç Kalkan/Daire
    const circleGrad = ctx.createLinearGradient(iconCenterX - 65, iconCenterY - 65, iconCenterX + 65, iconCenterY + 65);
    circleGrad.addColorStop(0, '#059669');
    circleGrad.addColorStop(1, '#10B981');
    ctx.fillStyle = circleGrad;
    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(iconCenterX, iconCenterY, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Büyük Parlak Beyaz Tik
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#A7F3D0';
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(iconCenterX - 30, iconCenterY + 2);
    ctx.lineTo(iconCenterX - 8, iconCenterY + 24);
    ctx.lineTo(iconCenterX + 34, iconCenterY - 22);
    ctx.stroke();
    ctx.restore();

    // 4. Sağ Taraf: Tipografi ve Bilgiler
    const textStartX = 320;

    // Küçük Rozet
    drawRoundRect(ctx, textStartX, 52, 230, 32, 16);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#34D399';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ GÜVENLİK & DOĞRULAMA', textStartX + 115, 73);

    // Ana Başlık
    ctx.font = 'bold 38px sans-serif';
    const titleGrad = ctx.createLinearGradient(textStartX, 120, textStartX + 400, 120);
    titleGrad.addColorStop(0, '#FFFFFF');
    titleGrad.addColorStop(1, '#A7F3D0');
    ctx.fillStyle = titleGrad;
    ctx.textAlign = 'left';
    ctx.fillText('SUNUCU DOĞRULAMA', textStartX, 130);

    // Açıklama Metni
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#CBD5E1';
    ctx.fillText('Aramıza katılmak ve tüm kanallara erişmek için', textStartX, 172);
    ctx.fillText('aşağıdaki butona tıklayarak kaydını tamamla.', textStartX, 198);

    // Alt Yeşil Çizgi
    const lineGrad = ctx.createLinearGradient(textStartX, 235, textStartX + 450, 235);
    lineGrad.addColorStop(0, '#10B981');
    lineGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(textStartX, 235);
    ctx.lineTo(textStartX + 450, 235);
    ctx.stroke();

    // Mini Bilgi
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('⚡ Tek tıkla anında üye rolü tanımlanır • 7/24 Aktif', textStartX, 260);

    return canvas.toBuffer('image/png');
}

module.exports = {
    name: 'verify',
    aliases: ['dogrula', 'doğrula', 'onay', 'kayit', 'kayıt'],
    modOnly: true,
    description: 'Doğrulama (üye rolü verme) panelini kurar veya gönderir.',
    generateVerifyBanner,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        const guildConfig = client.getGuildConfig(message.guild.id);

        // 1. Parametre olarak rol verilmiş mi kontrol et
        let targetRole = message.mentions.roles.first();
        if (!targetRole && args[0]) {
            const cleanId = args[0].replace(/[<@&>]/g, '').trim();
            targetRole = message.guild.roles.cache.get(cleanId) || 
                message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
        }

        // Eğer yeni rol belirtilmişse ayarla
        if (targetRole) {
            guildConfig.verifyRole = targetRole.id;
            client.saveConfig();
        }

        // Eğer mevcut ayarlı rol yoksa ve rol belirtilmemişse uyar
        const activeRoleId = guildConfig.verifyRole;
        if (!activeRoleId) {
            return message.reply({
                content: `${emojis.cross} Sunucuda henüz bir doğrulama rolü ayarlanmamış!\n\n` +
                    `${emojis.settings} **Kullanım:** \`.verify @rol\` veya \`.verify <rol_id>\`\n` +
                    `*Örnek:* \`.verify @Üye\``
            });
        }

        const role = message.guild.roles.cache.get(activeRoleId) || await message.guild.roles.fetch(activeRoleId).catch(() => null);
        if (!role) {
            return message.reply({
                content: `${emojis.cross} Ayarlı doğrulama rolü sunucuda bulunamadı! Lütfen geçerli bir rol ile tekrar ayarlayın:\n\`.verify @rol\``
            });
        }

        // 2. Banner oluştur
        const bannerBuffer = generateVerifyBanner();
        const attachment = new AttachmentBuilder(bannerBuffer, { name: 'verify_banner.png' });

        // 3. Components V2 Container oluştur
        const container = new ContainerBuilder();

        // Section (Başlık, Açıklama ve Sunucu İkonu Thumbnail)
        const section = new SectionBuilder();
        section.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# Sunucu Doğrulama'),
            new TextDisplayBuilder().setContent(
                `Sunucumuza hoş geldiniz! Topluluğumuzun güvenliğini sağlamak ve tüm kanallara tam erişim elde etmek için lütfen üyeliğinizi onaylayın.\n\n` +
                `${emojis.matter} **Tanımlanacak Rol:** ${role}\n` +
                `${emojis.matter} **İşlem:** Aşağıdaki **Doğrula & Sunucuya Katıl** butonuna tıklamanız yeterlidir.\n` +
                `${emojis.matter} **Kurallar:** Butona tıkladığınızda sunucu kurallarımızı okumuş ve kabul etmiş sayılırsınız.\n\n` +
                `> *Aramıza katılmak ve kuralları onaylamak için butona tıklayın!*`
            )
        );

        const guildIcon = message.guild.iconURL({ extension: 'png', size: 256 });
        if (guildIcon && (guildIcon.startsWith('http://') || guildIcon.startsWith('https://'))) {
            try {
                section.setThumbnailAccessory(new ThumbnailBuilder().setURL(guildIcon));
            } catch (_) {}
        }
        container.addSectionComponents(section);

        // Büyük Parlak Yeşil Tik Banner
        const media = new MediaGalleryBuilder().addItems([
            { media: { url: 'attachment://verify_banner.png' }, description: 'Sunucu Doğrulama Banner' }
        ]);
        container.addMediaGalleryComponents(media);

        container.addSeparatorComponents(new SeparatorBuilder());

        // Doğrula Butonu (Özel Animasyonlu/Parlak Tik Emojisi ile)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_member_btn')
                .setLabel('Doğrula & Sunucuya Katıl')
                .setEmoji('1545103227865927690')
                .setStyle(ButtonStyle.Success)
        );
        container.addActionRowComponents(row);

        // Komut mesajını temizle ve paneli gönder
        await message.delete().catch(() => {});

        return message.channel.send({
            files: [attachment],
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
