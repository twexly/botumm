const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'log',
    modOnly: true,
    async execute(message, client) {
        if (!message.guild) return;
        try {
            // Sunucuda kategori oluştur
            const category = await message.guild.channels.create({
                name: 'SUNUCU LOGLARI',
                type: 4 // Category
            });

            // Mod Log ve Genel Log kanallarını oluştur
            const modLogChannel = await message.guild.channels.create({
                name: 'moderasyon-log',
                type: 0, // Text
                parent: category.id
            });

            const serverLogChannel = await message.guild.channels.create({
                name: 'genel-log',
                type: 0, // Text
                parent: category.id
            });

            // Sunucu bazlı kaydet
            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.modLog = modLogChannel.id;
            guildConfig.serverLog = serverLogChannel.id;
            client.saveConfig();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Log Sistemi Kuruldu'),
                    new TextDisplayBuilder().setContent(`Kategori ve kanallar bu sunucu için başarıyla oluşturuldu.\n\n**Moderatör Log:** ${modLogChannel}\n**Genel Log:** ${serverLogChannel}`)
                );

            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

        } catch (error) {
            console.error("Log kurulum hatası:", error);
            message.reply("Log kanalları oluşturulurken hata meydana geldi. Botun yetkilerini kontrol edin.");
        }
    }
};
