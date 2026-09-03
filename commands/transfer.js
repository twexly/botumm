const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'transfer',
    aliases: ['gonder', 'gönder', 'pay'],
    description: 'Başka bir üyeye nakit para gönderir.',
    async execute(message, client, args) {
        const senderId = message.author.id;
        const senderEco = client.getEconomyStats(senderId);

        const targetMember = message.mentions.members.first() || 
            (args && args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

        if (!targetMember) {
            return message.reply({
                content: `${emojis.cross} Kime para göndermek istediğini belirtmelisin!\n*Örnek:* \`.transfer @kullanıcı 500\``
            });
        }

        if (targetMember.id === senderId) {
            return message.reply({
                content: `${emojis.cross} Kendine para gönderemezsin!`
            });
        }

        if (targetMember.user.bot) {
            return message.reply({
                content: `${emojis.cross} Botlara para gönderemezsin!`
            });
        }

        // Miktar kontrolü (arg[1] veya mentions dışındaki sayı)
        let amount = null;
        for (const arg of args) {
            if (/^\d+$/.test(arg)) {
                amount = parseInt(arg, 10);
                break;
            }
        }

        if (!amount || isNaN(amount) || amount <= 0) {
            return message.reply({
                content: `${emojis.cross} Geçerli bir para miktarı belirtmelisin!\n*Örnek:* \`.transfer @kullanıcı 500\``
            });
        }

        if ((senderEco.balance || 0) < amount) {
            return message.reply({
                content: `${emojis.cross} Yeterli nakit paran yok! Mevcut nakitin: **${(senderEco.balance || 0).toLocaleString('tr-TR')} ₺**`
            });
        }

        const receiverEco = client.getEconomyStats(targetMember.id);
        senderEco.balance -= amount;
        receiverEco.balance = (receiverEco.balance || 0) + amount;
        client.saveDatabase();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# 💸 Para Transferi Gerçekleşti'),
                new TextDisplayBuilder().setContent(
                    `**${message.author.username}**, başarıyla **${targetMember.user.username}** adlı üyeye para gönderdi!\n\n` +
                    `${emojis.matter} **Gönderilen Tutar:** \`${amount.toLocaleString('tr-TR')} ₺\`\n` +
                    `${emojis.matter} **Alıcı:** ${targetMember} (\`${receiverEco.balance.toLocaleString('tr-TR')} ₺\`)\n` +
                    `${emojis.matter} **Kalan Nakitin:** \`${senderEco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                    `> *İşlem dekontu başarıyla kaydedildi.*`
                )
            );

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
