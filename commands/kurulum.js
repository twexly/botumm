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

async function sendSetupGuide(guild, targetChannel) {
    const bannerBuffer = generateHelpBanner();
    const attachment = new AttachmentBuilder(bannerBuffer, { name: 'help_banner.png' });

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# 🚀 ${guild.name} — Bot Kurulum ve Başlangıç Rehberi`),
            new TextDisplayBuilder().setContent(
                `Bot sunucunuza başarıyla eklendi! Sunucunuzu en verimli ve güvenli şekilde yapılandırabilmeniz için adım adım rehber aşağıda hazırlanmıştır.`
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
            `• **1. Log Sistemi:** \`.log\` yazarak moderasyon ve sunucu denetim log kanallarını tek tıkla otomatik oluşturun.\n` +
            `• **2. Hoş Geldin Sistemi:** \`.welcome #kanal\` yazarak 3 şık temalı resimli karşılama panelini ayarlayın.\n` +
            `• **3. Ticket (Destek) Sistemi:** \`.ticket\` yazarak adım adım görsel kılavuzlu destek paneli kurun.\n` +
            `• **4. Özel Ses Odaları:** \`.ozeloda\` yazarak butonlu ses kanalı yönetim panelini kurun.\n` +
            `• **5. Çekiliş Sistemi:** \`.cekilis <ödül> <kişisayısı> <süre> <açıklama>\` ile butonlu çekiliş düzenleyin.\n` +
            `• **6. Reklam Koruması:** \`.offadd\` yazarak otomatik link ve davet engellemesini açın.\n` +
            `• **7. Komut Rehberi:** Tüm komutları ve detayları incelemek için dilediğiniz zaman \`.yardım\` yazabilirsiniz.`
        )
    );

    return targetChannel.send({
        components: [container],
        files: [attachment],
        flags: MessageFlags.IsComponentsV2
    });
}

module.exports = {
    name: 'kurulum',
    aliases: ['rehber', 'baslangic', 'setup'],
    sendSetupGuide,
    async execute(message, client, args) {
        if (!message.guild) return;

        const isOwner = message.guild.ownerId === message.author.id;
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !isAdmin) {
            return message.reply("Bu komutu sadece sunucu sahibi veya Yönetici yetkisine sahip kullanıcılar kullanabilir.");
        }

        try {
            let setupChannel = message.guild.channels.cache.find(c => c.name === 'bot-kurulum' && c.type === ChannelType.GuildText);

            if (!setupChannel) {
                setupChannel = await message.guild.channels.create({
                    name: 'bot-kurulum',
                    type: ChannelType.GuildText,
                    topic: 'Bot ilk kurulum ve yönetim başlangıç kılavuzu kanalı.',
                    permissionOverwrites: [
                        {
                            id: message.guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: message.author.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        },
                        {
                            id: client.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.AttachFiles,
                                PermissionFlagsBits.EmbedLinks
                            ]
                        }
                    ]
                });
            }

            await sendSetupGuide(message.guild, setupChannel);
            await message.reply(`Kurulum rehberi başarıyla ${setupChannel} kanalına gönderildi!`);

        } catch (err) {
            console.error("Manuel kurulum komutu hatası:", err);
            message.reply("Kurulum kanalı veya rehberi oluşturulurken bir hata oluştu.");
        }
    }
};
