const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'gramaltin',
    aliases: ['gram-altin', 'gramaltın', 'gram'],
    description: 'Canlı Gram Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Gram Altın',
                code: 'GLD/TRY',
                emoji: '🥇',
                key: 'gram-altin',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Gram altın komutu hatası:', err);
            return message.reply('❌ Güncel gram altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
