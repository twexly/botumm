const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'yarimaltin',
    aliases: ['yarim-altin', 'yarımaltın', 'yarım-altın', 'yarim', 'yarım'],
    description: 'Canlı Yarım Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Yarım Altın',
                code: 'YARIM/TRY',
                emoji: '🪙',
                key: 'yarim-altin',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Yarım altın komutu hatası:', err);
            return message.reply('❌ Güncel yarım altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
