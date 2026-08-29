const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'welcome',
    modOnly: true,
    async execute(message, client) {
        try {
            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply("Lütfen bir kanal etiketleyin. (Örnek: .welcome #gelen-giden)");
            }

            client.welcomeChannelId = channel.id;
            client.saveConfig();
            
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Karşılama Sistemi Aktif'),
                    new TextDisplayBuilder().setContent(`Karşılama kanalı başarıyla ${channel} olarak ayarlandı. Artık yeni gelenlere resimli karşılama mesajı gönderilecek.`)
                );

            message.reply({ 
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (error) {
            console.error("Welcome komutu hatası:", error);
            message.reply("Bir hata oluştu.");
        }
    }
};
