const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

function formatTime(ms) {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes} dakika ${seconds} saniye`;
}

const JOBS = [
    { title: 'Yazılım Geliştiricisi', text: 'Discord için yeni bir bot özelliği kodladın ve müşteriden ödeme aldın!' },
    { title: 'Tasarımcı', text: 'Sunucuya özel rank kartı tasarladın ve tasarım ücretini kazandın!' },
    { title: 'Twitch Yayıncısı', text: 'Gece boyu yayın açtın ve izleyicilerinden cömert bağışlar topladın!' },
    { title: 'Kurye', text: 'Şehrin en yoğun saatinde siparişleri gecikmeden yetiştirip bolca bahşiş aldın!' },
    { title: 'Barista', text: 'En lezzetli filtre kahveleri hazırlayarak günün çalışan yıldızı seçildin!' },
    { title: 'Siber Güvenlik Uzmanı', text: 'Bir sunucuya yapılan siber saldırıyı bertaraf ettin ve ödül aldın!' },
    { title: 'E-Sporcu', text: 'Haftalık turnuvada harika bir performans sergileyerek ödül havuzundan payını aldın!' },
    { title: 'Kripto Trader', text: 'Doğru zamanda alım-satım yaparak güzel bir kâr yakaladın!' }
];

module.exports = {
    name: 'çalış',
    aliases: ['calis', 'work', 'mesai'],
    description: 'Bir işte çalışarak para kazanmanızı sağlar (30 dakikada bir).',
    async execute(message, client) {
        const userId = message.author.id;
        const eco = client.getEconomyStats(userId);
        const stats = client.userStats.get(userId);

        const now = Date.now();
        const cooldown = 30 * 60 * 1000; // 30 dk
        const lastWork = eco.workCooldown || 0;

        if (now - lastWork < cooldown) {
            const remaining = cooldown - (now - lastWork);
            const waitContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# ☕ Mola Vakti! Henüz Çok Yorgunsun'),
                    new TextDisplayBuilder().setContent(
                        `${emojis.cross} Az önce çok çalıştın, biraz dinlenmelisin.\n\n` +
                        `${emojis.matter} Tekrar çalışabilmek için: **${formatTime(remaining)}** beklemelisin.`
                    )
                );

            return message.channel.send({
                components: [waitContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const job = JOBS[Math.floor(Math.random() * JOBS.length)];
        const earned = Math.floor(Math.random() * 451) + 250; // 250 - 700 TL
        const levelBonus = (stats.level || 1) * 20;
        const totalEarned = earned + levelBonus;

        eco.balance = (eco.balance || 0) + totalEarned;
        eco.workCooldown = now;
        client.saveDatabase();

        const workContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# 💼 Mesai Tamamlandı — ${job.title}`),
                new TextDisplayBuilder().setContent(
                    `${job.text}\n\n` +
                    `${emojis.matter} **Kazanılan Maaş:** \`+${totalEarned.toLocaleString('tr-TR')} ₺\`\n` +
                    `${emojis.matter} **Yeni Nakit Bakiye:** \`${eco.balance.toLocaleString('tr-TR')} ₺\`\n\n` +
                    `> *Bir sonraki mesai için 30 dakika sonra tekrar \`.çalış\` yazabilirsin.*`
                )
            );

        return message.channel.send({
            components: [workContainer],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
