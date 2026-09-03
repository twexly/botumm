const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MediaGalleryBuilder, 
    ChannelType, 
    PermissionFlagsBits, 
    AttachmentBuilder, 
    MessageFlags 
} = require('discord.js');
const { generateHelpBanner } = require('./yardim');

const emojis = require('../emojis');

async function sendSetupGuide(guild, targetChannel) {
    const bannerBuffer = generateHelpBanner();
    const attachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${emojis.settings} ${guild.name} — Bot Kurulum ve Başlangıç Rehberi`),
            new TextDisplayBuilder().setContent(
                `${emojis.hello} **Bot sunucunuza başarıyla eklendi!** Sunucunuzu en verimli ve güvenli şekilde yapılandırabilmeniz için adım adım rehber aşağıda hazırlanmıştır.`
            )
        );

    const media = new MediaGalleryBuilder().addItems([{ media: { url: 'attachment://help_banner.png' } }]);
    container.addMediaGalleryComponents(media);

    container.addSeparatorComponents(new SeparatorBuilder());

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### ⚠️ İLK YAPILMASI GEREKEN ADIM (ZORUNLU)\n` +
            `Botun tüm moderasyon, denetim ve yönetim komutlarının güvenle çalışabilmesi için **ilk olarak yetkili rolünü** tanımlamalısınız:\n\n` +
            `👉 **\`.adminrole <@rol veya Rol ID>\`**\n` +
            `*(Örnek: \`.adminrole @Yönetici\` veya \`.adminrole 123456789012345678\`)*\n\n` +
            `*Not: Bu rol ayarlanana kadar moderasyon komutları sadece sunucu sahibi tarafından kullanılabilir.*`
        ),
        new TextDisplayBuilder().setContent(
            `### 📋 Sunucunuz İçin Önerilen Sıradaki Kurulumlar\n` +
            `Yetkili rolünü ayarladıktan sonra aşağıdaki sistemleri sırayla aktif edebilirsiniz:\n\n` +
            `• ${emojis.matter} **1. Log Sistemi:** \`.log\` yazarak moderasyon ve sunucu denetim log kanallarını tek tıkla otomatik oluşturun.\n` +
            `• ${emojis.matter} **2. Hoş Geldin Sistemi:** \`.welcome #kanal\` yazarak 3 şık temalı resimli karşılama panelini ayarlayın.\n` +
            `• ${emojis.matter} **3. Ticket (Destek) Sistemi:** \`.ticket\` yazarak adım adım görsel kılavuzlu destek paneli kurun.\n` +
            `• ${emojis.matter} **4. Özel Ses Odaları:** \`.ozeloda\` yazarak butonlu ses kanalı yönetim panelini kurun.\n` +
            `• ${emojis.matter} **5. Çekiliş Sistemi:** \`.cekilis <ödül> <kişisayısı> <süre> <açıklama>\` ile butonlu çekiliş düzenleyin.\n` +
            `• ${emojis.matter} **6. Sunucu Sayım Kartı:** \`.say\` yazarak anlık üye, kanal, rol ve boost istatistiklerini görün.\n` +
            `• ${emojis.matter} **7. Reklam Koruması:** \`.offadd\` yazarak otomatik link ve davet engellemesini açın.\n` +
            `• ${emojis.matter} **8. Geliştirici Bilgisi:** \`.dev\` yazarak bot yapımcısı (${emojis.developer} twexly) bilgilerini görün.\n` +
            `• ${emojis.matter} **9. Komut Rehberi:** Tüm komutları ve detayları incelemek için dilediğiniz zaman \`.yardım\` yazabilirsiniz.`
        )
    );

    return targetChannel.send({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2
    });
}

async function ensureSetupChannel(guild) {
    if (!guild) return null;
    try {
        const channels = await guild.channels.fetch();
        let setupChannel = channels.find(c => c && c.name === 'bot-kurulum' && c.type === ChannelType.GuildText);

        if (!setupChannel) {
            setupChannel = await guild.channels.create({
                name: 'bot-kurulum',
                type: ChannelType.GuildText,
                topic: 'Bot Kurulum ve Başlangıç Rehberi | İlk Adım: .adminrole <@rol>',
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
                        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions]
                    },
                    {
                        id: guild.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks
                        ]
                    }
                ]
            });

            await sendSetupGuide(guild, setupChannel);
            console.log(`[Kurulum] ${guild.name} sunucusunda #bot-kurulum kanalı başarıyla oluşturuldu ve rehber gönderildi.`);
        }
        return setupChannel;
    } catch (err) {
        console.error(`[Kurulum Hatası] ${guild.name} sunucusunda #bot-kurulum oluşturulamadı:`, err);
        return null;
    }
}

module.exports = {
    name: 'kurulum',
    aliases: ['rehber', 'baslangic', 'setup'],
    modOnly: true,
    sendSetupGuide,
    ensureSetupChannel,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply("Bu komutu sadece sunucu yetkilileri kullanabilir.");
        }

        try {
            const channels = await message.guild.channels.fetch();
            let setupChannel = channels.find(c => c && c.name === 'bot-kurulum' && c.type === ChannelType.GuildText);

            if (!setupChannel) {
                setupChannel = await ensureSetupChannel(message.guild);
                await message.reply(`Kurulum kanalı başarıyla oluşturuldu: ${setupChannel}`);
            } else {
                await sendSetupGuide(message.guild, setupChannel);
                await message.reply(`Kurulum rehberi ${setupChannel} kanalına yeniden gönderildi!`);
            }

        } catch (err) {
            console.error("Manuel kurulum komutu hatası:", err);
            message.reply("Kurulum kanalı veya rehberi oluşturulurken bir hata oluştu.");
        }
    }
};
