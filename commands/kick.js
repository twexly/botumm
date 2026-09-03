const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'kick',
    modOnly: true,
    async execute(message, client, args) {
        const target = message.mentions.members.first() || 
            (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

        if (!target) return message.reply(`${emojis.cross} Lütfen atılacak kişiyi etiketleyin veya ID'sini girin.`);
        
        try {
            await target.kick(`Atan: ${message.author.tag} (${message.author.id})`);
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${emojis.banhammer} Kullanıcı Atıldı`),
                    new TextDisplayBuilder().setContent(
                        `${emojis.matter} **Kullanıcı:** ${target.user} (\`${target.user.tag}\`)\n` +
                        `${emojis.matter} **Yetkili:** ${message.author} (\`${message.author.tag}\`)\n` +
                        `${emojis.matter} **İşlem:** ${emojis.tick} Başarıyla sunucudan atıldı.`
                    )
                );
            const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(() => {}), 10000);
        } catch (err) {
            console.error("Kick hatası:", err);
            message.reply(`${emojis.cross} Bu kullanıcıyı atamıyorum, botun yetkilerini veya üyenin rol sırasını kontrol edin.`);
        }
    }
};
