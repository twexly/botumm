const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'offadd',
    modOnly: true,
    async execute(message, client) {
        try {
            client.serverConfig.antiLink = !client.serverConfig.antiLink;
            client.saveConfig();

            const status = client.serverConfig.antiLink ? 'AKTİF' : 'DEVRE DIŞI';
            const desc = client.serverConfig.antiLink 
                ? 'Artık yetkili dışındaki kimse link atamayacak. Link atanlar 1 dakika susturulacak.' 
                : 'Artık herkes serbestçe link paylaşabilir.';

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Anti-Link (Reklam) Koruması`),
                    new TextDisplayBuilder().setContent(`Sistem şu anda: **${status}**\n\n${desc}`)
                );
            
            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            console.error("Offadd komutu hatası:", error);
            message.reply("Sistem durumu değiştirilirken hata oluştu.");
        }
    }
};
