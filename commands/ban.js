const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'ban',
    modOnly: true,
    async execute(message, client, args) {
        const target = message.mentions.members.first();
        if (!target) return message.reply("💡 Lütfen banlanacak kişiyi etiketle!");
        
        try {
            await target.ban({ reason: `Banlayan: ${message.author.tag}` });
            const container = new ContainerBuilder()
                .setAccentColor(0xe74c3c)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## 🔨 Kullanıcı Banlandı`),
                    new TextDisplayBuilder().setContent(`**${target.user.tag}** sunucudan başarıyla yasaklandı.`)
                );
            await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            message.reply("❌ Bu kullanıcıyı banlayamıyorum, yetkilerimi veya üyenin rol sırasını kontrol et.");
        }
    }
};
