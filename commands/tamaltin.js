const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'tamaltin',
    aliases: ['tam-altin', 'tamaltın', 'tam'],
    description: 'Canlı Tam Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Tam Altın',
                code: 'TAM/TRY',
                emoji: '💰',
                key: 'tam-altin',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Tam altın komutu hatası:', err);
            return message.reply('❌ Güncel tam altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
