const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    MediaGalleryBuilder, 
    SectionBuilder, 
    ThumbnailBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    AttachmentBuilder, 
    MessageFlags 
} = require('discord.js');
const path = require('path');
const fs = require('fs');

function sanitizeUrl(str) {
    if (!str) return null;
    const cleaned = str.replace(/[<>\s]/g, '').trim();
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
        return cleaned;
    }
    return null;
}

// Kanal bulma yardımcısı (Etiket, <#id>, ID, #isim, isim)
async function resolveChannel(guild, input, replyMsg) {
    if (replyMsg && replyMsg.mentions && replyMsg.mentions.channels && replyMsg.mentions.channels.size > 0) {
        return replyMsg.mentions.channels.first();
    }
    if (!input) return null;
    const cleanId = input.replace(/[<#>]/g, '').trim();
    const cleanName = input.replace(/^#/, '').trim().toLowerCase();

    const allChannels = await guild.channels.fetch().catch(() => guild.channels.cache);
    if (/^\d{17,20}$/.test(cleanId)) {
        const byId = allChannels.get(cleanId);
        if (byId) return byId;
    }

    const byName = allChannels.find(c => c && c.name && c.name.toLowerCase() === cleanName);
    return byName || null;
}

// Rol bulma yardımcısı (Etiket, <@&id>, ID, @isim, isim)
async function resolveRole(guild, input, replyMsg) {
    if (replyMsg && replyMsg.mentions && replyMsg.mentions.roles && replyMsg.mentions.roles.size > 0) {
        return replyMsg.mentions.roles.first();
    }
    if (!input) return null;
    const cleanId = input.replace(/[<@&>]/g, '').trim();
    const cleanName = input.replace(/^@/, '').trim().toLowerCase();

    const allRoles = await guild.roles.fetch().catch(() => guild.roles.cache);
    if (/^\d{17,20}$/.test(cleanId)) {
        const byId = allRoles.get(cleanId);
        if (byId) return byId;
    }

    const byName = allRoles.find(r => r && r.name && r.name.toLowerCase() === cleanName);
    return byName || null;
}

// Kategori bulma yardımcısı (ID, isim)
async function resolveCategory(guild, input) {
    if (!input) return null;
    const cleanId = input.replace(/[<#>]/g, '').trim();
    const cleanName = input.trim().toLowerCase();

    const allChannels = await guild.channels.fetch().catch(() => guild.channels.cache);
    if (/^\d{17,20}$/.test(cleanId)) {
        const byId = allChannels.get(cleanId);
        if (byId && byId.type === ChannelType.GuildCategory) return byId;
    }

    const byName = allChannels.find(c => c && c.type === ChannelType.GuildCategory && c.name && c.name.toLowerCase() === cleanName);
    return byName || null;
}

module.exports = {
    name: 'ticket',
    aliases: ['destek'],
    modOnly: true,
    async execute(message, client, args) {
        if (!message.guild) return;

        // Yetki kontrolü (Sunucu sahibi veya Yetkili)
        if (!client.isModerator(message.member)) {
            return message.reply("Bu komutu sadece sunucu yetkilileri kullanabilir.");
        }

        const channel = message.channel;
        const authorId = message.author.id;

        // Tüm ticket ayarlarını tutacak nesne
        const wizardData = {
            thumbnail: null,
            banner: null,
            title: 'Destek Talebi Sistemi',
            description: 'Yetkili ekibimizle iletişime geçmek ve destek almak için aşağıdaki butona tıklayarak talep oluşturabilirsiniz.\n\n• Gereksiz yere talep açmak yasaktır.\n• Destek ekibimiz en kısa sürede yanıt verecektir.',
            buttonText: 'Destek Talebi Aç',
            ticketTitle: 'Destek Talebi',
            ticketWelcome: 'Hoş geldiniz! Lütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın. Yetkili ekibimiz en kısa sürede sizinle ilgilenecektir.',
            categoryId: null,
            roleId: null,
            panelChannelId: null,
            logChannelId: null
        };

        // Mesaj bekleme yardımcısı
        const askQuestion = async (content, files = []) => {
            await channel.send({ content, files });
            const filter = m => m.author.id === authorId;
            try {
                const collected = await channel.awaitMessages({ filter, max: 1, time: 180000, errors: ['time'] });
                const replyMsg = collected.first();
                return { text: replyMsg.content ? replyMsg.content.trim() : '', replyMsg };
            } catch (e) {
                await channel.send("Süre dolduğu için ticket kurulum işlemi iptal edildi.");
                return null;
            }
        };

        // 1. ADIM: THUMBNAIL (Küçük Resim)
        const guidePath = path.join(__dirname, '..', 'assets', 'ticket_thumbnail_guide.png');
        const guideFiles = fs.existsSync(guidePath) ? [new AttachmentBuilder(guidePath, { name: 'ticket_thumbnail_guide.png' })] : [];

        const step1Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 1. Adım: Thumbnail (Küçük Resim)\n` +
            `Panelin sağ üst köşesinde yer alacak **Thumbnail** görselini belirleyin.\n` +
            `Aşağıdaki kılavuz görselinde pembe ok ile gösterilen alana gelecek resmin **doğrudan URL bağlantısını** atabilir veya sohbete bir görsel yükleyebilirsiniz.\n\n` +
            `• İstemiyorsanız **\`geç\`** veya **\`atla\`** yazın.\n` +
            `• Kurulumu iptal etmek için **\`iptal\`** yazabilirsiniz.`;

        const step1 = await askQuestion(step1Prompt, guideFiles);
        if (!step1) return;
        if (step1.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step1.text.toLowerCase() !== 'geç' && step1.text.toLowerCase() !== 'atla') {
            if (step1.replyMsg.attachments.size > 0) {
                wizardData.thumbnail = sanitizeUrl(step1.replyMsg.attachments.first().url);
            } else {
                wizardData.thumbnail = sanitizeUrl(step1.text);
            }
        }

        // 2. ADIM: BÜYÜK RESİM (Banner / Afiş)
        const step2Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 2. Adım: Büyük Resim (Banner / Afiş)\n` +
            `Panelin en alt kısmında boydan boya duracak **Büyük Resim (Banner)** görselini belirleyin.\n` +
            `Kılavuz görselinde mavi ok ile gösterilen geniş alana gelecek resmin **URL bağlantısını** atabilir veya doğrudan bir resim yükleyebilirsiniz.\n\n` +
            `• İstemiyorsanız **\`geç\`** veya **\`atla\`** yazın.\n` +
            `• Kurulumu iptal etmek için **\`iptal\`** yazabilirsiniz.`;

        const step2 = await askQuestion(step2Prompt);
        if (!step2) return;
        if (step2.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step2.text.toLowerCase() !== 'geç' && step2.text.toLowerCase() !== 'atla') {
            if (step2.replyMsg.attachments.size > 0) {
                wizardData.banner = sanitizeUrl(step2.replyMsg.attachments.first().url);
            } else {
                wizardData.banner = sanitizeUrl(step2.text);
            }
        }

        // 3. ADIM: PANEL BAŞLIĞI
        const step3Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 3. Adım: Panel Başlığı\n` +
            `Lütfen ticket panelinin ana başlığını yazın.\n` +
            `*(Varsayılan: \`Destek Talebi Sistemi\` kullanmak için **\`geç\`** yazın)*`;

        const step3 = await askQuestion(step3Prompt);
        if (!step3) return;
        if (step3.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step3.text.toLowerCase() !== 'geç' && step3.text.toLowerCase() !== 'atla') {
            wizardData.title = step3.text;
        }

        // 4. ADIM: PANEL AÇIKLAMASI
        const step4Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 4. Adım: Panel Açıklaması & Kuralları\n` +
            `Lütfen panelin içinde yer alacak açıklama metnini ve kuralları yazın.\n` +
            `*(Varsayılan açıklamayı kullanmak için **\`geç\`** yazın)*`;

        const step4 = await askQuestion(step4Prompt);
        if (!step4) return;
        if (step4.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step4.text.toLowerCase() !== 'geç' && step4.text.toLowerCase() !== 'atla') {
            wizardData.description = step4.text;
        }

        // 5. ADIM: PANEL BUTON YAZISI
        const step5Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 5. Adım: Panel Buton Yazısı\n` +
            `Kullanıcıların bilet açmak için tıklayacağı butonun üzerinde ne yazsın? (Örn: \`Destek Talebi Aç\`, \`Bilet Oluştur\`)\n` +
            `*(Varsayılan: \`Destek Talebi Aç\` kullanmak için **\`geç\`** yazın)*`;

        const step5 = await askQuestion(step5Prompt);
        if (!step5) return;
        if (step5.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step5.text.toLowerCase() !== 'geç' && step5.text.toLowerCase() !== 'atla') {
            wizardData.buttonText = step5.text;
        }

        // 6. ADIM: BİLET İÇİ KARŞILAMA BAŞLIĞI
        const step6Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 6. Adım: Bilet İçi Karşılama Başlığı\n` +
            `Kullanıcı butona bastığında açılan özel destek kanalının içindeki başlık ne olsun?\n` +
            `*(Varsayılan: \`Destek Talebi\` kullanmak için **\`geç\`** yazın)*`;

        const step6 = await askQuestion(step6Prompt);
        if (!step6) return;
        if (step6.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step6.text.toLowerCase() !== 'geç' && step6.text.toLowerCase() !== 'atla') {
            wizardData.ticketTitle = step6.text;
        }

        // 7. ADIM: BİLET İÇİ KARŞILAMA MESAJI
        const step7Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 7. Adım: Bilet İçi Karşılama Mesajı\n` +
            `Açılan destek kanalının içinde kullanıcıya gösterilecek karşılama ve yönlendirme metnini yazın.\n` +
            `*(Varsayılan metni kullanmak için **\`geç\`** yazın)*`;

        const step7 = await askQuestion(step7Prompt);
        if (!step7) return;
        if (step7.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step7.text.toLowerCase() !== 'geç' && step7.text.toLowerCase() !== 'atla') {
            wizardData.ticketWelcome = step7.text;
        }

        // 8. ADIM: DESTEK KATEGORİSİ
        const step8Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 8. Adım: Destek Kategorisi\n` +
            `Açılan ticket kanallarının hangi kategori altına açılmasını istiyorsunuz?\n` +
            `• Var olan bir kategori adını veya ID'sini yazabilirsiniz.\n` +
            `• Botun otomatik olarak **\`DESTEK TALEPLERİ\`** adında bir kategori açması için **\`oluştur\`** yazabilirsiniz.`;

        const step8 = await askQuestion(step8Prompt);
        if (!step8) return;
        if (step8.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step8.text.toLowerCase() === 'oluştur') {
            try {
                const newCategory = await message.guild.channels.create({
                    name: 'DESTEK TALEPLERİ',
                    type: ChannelType.GuildCategory
                });
                wizardData.categoryId = newCategory.id;
            } catch (err) {
                console.error("Kategori oluşturma hatası:", err);
                return channel.send("Kategori oluşturulurken bir yetki hatası meydana geldi. Lütfen botun yetkilerini kontrol edin.");
            }
        } else {
            const foundCategory = await resolveCategory(message.guild, step8.text);
            if (foundCategory) {
                wizardData.categoryId = foundCategory.id;
            } else {
                return channel.send(`\`${step8.text}\` kategorisi bulunamadı. Lütfen komutu baştan başlatın.`);
            }
        }

        // 9. ADIM: YETKİLİ / DESTEK EKİBİ ROLÜ
        const step9Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 9. Adım: Yetkili / Destek Ekibi Rolü\n` +
            `Açılan biletleri görebilecek ve yanıtlayabilecek yetkili rolünü etiketleyin (**@rol**), rol ID'sini veya adını yazın.`;

        const step9 = await askQuestion(step9Prompt);
        if (!step9) return;
        if (step9.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        const targetRole = await resolveRole(message.guild, step9.text, step9.replyMsg);
        if (!targetRole) {
            return channel.send("Belirtilen rol sunucuda bulunamadı. Lütfen komutu baştan başlatın.");
        }
        wizardData.roleId = targetRole.id;

        // 10. ADIM: PANELİN GÖNDERİLECEĞİ KANAL
        const step10Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 10. Adım: Panel Kanalı\n` +
            `Kullanıcıların destek talebi açacağı panelin gönderileceği kanalı etiketleyin (**#kanal**) veya adını/ID'sini yazın.`;

        const step10 = await askQuestion(step10Prompt);
        if (!step10) return;
        if (step10.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        const targetChannel = await resolveChannel(message.guild, step10.text, step10.replyMsg);
        if (!targetChannel) {
            return channel.send("Belirtilen panel kanalı bulunamadı. Lütfen komutu baştan başlatın.");
        }
        wizardData.panelChannelId = targetChannel.id;

        // 11. ADIM: LOG KANALI (İSTEĞE BAĞLI)
        const step11Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — Ek Adım: Log Kanalı\n` +
            `Kapatılan biletlerin transkript kayıtlarının gönderileceği kanalı etiketleyin (**#kanal**) veya adını/ID'sini yazın.\n` +
            `*(İstemiyorsanız **\`geç\`** veya **\`atla\`** yazabilirsiniz)*`;

        const step11 = await askQuestion(step11Prompt);
        if (!step11) return;
        if (step11.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step11.text.toLowerCase() !== 'geç' && step11.text.toLowerCase() !== 'atla') {
            const logChannel = await resolveChannel(message.guild, step11.text, step11.replyMsg);
            if (logChannel) {
                wizardData.logChannelId = logChannel.id;
            }
        }

        // --- KURULUMU SUNUCU BAZLI KAYDET VE PANELİ CONTAINER İLE GÖNDER ---
        try {
            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.ticket = wizardData;
            client.saveConfig();

            // Tamamen Modern Container Yapısı (Embed Kullanılmaz)
            const panelContainer = new ContainerBuilder();

            const section = new SectionBuilder();
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${wizardData.title}`),
                new TextDisplayBuilder().setContent(wizardData.description)
            );
            if (wizardData.thumbnail) {
                try {
                    section.setThumbnailAccessory(new ThumbnailBuilder().setURL(wizardData.thumbnail));
                } catch (e) {
                    console.error("ThumbnailBuilder accessory hatası:", e);
                }
            }
            panelContainer.addSectionComponents(section);

            if (wizardData.banner) {
                try {
                    panelContainer.addSeparatorComponents(new SeparatorBuilder());
                    const media = new MediaGalleryBuilder().addItems([{ media: { url: wizardData.banner } }]);
                    panelContainer.addMediaGalleryComponents(media);
                } catch (e) {
                    console.error("MediaGalleryBuilder hatası:", e);
                }
            }

            panelContainer.addSeparatorComponents(new SeparatorBuilder());

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create')
                    .setLabel(wizardData.buttonText || 'Destek Talebi Aç')
                    .setStyle(ButtonStyle.Primary)
            );
            panelContainer.addActionRowComponents(row);

            // Paneli gönder (Hata durumunda yedek sade Container ile dene)
            try {
                await targetChannel.send({
                    components: [panelContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            } catch (sendErr) {
                console.error("Components V2 gönderme hatası, sade fallback deneniyor:", sendErr);
                const fallbackContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`# ${wizardData.title}`),
                        new TextDisplayBuilder().setContent(wizardData.description)
                    )
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addActionRowComponents(row);

                await targetChannel.send({
                    components: [fallbackContainer],
                    flags: MessageFlags.IsComponentsV2
                });
            }

            const finishContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# ✅ Ticket Sistemi Başarıyla Kuruldu'),
                    new TextDisplayBuilder().setContent(
                        `Destek paneli başarıyla ${targetChannel} kanalına gönderildi.\n\n` +
                        `• **Destek Kategorisi:** <#${wizardData.categoryId}>\n` +
                        `• **Yetkili Rolü:** <@&${wizardData.roleId}>\n` +
                        `• **Panel Buton Yazısı:** \`${wizardData.buttonText}\`\n` +
                        `• **Bilet İçi Başlık:** \`${wizardData.ticketTitle}\`\n` +
                        `• **Log Kanalı:** ${wizardData.logChannelId ? `<#${wizardData.logChannelId}>` : 'Ayarlanmadı'}\n` +
                        `• **Thumbnail:** ${wizardData.thumbnail ? `[Görsel Bağlantısı](${wizardData.thumbnail})` : 'Kullanılmadı'}\n` +
                        `• **Büyük Resim:** ${wizardData.banner ? `[Görsel Bağlantısı](${wizardData.banner})` : 'Kullanılmadı'}`
                    )
                );

            await channel.send({
                components: [finishContainer],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Ticket paneli gönderme hatası:", error);
            channel.send(`Panel oluşturulurken bir hata oluştu: \`${error.message}\``);
        }
    }
};
