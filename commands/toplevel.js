const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'toplevel',
    async execute(message, client) {
        try {
            const allUsers = [...(client.userStats?.entries() || [])].map(([id, stats]) => {
                let currentVoiceTime = stats.voiceTime || 0;
                const activeJoin = client.voiceSessions?.get(id);
                if (activeJoin) {
                    currentVoiceTime += (Date.now() - activeJoin);
                }
                return {
                    id,
                    level: stats.level || 1,
                    messages: stats.messages || 0,
                    voiceTime: currentVoiceTime
                };
            });

            if (allUsers.length === 0) {
                return message.reply("Sunucuda henüz hiç veri yok.");
            }

            const topLevel = [...allUsers].sort((a, b) => b.level - a.level).slice(0, 5);
            const topMessages = [...allUsers].sort((a, b) => b.messages - a.messages).slice(0, 5);
            const topVoice = [...allUsers].sort((a, b) => b.voiceTime - a.voiceTime).slice(0, 5);

            const formatTop = (arr, type) => {
                if (arr.length === 0) return "Veri yok";
                return arr.map((u, i) => {
                    let val = u[type];
                    if (type === 'voiceTime') val = (val / (1000 * 60 * 60)).toFixed(1) + ' Saat';
                    else if (type === 'level') val = val + ' Lvl';
                    else val = val + ' Msj';
                    return `**${i + 1}.** <@${u.id}> - \`${val}\``;
                }).join('\n');
            };

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# Sunucu Liderlik Tablosu'),
                    new TextDisplayBuilder().setContent('*Sohbet ettikçe ve seste durdukça sıralamada yükselirsiniz.*')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('### En Yüksek Seviyeler\n' + (formatTop(topLevel, 'level') || 'Yok')),
                    new TextDisplayBuilder().setContent('### En Çok Mesaj Gönderenler\n' + (formatTop(topMessages, 'messages') || 'Yok')),
                    new TextDisplayBuilder().setContent('### Seste En Çok Kalanlar\n' + (formatTop(topVoice, 'voiceTime') || 'Yok'))
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
