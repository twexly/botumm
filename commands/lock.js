const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'lock',
    modOnly: true,
    async execute(message, client) {
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Kanal Kilitlendi`),
                    new TextDisplayBuilder().setContent(`Bu kanala mesaj gönderimi geçici olarak durduruldu.`)
                );
            const msg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(()=> {}), 10000);
        } catch (err) {
            message.reply("Kanal kilitlenirken hata oluştu.");
        }
    }
};
