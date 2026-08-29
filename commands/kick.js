const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'kick',
    modOnly: true,
    async execute(message, client, args) {
        const target = message.mentions.members.first();
        if (!target) return message.reply("Lütfen atılacak kişiyi etiketleyin.");
        
        try {
            await target.kick(`Atan: ${message.author.tag}`);
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Kullanıcı Atıldı`),
                    new TextDisplayBuilder().setContent(`**${target.user.tag}** sunucudan başarıyla atıldı.`)
                );
            const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(()=> {}), 10000);
        } catch (err) {
            message.reply("Bu kullanıcıyı atamıyorum, yetkilerimi veya üyenin rol sırasını kontrol edin.");
        }
    }
};
