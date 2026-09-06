const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'yarimaltin',
    aliases: ['yarim-altin', 'yarımaltın', 'yarım-altın', 'yarim', 'yarım'],
    description: 'Canlı Yarım Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Yarım Altın',
                code: 'YARIM/TRY',
                emoji: '🪙',
                key: 'yarim-altin',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Yarım altın komutu hatası:', err);
            return message.reply('❌ Güncel yarım altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
