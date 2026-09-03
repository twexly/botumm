const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'dev',
    aliases: ['developer', 'yapimci', 'gelistirici'],
    async execute(message, client, args) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${emojis.developer} Bot Geliştiricisi & Yapımcı`),
                new TextDisplayBuilder().setContent(
                    `${emojis.hello} **Merhaba!** Bu bot **twexly** tarafından özel olarak geliştirilmiş ve yapılandırılmıştır.\n\n` +
                    `${emojis.matter} **Geliştirici:** ${emojis.developer} **twexly**\n` +
                    `${emojis.matter} **Sürüm:** \`v2.5.0 (Components V2)\`\n` +
                    `${emojis.matter} **Altyapı:** \`Discord.js v14 & Node.js\`\n` +
                    `${emojis.matter} **Çalışma Durumu:** ${emojis.tick} Aktif & Kusursuz`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*Sorularınız veya önerileriniz için bot geliştiricisi ile iletişime geçebilirsiniz.*`)
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
