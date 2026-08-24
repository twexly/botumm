const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'rank',
    async execute(message, client) {
        try {
            const userId = message.author.id;
            const stats = client.userStats?.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };
            
            // Eğer hala seste ise aktif süreyi de ekleyelim
            const activeJoin = client.voiceSessions?.get(userId);
            let totalVoiceTime = stats.voiceTime || 0;
            if (activeJoin) {
                totalVoiceTime += (Date.now() - activeJoin);
            }

            const voiceHours = (totalVoiceTime / (1000 * 60 * 60)).toFixed(1);

            const container = new ContainerBuilder()
                .setAccentColor(0xf1c40f)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🏆 ${message.author.username} - İstatistikleri`),
                    new TextDisplayBuilder().setContent('Seviye atlamak ve sıralamada yükselmek için sohbete katıl!')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**⭐ Seviye:** \`${stats.level}\``),
                    new TextDisplayBuilder().setContent(`**✨ XP:** \`${stats.xp}\``),
                    new TextDisplayBuilder().setContent(`**💬 Toplam Mesaj:** \`${stats.messages}\``),
                    new TextDisplayBuilder().setContent(`**🎤 Ses Süresi:** \`${voiceHours} Saat\``)
                );
            
            await message.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error("Rank komutu hatası:", error);
            message.reply("❌ Bir hata oluştu!");
        }
    }
};