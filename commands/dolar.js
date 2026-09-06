const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'dolar',
    aliases: ['usd', 'dolar-kuru', 'dolarkuru'],
    description: 'Canlı Amerikan Doları (USD/TRY) kurunu gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Amerikan Doları',
                code: 'USD/TRY',
                emoji: '💵',
                key: 'USD',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Dolar komutu hatası:', err);
            return message.reply('❌ Güncel dolar kuru çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
