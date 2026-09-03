const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'welcome',
    modOnly: true,
    async execute(message, client) {
        if (!message.guild) return;
        try {
            const channel = message.mentions.channels.first();
            if (!channel) {
                return message.reply("Lütfen bir kanal etiketleyin. (Örnek: `.welcome #gelen-giden`)");
            }

            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.welcomeChannel = channel.id;
            if (!guildConfig.welcomeTheme) {
                guildConfig.welcomeTheme = 1;
            }
            client.saveConfig();

            const currentTheme = guildConfig.welcomeTheme || 1;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_theme_1')
                    .setLabel('Tema 1')
                    .setStyle(currentTheme === 1 ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_theme_2')
                    .setLabel('Tema 2')
                    .setStyle(currentTheme === 2 ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('welcome_theme_3')
                    .setLabel('Tema 3')
                    .setStyle(currentTheme === 3 ? ButtonStyle.Success : ButtonStyle.Secondary)
            );

            const content = `## Karşılama Sistemi Aktif Edildi\n` +
                `Karşılama kanalı başarıyla ${channel} olarak ayarlandı.\n\n` +
                `Aşağıdaki mavi numaralara tıklayarak temaların görsellerine bakabilir, beğendiğiniz temayı butonlardan seçebilirsiniz:\n\n` +
                `• **[1](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_1.png)** — Gece Sakurası (Mor & Lila Teması)\n` +
                `• **[2](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_2.png)** — Siber Gece Mavisi (Neon Mavi Teması)\n` +
                `• **[3](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_3.png)** — Kızıl Akşam & Altın (Amber Teması)\n\n` +
                `*Şu an seçili tema:* **Tema ${currentTheme}**`;

            await message.reply({ 
                content,
                components: [row]
            });
        } catch (error) {
            console.error("Welcome komutu hatası:", error);
            message.reply("Karşılama sistemi ayarlanırken bir hata oluştu.");
        }
    }
};
