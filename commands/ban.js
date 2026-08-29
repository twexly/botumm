const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'ban',
    modOnly: true,
    async execute(message, client, args) {
        const target = message.mentions.members.first();
        if (!target) return message.reply("Lütfen yasaklanacak kişiyi etiketleyin.");
        
        try {
            await target.ban({ reason: `Yasaklayan: ${message.author.tag}` });
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Kullanıcı Yasaklandı`),
                    new TextDisplayBuilder().setContent(`**${target.user.tag}** sunucudan başarıyla yasaklandı.`)
                );
            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            message.reply("Bu kullanıcıyı yasaklayamıyorum, yetkilerimi veya üyenin rol sırasını kontrol edin.");
        }
    }
};
