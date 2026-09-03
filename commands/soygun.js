const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

function formatTime(ms) {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes} dakika ${seconds} saniye`;
}

module.exports = {
    name: 'soygun',
    aliases: ['cal', 'çal', 'rob'],
    description: 'Başka bir üyeyi soymayı denersiniz (%45 başarı şansı).',
    async execute(message, client, args) {
        const robberId = message.author.id;
        const robberEco = client.getEconomyStats(robberId);

        const targetMember = message.mentions.members.first() || 
            (args && args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

        if (!targetMember) {
            return message.reply({
                content: `${emojis.cross} Kimi soymak istediğini belirtmelisin!\n*Örnek:* \`.soygun @kullanıcı\``
            });
        }

        if (targetMember.id === robberId) {
            return message.reply({
                content: `${emojis.cross} Kendini soyamazsın, aklını başına topla!`
            });
        }

        if (targetMember.user.bot) {
            return message.reply({
                content: `${emojis.cross} Botları soyamazsın, paraları bankada kripto olarak kilitli!`
            });
        }

        const now = Date.now();
        const cooldown = 45 * 60 * 1000; // 45 dakika
        const lastRob = robberEco.robCooldown || 0;

        if (now - lastRob < cooldown) {
            const remaining = cooldown - (now - lastRob);
            return message.reply({
                content: `${emojis.cross} Polisler hala peşinde! Yeni bir soygun için **${formatTime(remaining)}** beklemelisin.`
            });
        }

        if ((robberEco.balance || 0) < 150) {
            return message.reply({
                content: `${emojis.cross} Soygun yapabilmek için yakalanırsan ödeyecek en az **150 ₺** nakit paran olmalı!`
            });
        }

        const victimEco = client.getEconomyStats(targetMember.id);
        if ((victimEco.balance || 0) < 150) {
            return message.reply({
                content: `${emojis.cross} **${targetMember.user.username}** adlı üyenin cüzdanında soyulmaya değer para yok (en az 150 ₺ olmalı)!`
            });
        }

        robberEco.robCooldown = now;

        // %45 Başarı Şansı
        const isSuccess = Math.random() < 0.45;

        if (isSuccess) {
            // Hedefin parasının %15 ile %30 arası
            const percent = (Math.floor(Math.random() * 16) + 15) / 100;
            const stolen = Math.floor(victimEco.balance * percent);

            victimEco.balance -= stolen;
            robberEco.balance += stolen;
            client.saveDatabase();

            const successContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🥷 Kusursuz Soygun Başarılı!'),
                    new TextDisplayBuilder().setContent(
                        `**${message.author.username}**, sinsice yaklaşıp **${targetMember.user.username}** adlı üyenin cüzdanını boşalttı!\n\n` +
                        `${emojis.matter} **Çalınan Tutar:** \`+${stolen.toLocaleString('tr-TR')} ₺\`\n` +
                        `${emojis.matter} **Kurbanın Kalanı:** \`${victimEco.balance.toLocaleString('tr-TR')} ₺\`\n` +
                        `${emojis.matter} **Yeni Bakiyen:** \`${robberEco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                        `> *İpucu: Paranızı güvende tutmak için bankaya yatırmayı unutmayın!*`
                    )
                );

            return message.channel.send({
                components: [successContainer],
                flags: MessageFlags.IsComponentsV2
            });
        } else {
            // Başarısızlık: Polise yakalanma cezası
            const fine = Math.min(robberEco.balance, Math.floor(Math.random() * 201) + 150); // 150 - 350 TL
            robberEco.balance -= fine;
            victimEco.balance += Math.floor(fine / 2); // Tazminat olarak kurbana yarısı verilir
            client.saveDatabase();

            const failContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🚨 YAKALANDIN! Polis Seni Enseledi'),
                    new TextDisplayBuilder().setContent(
                        `**${message.author.username}**, **${targetMember.user.username}** adlı üyeyi soymaya çalışırken alarm çaldı ve polisler seni kıskıvrak yakaladı!\n\n` +
                        `${emojis.matter} **Ödenen Ceza:** \`-${fine.toLocaleString('tr-TR')} ₺\`\n` +
                        `${emojis.matter} **Kurbana Ödenen Tazminat:** \`+${Math.floor(fine / 2).toLocaleString('tr-TR')} ₺\`\n` +
                        `${emojis.matter} **Kalan Nakit Bakiyen:** \`${robberEco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                        `> *Bir dahaki sefere daha dikkatli olmalısın!*`
                    )
                );

            return message.channel.send({
                components: [failContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};
