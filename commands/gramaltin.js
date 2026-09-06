const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'gramaltin',
    aliases: ['gram-altin', 'gramaltın', 'gram'],
    description: 'Canlı Gram Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Gram Altın',
                code: 'GLD/TRY',
                emoji: '🥇',
                key: 'gram-altin',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Gram altın komutu hatası:', err);
            return message.reply('❌ Güncel gram altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
