const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'slowmode',
    modOnly: true,
    async execute(message, client, args) {
        const time = parseInt(args[0]);
        if (isNaN(time)) return message.reply("💡 Lütfen bir saniye değeri girin! (Örn: !slowmode 5)");
        
        try {
            await message.channel.setRateLimitPerUser(time);
            const container = new ContainerBuilder()
                .setAccentColor(0x3498db)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ⏱️ Yavaş Mod Ayarlandı`),
                    new TextDisplayBuilder().setContent(`Kanal yavaş modu **${time} saniye** olarak ayarlandı.`)
                );
            const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(()=> {}), 10000);
        } catch (err) {
            message.reply("❌ Yavaş mod ayarlanırken hata oluştu!");
        }
    }
};
