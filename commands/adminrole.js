const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'adminrole',
    aliases: ['adminrol', 'yetkilirol', 'modrole'],
    modOnly: true,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply(`${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`);
        }

        const guildConfig = client.getGuildConfig(message.guild.id);

        // Rolü Bul (Etiket, ID veya İsim ile)
        let targetRole = message.mentions.roles.first();
        if (!targetRole && args[0]) {
            const cleanId = args[0].replace(/[<@&>]/g, '').trim();
            targetRole = message.guild.roles.cache.get(cleanId) || 
                message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
        }

        if (!targetRole) {
            const currentModRole = guildConfig?.modRole;
            const currentText = currentModRole 
                ? `${emojis.tick} Mevcut yetkili rolü: <@&${currentModRole}> (\`${currentModRole}\`)` 
                : `${emojis.cross} Bu sunucuda henüz bir yetkili rolü ayarlanmamış.`;
            return message.reply(`${currentText}\n\n${emojis.settings} Yeni bir rol ayarlamak için: \`.adminrole @rol\` veya \`.adminrole <rol_id>\``);
        }

        try {
            // Sunucu bazlı kaydet
            guildConfig.modRole = targetRole.id;
            client.saveConfig();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${emojis.settings} Yetkili Rolü Güncellendi`),
                    new TextDisplayBuilder().setContent(
                        `${emojis.tick} Bu sunucu için yetkili/moderatör rolü başarıyla **${targetRole.name}** (${targetRole}) olarak ayarlandı.\n\n` +
                        `${emojis.matter} **Rol ID:** \`${targetRole.id}\`\n` +
                        `${emojis.matter} **Ayarlayan:** ${message.author} (\`${message.author.tag}\`)\n` +
                        `${emojis.matter} **Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

        } catch (error) {
            console.error("Adminrole komutu hatası:", error);
            message.reply(`${emojis.cross} Yetkili rolü kaydedilirken bir hata oluştu.`);
        }
    }
};
