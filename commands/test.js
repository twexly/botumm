const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'test',
    async execute(message, client) {
        try {
            const textComponent = new TextDisplayBuilder().setContent(
                'This is the text display component'
            );

            const containerComponent = new ContainerBuilder().addTextDisplayComponents(
                textComponent,
                textComponent,
                textComponent
            );

            await message.channel.send({
                flags: MessageFlags.IsComponentsV2,
                components: [containerComponent],
            });
            
        } catch (error) {
            console.error("Test komutu hatası:", error);
            message.reply(`❌ Bir hata oluştu: ${error.message}`);
        }
    }
};
