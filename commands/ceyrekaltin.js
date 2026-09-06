const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'ceyrekaltin',
    aliases: ['ceyrek-altin', 'çeyrekaltın', 'çeyrek', 'ceyrek'],
    description: 'Canlı Çeyrek Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Çeyrek Altın',
                code: 'ÇEYREK/TRY',
                emoji: '🪙',
                key: 'ceyrek-altin',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Çeyrek altın komutu hatası:', err);
            return message.reply('❌ Güncel çeyrek altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
