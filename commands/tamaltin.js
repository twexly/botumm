const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'tamaltin',
    aliases: ['tam-altin', 'tamaltın', 'tam'],
    description: 'Canlı Tam Altın fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Tam Altın',
                code: 'TAM/TRY',
                emoji: '💰',
                key: 'tam-altin',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Tam altın komutu hatası:', err);
            return message.reply('❌ Güncel tam altın fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
