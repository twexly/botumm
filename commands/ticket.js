const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    AttachmentBuilder, 
    EmbedBuilder 
} = require('discord.js');
const path = require('path');
const fs = require('fs');

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

        // Sihirbaz verilerini tutacak nesne
        const wizardData = {
            thumbnail: null,
            banner: null,
            title: 'Destek Talebi Sistemi',
            description: 'Yetkili ekibimizle iletişime geçmek ve destek almak için aşağıdaki butona tıklayarak talep oluşturabilirsiniz.\n\n• Gereksiz yere talep açmak yasaktır.\n• Destek ekibimiz en kısa sürede yanıt verecektir.',
            categoryId: null,
            roleId: null,
            panelChannelId: null,
            logChannelId: null
        };

        // Mesaj bekleme yardımcısı
        const askQuestion = async (content, files = []) => {
            const promptMsg = await channel.send({ content, files });
            const filter = m => m.author.id === authorId;
            try {
                const collected = await channel.awaitMessages({ filter, max: 1, time: 180000, errors: ['time'] });
                const replyMsg = collected.first();
                return { text: replyMsg.content.trim(), replyMsg };
            } catch (e) {
                await channel.send("Süre dolduğu için ticket kurulum işlemi iptal edildi.");
                return null;
            }
        };

        // 1. ADIM: THUMBNAIL BELİRLEME (Rehber görsel eşliğinde)
        const guidePath = path.join(__dirname, '..', 'assets', 'ticket_thumbnail_guide.png');
        const guideFiles = fs.existsSync(guidePath) ? [new AttachmentBuilder(guidePath, { name: 'ticket_thumbnail_guide.png' })] : [];

        const step1Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 1. Adım: Thumbnail (Küçük Resim)\n` +
            `Panelin sağ üst köşesinde yer alacak **Thumbnail** görselini belirleyin.\n` +
            `Aşağıdaki rehber görselinde pembe ok ile gösterilen alana gelecek resmin **doğrudan URL bağlantısını** atabilir veya sohbete bir resim yükleyebilirsiniz.\n\n` +
            `• İstemiyorsanız **\`geç\`** veya **\`atla\`** yazın.\n` +
            `• Kurulumu iptal etmek için **\`iptal\`** yazabilirsiniz.`;

        const step1 = await askQuestion(step1Prompt, guideFiles);
        if (!step1) return;
        if (step1.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step1.text.toLowerCase() !== 'geç' && step1.text.toLowerCase() !== 'atla') {
            if (step1.replyMsg.attachments.size > 0) {
                wizardData.thumbnail = step1.replyMsg.attachments.first().url;
            } else if (step1.text.startsWith('http://') || step1.text.startsWith('https://')) {
                wizardData.thumbnail = step1.text;
            }
        }

        // 2. ADIM: BÜYÜK RESİM (BANNER / AFİŞ)
        const step2Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 2. Adım: Büyük Resim (Banner / Afiş)\n` +
            `Panelin en alt kısmında boydan boya duracak **Büyük Resim (Banner)** görselini belirleyin.\n` +
            `Rehber görselinde mavi ok ile gösterilen geniş alana gelecek resmin **URL bağlantısını** atabilir veya doğrudan bir resim yükleyebilirsiniz.\n\n` +
            `• İstemiyorsanız **\`geç\`** veya **\`atla\`** yazın.\n` +
            `• Kurulumu iptal etmek için **\`iptal\`** yazabilirsiniz.`;

        const step2 = await askQuestion(step2Prompt);
        if (!step2) return;
        if (step2.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step2.text.toLowerCase() !== 'geç' && step2.text.toLowerCase() !== 'atla') {
            if (step2.replyMsg.attachments.size > 0) {
                wizardData.banner = step2.replyMsg.attachments.first().url;
            } else if (step2.text.startsWith('http://') || step2.text.startsWith('https://')) {
                wizardData.banner = step2.text;
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
        const step4Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 4. Adım: Panel Açıklaması\n` +
            `Lütfen panelin içinde yer alacak açıklama metnini ve kuralları yazın.\n` +
            `*(Varsayılan metni kullanmak için **\`geç\`** yazın)*`;

        const step4 = await askQuestion(step4Prompt);
        if (!step4) return;
        if (step4.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step4.text.toLowerCase() !== 'geç' && step4.text.toLowerCase() !== 'atla') {
            wizardData.description = step4.text;
        }

        // 5. ADIM: DESTEK KATEGORİSİ
        const step5Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 5. Adım: Destek Kategorisi\n` +
            `Açılan ticket kanallarının hangi kategori altına açılmasını istiyorsunuz?\n` +
            `• Var olan bir kategori adını veya ID'sini yazabilirsiniz.\n` +
            `• Botun otomatik olarak **\`DESTEK TALEPLERİ\`** adında bir kategori açması için **\`oluştur\`** yazabilirsiniz.`;

        const step5 = await askQuestion(step5Prompt);
        if (!step5) return;
        if (step5.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step5.text.toLowerCase() === 'oluştur') {
            try {
                const newCategory = await message.guild.channels.create({
                    name: 'DESTEK TALEPLERİ',
                    type: ChannelType.GuildCategory
                });
                wizardData.categoryId = newCategory.id;
            } catch (err) {
                console.error("Kategori oluşturma hatası:", err);
                return channel.send("Kategori oluşturulurken bir yetki hatası meydana geldi.");
            }
        } else {
            const foundCategory = message.guild.channels.cache.find(c => 
                c.type === ChannelType.GuildCategory && 
                (c.id === step5.text || c.name.toLowerCase() === step5.text.toLowerCase())
            );
            if (foundCategory) {
                wizardData.categoryId = foundCategory.id;
            } else {
                return channel.send(`\`${step5.text}\` adında bir kategori bulunamadı. Lütfen komutu baştan başlatın.`);
            }
        }

        // 6. ADIM: YETKİLİ / DESTEK EKİBİ ROLÜ
        const step6Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 6. Adım: Yetkili / Destek Ekibi Rolü\n` +
            `Açılan biletleri görebilecek ve yanıtlayabilecek yetkili rolünü etiketleyin (**@rol**) veya rol ID'sini yazın.`;

        const step6 = await askQuestion(step6Prompt);
        if (!step6) return;
        if (step6.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        let targetRole = step6.replyMsg.mentions.roles.first() || 
            message.guild.roles.cache.get(step6.text) || 
            message.guild.roles.cache.find(r => r.name.toLowerCase() === step6.text.toLowerCase());

        if (!targetRole) {
            return channel.send("Belirtilen rol sunucuda bulunamadı. Lütfen komutu baştan başlatın.");
        }
        wizardData.roleId = targetRole.id;

        // 7. ADIM: PANELİN GÖNDERİLECEĞİ KANAL
        const step7Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — 7. Adım: Panel Kanalı\n` +
            `Kullanıcıların destek talebi açacağı panelin gönderileceği kanalı etiketleyin. (Örnek: \`#destek\`)`;

        const step7 = await askQuestion(step7Prompt);
        if (!step7) return;
        if (step7.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        let targetChannel = step7.replyMsg.mentions.channels.first() || 
            message.guild.channels.cache.get(step7.text);

        if (!targetChannel) {
            return channel.send("Belirtilen kanal bulunamadı. Lütfen komutu baştan başlatın.");
        }
        wizardData.panelChannelId = targetChannel.id;

        // 8. ADIM: LOG KANALI (İSTEĞE BAĞLI)
        const step8Prompt = `## 🎟️ Ticket Kurulum Sihirbazı — Ek Adım: Log Kanalı\n` +
            `Kapatılan biletlerin transkript kayıtlarının gönderileceği kanalı etiketleyin. (Örnek: \`#ticket-log\`)\n` +
            `*(İstemiyorsanız **\`geç\`** yazabilirsiniz)*`;

        const step8 = await askQuestion(step8Prompt);
        if (!step8) return;
        if (step8.text.toLowerCase() === 'iptal') return channel.send("Ticket kurulumu iptal edildi.");

        if (step8.text.toLowerCase() !== 'geç' && step8.text.toLowerCase() !== 'atla') {
            const logChannel = step8.replyMsg.mentions.channels.first() || message.guild.channels.cache.get(step8.text);
            if (logChannel) {
                wizardData.logChannelId = logChannel.id;
            }
        }

        // --- KURULUMU SUNUCU BAZLI KAYDET VE PANELİ GÖNDER ---
        try {
            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.ticket = wizardData;
            client.saveConfig();

            // Paneli Hedef Kanala Gönder
            const panelEmbed = new EmbedBuilder()
                .setTitle(wizardData.title)
                .setDescription(wizardData.description)
                .setColor(0x5865f2)
                .setFooter({ text: `${message.guild.name} • Destek Talebi Sistemi` });

            if (wizardData.thumbnail) {
                panelEmbed.setThumbnail(wizardData.thumbnail);
            }
            if (wizardData.banner) {
                panelEmbed.setImage(wizardData.banner);
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create')
                    .setLabel('Destek Talebi Aç')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary)
            );

            await targetChannel.send({
                embeds: [panelEmbed],
                components: [row]
            });

            await channel.send(
                `## ✅ Ticket Sistemi Başarıyla Kuruldu!\n` +
                `Panel başarıyla ${targetChannel} kanalına gönderildi.\n\n` +
                `• **Destek Kategorisi:** <#${wizardData.categoryId}>\n` +
                `• **Yetkili Rolü:** <@&${wizardData.roleId}>\n` +
                `• **Log Kanalı:** ${wizardData.logChannelId ? `<#${wizardData.logChannelId}>` : 'Ayarlanmadı'}\n` +
                `• **Thumbnail (Küçük Resim):** ${wizardData.thumbnail ? `[Görsel Bağlantısı](${wizardData.thumbnail})` : 'Kullanılmadı'}\n` +
                `• **Büyük Resim (Afiş / Banner):** ${wizardData.banner ? `[Görsel Bağlantısı](${wizardData.banner})` : 'Kullanılmadı'}`
            );

        } catch (error) {
            console.error("Ticket paneli gönderme hatası:", error);
            channel.send("Panel oluşturulurken veya kaydedilirken bir hata oluştu.");
        }
    }
};
