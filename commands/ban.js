const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'ban',
    modOnly: true,
    async execute(message, client, args) {
        const target = message.mentions.members.first() || 
            (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

        if (!target) return message.reply(`${emojis.cross} Lütfen yasaklanacak kişiyi etiketleyin veya ID'sini girin.`);
        
        try {
            await target.ban({ reason: `Yasaklayan: ${message.author.tag} (${message.author.id})` });
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${emojis.banhammer} Kullanıcı Yasaklandı`),
                    new TextDisplayBuilder().setContent(
                        `${emojis.matter} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n` +
                        `${emojis.matter} **Yetkili:** ${message.author} (\`${message.author.tag}\`)\n` +
                        `${emojis.matter} **İşlem:** ${emojis.tick} Başarıyla sunucudan yasaklandı.`
                    )
                );
            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error("Ban hatası:", err);
            message.reply(`${emojis.cross} Bu kullanıcıyı yasaklayamıyorum, botun yetkilerini veya üyenin rol sırasını kontrol edin.`);
        }
    }
};
