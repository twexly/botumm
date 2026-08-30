const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'level',
    modOnly: true,
    async execute(message, client) {
        if (!message.guild) return;
        const channel = message.channel;

        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, { 
                SendMessages: false 
            });

            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.levelChannel = channel.id;
            client.saveConfig();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Seviye Sistemi Aktif'),
                    new TextDisplayBuilder().setContent('Bu kanal kilitlendi. Artık seviye atlama görselleri sadece buraya gönderilecek.')
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`**Kanal:** ${channel}`)
                );
            
            await message.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("Kanal kilitlenirken hata:", error);
            message.reply("Kanal yetkileri düzenlenemedi. Botun yetkilerini kontrol edin.");
        }
    }
};