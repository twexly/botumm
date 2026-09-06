const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'dolar',
    aliases: ['usd', 'dolar-kuru', 'dolarkuru'],
    description: 'Canlı Amerikan Doları (USD/TRY) kurunu gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Amerikan Doları',
                code: 'USD/TRY',
                emoji: '💵',
                key: 'USD',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Dolar komutu hatası:', err);
            return message.reply('❌ Güncel dolar kuru çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
