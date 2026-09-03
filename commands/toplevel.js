const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

function formatVoiceDuration(ms) {
    if (!ms || ms < 1000) return '0 saniye';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours} sa ${minutes} dk`;
    }
    if (minutes > 0) {
        return `${minutes} dk ${seconds} sn`;
    }
    return `${seconds} sn`;
}

module.exports = {
    name: 'toplevel',
    aliases: ['top', 'liderler', 'leaderboard'],
    async execute(message, client) {
        if (!message.guild) return;

        try {
            // Sadece bu sunucuda bulunan üyeleri filtrele
            await message.guild.members.fetch().catch(() => {});
            const guildMemberIds = new Set(message.guild.members.cache.keys());

            const userMap = new Map();

            // 1. Veritabanındaki kullanıcılar (sadece bu sunucuda bulunanlar)
            for (const [id, stats] of (client.userStats?.entries() || [])) {
                if (!guildMemberIds.has(id)) continue;
                let voiceTime = stats.voiceTime || 0;
                const activeJoin = client.voiceSessions?.get(id);
                if (activeJoin) {
                    voiceTime += (Date.now() - activeJoin);
                }
                userMap.set(id, {
                    id,
                    level: stats.level || 1,
                    xp: stats.xp || 0,
                    messages: stats.messages || 0,
                    voiceTime
                });
            }

            // 2. Şu an seste olan ama henüz veritabanında kaydı bulunmayan sunucu üyeleri
            for (const [id, activeJoin] of (client.voiceSessions?.entries() || [])) {
                if (guildMemberIds.has(id) && !userMap.has(id)) {
                    userMap.set(id, {
                        id,
                        level: 1,
                        xp: 0,
                        messages: 0,
                        voiceTime: Date.now() - activeJoin
                    });
                }
            }

            const allUsers = Array.from(userMap.values());

            if (allUsers.length === 0) {
                return message.reply("Bu sunucuda henüz kaydedilmiş aktiflik verisi bulunmuyor.");
            }

            // En Yüksek Seviyeler (Level ve XP bazlı sıralama, aktifliği olanlar)
            const topLevel = allUsers
                .filter(u => u.level > 1 || u.xp > 0 || u.messages > 0 || u.voiceTime > 0)
                .sort((a, b) => {
                    const scoreA = (a.level || 1) * 100000 + (a.xp || 0);
                    const scoreB = (b.level || 1) * 100000 + (b.xp || 0);
                    return scoreB - scoreA;
                })
                .slice(0, 5);

            // En Çok Mesaj Gönderenler (messages > 0 olanlar)
            const topMessages = allUsers
                .filter(u => (u.messages || 0) > 0)
                .sort((a, b) => b.messages - a.messages)
                .slice(0, 5);

            // Seste En Çok Kalanlar (voiceTime > 0 olanlar)
            const topVoice = allUsers
                .filter(u => (u.voiceTime || 0) > 0)
                .sort((a, b) => b.voiceTime - a.voiceTime)
                .slice(0, 5);

            const formatList = (arr, type) => {
                if (!arr || arr.length === 0) return "*Bu kategoride henüz veri yok.*";
                return arr.map((u, i) => {
                    let val = '';
                    if (type === 'level') {
                        val = `Seviye ${u.level} (${(u.xp || 0).toLocaleString('tr-TR')} XP)`;
                    } else if (type === 'messages') {
                        val = `${u.messages.toLocaleString('tr-TR')} Mesaj`;
                    } else if (type === 'voice') {
                        val = formatVoiceDuration(u.voiceTime);
                    }
                    return `**${i + 1}.** <@${u.id}> — \`${val}\``;
                }).join('\n');
            };

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# Sunucu Liderlik Tablosu'),
                    new TextDisplayBuilder().setContent('*Sohbet ettikçe ve ses kanallarında vakit geçirdikçe sıralamanız yükselir.*')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### En Yüksek Seviyeler\n' + formatList(topLevel, 'level')),
                    new TextDisplayBuilder().setContent('### En Çok Mesaj Gönderenler\n' + formatList(topMessages, 'messages')),
                    new TextDisplayBuilder().setContent('### Seste En Çok Kalanlar\n' + formatList(topVoice, 'voice'))
                );

            await message.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error("TopLevel komutu hatası:", error);
            message.reply("Liderlik tablosu oluşturulamadı.");
        }
    }
};
