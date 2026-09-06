const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'euro',
    aliases: ['eur', 'avro', 'euro-kuru', 'eurokuru'],
    description: 'Canlı Euro (EUR/TRY) kurunu gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Euro',
                code: 'EUR/TRY',
                emoji: '💶',
                key: 'EUR',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Euro komutu hatası:', err);
            return message.reply('❌ Güncel euro kuru çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
