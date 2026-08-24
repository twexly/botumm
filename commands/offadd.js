const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'offadd',
    modOnly: true, // Sadece modlar açıp kapatabilir
    async execute(message, client) {
        try {
            // Durumu tersine çevir
            client.serverConfig.antiLink = !client.serverConfig.antiLink;
            client.saveConfig();

            const status = client.serverConfig.antiLink ? '✅ AKTİF' : '❌ DEVRE DIŞI';
            const color = client.serverConfig.antiLink ? 0x2ecc71 : 0xe74c3c;
            const desc = client.serverConfig.antiLink 
                ? 'Artık moderatör dışındaki kimse link atamayacak. Link atanlar 1 dakika timeout yiyecek.' 
                : 'Artık herkes serbestçe link paylaşabilir.';

            const container = new ContainerBuilder()
                .setAccentColor(color)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🛡️ Anti-Link (Reklam) Koruması`),
                    new TextDisplayBuilder().setContent(`Sistem şu anda: **${status}**\n\n${desc}`)
                );
            
            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (error) {
            console.error("Offadd komutu hatası:", error);
            message.reply("❌ Sistem durumu değiştirilirken hata oluştu.");
        }
    }
};
