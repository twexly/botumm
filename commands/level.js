const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'level',
    async execute(message, client) {
        const channel = message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { 
                SendMessages: false 
            });

            client.levelChannelId = channel.id;
            client.saveConfig();

            const container = new ContainerBuilder()
                .setAccentColor(0x3498db)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## ✅ Seviye Sistemi Aktif!'),
                    new TextDisplayBuilder().setContent('Bu kanal başarıyla kilitlendi. Artık seviye atlama görselleri sadece buraya gönderilecek.')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**🔒 Kanal:** ${channel}`)
                );
            
            await message.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Kanal kilitlenirken hata:", error);
            message.reply("❌ Kanal yetkileri düzenlenemedi. Botun yönetici yetkisi olduğundan emin ol.");
        }
    }
};