const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'unlock',
    modOnly: true,
    async execute(message, client) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
            
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Kanal Kilidi Açıldı`),
                    new TextDisplayBuilder().setContent(`Bu kanala artık mesaj gönderilebilir.`)
                );
            const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(()=> {}), 10000);
        } catch (err) {
            message.reply("Kanal kilidi açılırken hata oluştu.");
        }
    }
};
