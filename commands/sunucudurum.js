const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');

async function getStatsCounts(guild) {
    await guild.members.fetch().catch(() => {});
    const allMembers = guild.members.cache;
    const totalMembers = guild.memberCount || allMembers.size;

    // Aktif sayımı (Online, Idle, DND)
    const onlineCount = allMembers.filter(m => m.presence && m.presence.status !== 'offline').size;
    const activeCount = onlineCount > 0 
        ? onlineCount 
        : (allMembers.filter(m => !m.user.bot && m.voice?.channelId).size || 1);

    const offlineCount = Math.max(0, totalMembers - activeCount);
    const voiceCount = allMembers.filter(m => m.voice?.channelId).size;

    return {
        total: totalMembers,
        active: activeCount,
        offline: offlineCount,
        voice: voiceCount
    };
}

async function updateServerStats(guild, client) {
    if (!guild) return;
    const guildConfig = client.getGuildConfig(guild.id);
    if (!guildConfig.serverStats) return;

    const statsConfig = guildConfig.serverStats;
    const counts = await getStatsCounts(guild);

    const names = {
        total: `👥 Toplam Üye: ${counts.total}`,
        active: `🟢 Aktif: ${counts.active}`,
        offline: `⚫ Çevrimdışı: ${counts.offline}`,
        voice: `🔊 Seste: ${counts.voice}`
    };

    if (statsConfig.totalId) {
        const ch = guild.channels.cache.get(statsConfig.totalId);
        if (ch && ch.name !== names.total) await ch.setName(names.total).catch(() => {});
    }
    if (statsConfig.activeId) {
        const ch = guild.channels.cache.get(statsConfig.activeId);
        if (ch && ch.name !== names.active) await ch.setName(names.active).catch(() => {});
    }
    if (statsConfig.offlineId) {
        const ch = guild.channels.cache.get(statsConfig.offlineId);
        if (ch && ch.name !== names.offline) await ch.setName(names.offline).catch(() => {});
    }
    if (statsConfig.voiceId) {
        const ch = guild.channels.cache.get(statsConfig.voiceId);
        if (ch && ch.name !== names.voice) await ch.setName(names.voice).catch(() => {});
    }
}

module.exports = {
    name: 'sunucudurum',
    aliases: ['sunucu-durum', 'durumkanallari', 'durum-kanallari', 'serverstats'],
    modOnly: true,
    description: 'Aktif, çevrimdışı ve sesteki üye sayılarını kilitli ses kanalları olarak sunucunun en üstünde gösterir.',
    updateServerStats,
    async execute(message, client, args) {
        if (!message.guild) return;

        // Bot yetki kontrolü
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply(`${emojis.cross} Botun kanal oluşturması ve düzenlemesi için **Kanalları Yönet (Manage Channels)** yetkisi gereklidir.`);
        }

        const guildConfig = client.getGuildConfig(message.guild.id);

        // Kaldırma seçeneği (.sunucudurum sil / kaldır)
        if (args && args.length > 0 && ['sil', 'kaldır', 'kaldir', 'delete', 'reset'].includes(args[0].toLowerCase())) {
            if (!guildConfig.serverStats) {
                return message.reply('⚠️ Bu sunucuda ayarlanmış bir sunucu durum kanalı bulunmuyor.');
            }

            const { categoryId, totalId, activeId, offlineId, voiceId } = guildConfig.serverStats;
            const idsToDelete = [totalId, activeId, offlineId, voiceId, categoryId];

            for (const id of idsToDelete) {
                if (id) {
                    const ch = message.guild.channels.cache.get(id);
                    if (ch) await ch.delete('Sunucu durum kanalları kaldırıldı').catch(() => {});
                }
            }

            delete guildConfig.serverStats;
            client.saveConfig();

            return message.reply(`${emojis.tick} Sunucu durum kanalları başarıyla silindi ve sistem devre dışı bırakıldı.`);
        }

        const replyMsg = await message.reply('⏳ Sunucu durum kanalları hazırlanıyor, lütfen bekleyin...');

        try {
            const counts = await getStatsCounts(message.guild);

            const names = {
                total: `👥 Toplam Üye: ${counts.total}`,
                active: `🟢 Aktif: ${counts.active}`,
                offline: `⚫ Çevrimdışı: ${counts.offline}`,
                voice: `🔊 Seste: ${counts.voice}`
            };

            const permissionOverwrites = [
                {
                    id: message.guild.roles.everyone.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.Connect] // Kimse giremesin sese ama herkes görsün!
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.ManageChannels,
                        PermissionFlagsBits.Connect
                    ]
                }
            ];

            // Halihazırda kanallar varsa güncelle
            let category = null;
            let totalChan = null;
            let activeChan = null;
            let offlineChan = null;
            let voiceChan = null;

            if (guildConfig.serverStats) {
                category = message.guild.channels.cache.get(guildConfig.serverStats.categoryId);
                totalChan = message.guild.channels.cache.get(guildConfig.serverStats.totalId);
                activeChan = message.guild.channels.cache.get(guildConfig.serverStats.activeId);
                offlineChan = message.guild.channels.cache.get(guildConfig.serverStats.offlineId);
                voiceChan = message.guild.channels.cache.get(guildConfig.serverStats.voiceId);
            }

            // Kategori yoksa oluştur
            if (!category) {
                category = await message.guild.channels.create({
                    name: '📊 SUNUCU İSTATİSTİKLERİ',
                    type: ChannelType.GuildCategory,
                    position: 0,
                    permissionOverwrites
                });
            } else {
                await category.setPosition(0).catch(() => {});
            }

            // Kanalları kontrol et ve oluştur
            if (!totalChan) {
                totalChan = await message.guild.channels.create({
                    name: names.total,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites
                });
            } else {
                await totalChan.setName(names.total).catch(() => {});
            }

            if (!activeChan) {
                activeChan = await message.guild.channels.create({
                    name: names.active,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites
                });
            } else {
                await activeChan.setName(names.active).catch(() => {});
            }

            if (!offlineChan) {
                offlineChan = await message.guild.channels.create({
                    name: names.offline,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites
                });
            } else {
                await offlineChan.setName(names.offline).catch(() => {});
            }

            if (!voiceChan) {
                voiceChan = await message.guild.channels.create({
                    name: names.voice,
                    type: ChannelType.GuildVoice,
                    parent: category.id,
                    permissionOverwrites
                });
            } else {
                await voiceChan.setName(names.voice).catch(() => {});
            }

            // Config'e kaydet
            guildConfig.serverStats = {
                categoryId: category.id,
                totalId: totalChan.id,
                activeId: activeChan.id,
                offlineId: offlineChan.id,
                voiceId: voiceChan.id,
                lastUpdated: Date.now()
            };
            client.saveConfig();

            const embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('📊 Sunucu Durum Kanalları Hazırlandı!')
                .setDescription(
                    `Sunucunun en üstünde ses kanalları oluşturuldu.\n` +
                    `🔒 **Özellik:** Kanallara giriş yetkisi kapalıdır (**kimse bağlanamaz**), fakat isimleri ve sayıları **herkes görebilir**.\n\n` +
                    `• **Toplam Üye:** \`${counts.total}\`\n` +
                    `• **Aktif Üye:** \`${counts.active}\` *(Çevrimiçi, Boşta, Rahatsız Etmeyin)*\n` +
                    `• **Çevrimdışı:** \`${counts.offline}\`\n` +
                    `• **Sesteki Üyeler:** \`${counts.voice}\`\n\n` +
                    `> *Kanallar 10 dakikada bir otomatik olarak üye ve ses durumuna göre güncellenir.*`
                )
                .setFooter({ text: 'Kaldırmak için: .sunucudurum sil' })
                .setTimestamp();

            return replyMsg.edit({ content: null, embeds: [embed] });

        } catch (err) {
            console.error('Sunucu durum oluşturma hatası:', err);
            return replyMsg.edit({ content: `${emojis.cross} Sunucu durum kanalları oluşturulurken bir hata meydana geldi: ${err.message}` });
        }
    }
};
