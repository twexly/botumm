const { ActionRowBuilder, ButtonBuilder, ButtonStyle, RoleSelectMenuBuilder } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'welcome',
    aliases: ['hosgeldin', 'hoşgeldin', 'karsilama', 'karşılama'],
    modOnly: true,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        try {
            const channel = message.mentions.channels.first() || 
                (args && args[0] ? message.guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) : null);

            if (!channel) {
                return message.reply({
                    content: `${emojis.cross} Lütfen geçerli bir karşılama kanalı etiketleyin!\n*Örnek:* \`.welcome #gelen-giden\` veya \`.welcome #gelen-giden @Üye\``
                });
            }

            const guildConfig = client.getGuildConfig(message.guild.id);
            guildConfig.welcomeChannel = channel.id;
            if (!guildConfig.welcomeTheme) {
                guildConfig.welcomeTheme = 1;
            }

            // 1. Rol doğrudan komutta belirtilmiş mi?
            let targetRole = message.mentions.roles.first();
            if (!targetRole && args && args[1]) {
                const cleanId = args[1].replace(/[<@&>]/g, '').trim();
                targetRole = message.guild.roles.cache.get(cleanId) || 
                    message.guild.roles.cache.find(r => r.name.toLowerCase() === args[1].toLowerCase());
            }

            if (targetRole) {
                // Rol doğrudan girildiyse kaydet ve tema seçimine geç
                guildConfig.welcomeRole = targetRole.id;
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
                    `• **Karşılama Kanalı:** ${channel}\n` +
                    `• **Otomatik Katılım Rolü:** ${targetRole}\n\n` +
                    `Aşağıdaki mavi numaralara tıklayarak temaların görsellerine bakabilir, beğendiğiniz temayı butonlardan seçebilirsiniz:\n\n` +
                    `• **[1](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_1.png)** — Gece Sakurası (Mor & Lila Teması)\n` +
                    `• **[2](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_2.png)** — Siber Gece Mavisi (Neon Mavi Teması)\n` +
                    `• **[3](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_3.png)** — Kızıl Akşam & Altın (Amber Teması)\n\n` +
                    `*Şu an seçili tema:* **Tema ${currentTheme}**`;

                return message.reply({ content, components: [row] });
            }

            // 2. Rol girilmediyse kullanıcıya sor:
            client.saveConfig();

            const askRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('welcome_ask_yes')
                    .setLabel('Evet, Rol Ekle')
                    .setEmoji('1545103227865927690')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('welcome_ask_no')
                    .setLabel('Hayır, Gerek Yok')
                    .setEmoji('1545103202616090724')
                    .setStyle(ButtonStyle.Secondary)
            );

            const askContent = `❓ **Rol eklentisi eklemediniz!**\n` +
                `Karşılama kanalı ${channel} olarak ayarlandı.\n` +
                `Sunucuya yeni katılan üyelere otomatik bir üye rolü verilmesini ister misiniz?`;

            return message.reply({
                content: askContent,
                components: [askRow]
            });

        } catch (error) {
            console.error('Welcome komutu hatası:', error);
            message.reply('Karşılama sistemi ayarlanırken bir hata oluştu.');
        }
    }
};
