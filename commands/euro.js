const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'euro',
    aliases: ['eur', 'avro', 'euro-kuru', 'eurokuru'],
    description: 'Canlı Euro (EUR/TRY) kurunu gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Euro',
                code: 'EUR/TRY',
                emoji: '💶',
                key: 'EUR',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Euro komutu hatası:', err);
            return message.reply('❌ Güncel euro kuru çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
