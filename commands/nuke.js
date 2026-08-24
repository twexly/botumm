const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'nuke',
    modOnly: true,
    async execute(message, client) {
        try {
            const position = message.channel.position;
            const newChannel = await message.channel.clone();
            await message.channel.delete();
            await newChannel.setPosition(position);
            
            const container = new ContainerBuilder()
                .setAccentColor(0x9b59b6)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ☢️ Kanal Nukelendi!`),
                    new TextDisplayBuilder().setContent(`Bu kanal tertemiz oldu.`)
                );
            const msg = await newChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => msg.delete().catch(()=> {}), 10000);
        } catch (err) {
            message.reply("❌ Kanal nukelenirken hata oluştu!");
        }
    }
};
