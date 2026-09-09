const { MessageFlags } = require('discord.js');
const { getFinanceData, buildMarketSummaryContainer } = require('../utils/finance');

module.exports = {
    name: 'doviz',
    aliases: ['döviz', 'kur', 'kurlar', 'dovizkuru', 'piyasa', 'altin', 'altın'],
    description: 'Piyasalardaki güncel döviz ve altın kurlarını özet olarak gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildMarketSummaryContainer(data);
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Döviz özet komutu hatası:', err);
            return message.reply('❌ Piyasa verileri çekilirken bir hata oluştu.');
        }
    }
};
