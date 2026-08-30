const { ContainerBuilder, TextDisplayBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'adminrole',
    async execute(message, client, args) {
        if (!message.guild) return;

        // Sadece Sunucu Sahibi veya Yönetici (Administrator) yetkisine sahip kişiler kullanabilir
        const isOwner = message.guild.ownerId === message.author.id;
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !isAdmin) {
            return message.reply("Bu komutu sadece sunucu sahibi veya Yönetici yetkisine sahip kullanıcılar kullanabilir.");
        }

        const guildConfig = client.getGuildConfig(message.guild.id);

        // Rolü Bul (Etiket, ID veya İsim ile)
        let targetRole = message.mentions.roles.first();
        if (!targetRole && args[0]) {
            targetRole = message.guild.roles.cache.get(args[0]) || 
                message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase());
        }

        if (!targetRole) {
            const currentModRole = guildConfig?.modRole;
            const currentText = currentModRole 
                ? `Mevcut yetkili rolü: <@&${currentModRole}> (\`${currentModRole}\`)` 
                : 'Bu sunucuda henüz bir yetkili rolü ayarlanmamış.';
            return message.reply(`${currentText}\n\nYeni bir rol ayarlamak için: \`.adminrole @rol\` veya \`.adminrole <rol_id>\``);
        }

        try {
            // Sunucu bazlı kaydet
            guildConfig.modRole = targetRole.id;
            client.saveConfig();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Yetkili Rolü Güncellendi'),
                    new TextDisplayBuilder().setContent(
                        `Bu sunucu için yetkili/moderatör rolü başarıyla **${targetRole.name}** (${targetRole}) olarak ayarlandı.\n\n` +
                        `**Rol ID:** \`${targetRole.id}\`\n` +
                        `**Ayarlayan:** ${message.author} (\`${message.author.tag}\`)\n` +
                        `**Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });

        } catch (error) {
            console.error("Adminrole komutu hatası:", error);
            message.reply("Yetkili rolü kaydedilirken bir hata oluştu.");
        }
    }
};
