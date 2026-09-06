const { getFinanceData, buildFinanceContainer } = require('../utils/finance');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'cumhuriyetaltini',
    aliases: ['cumhuriyet-altini', 'cumhuriyetaltın', 'cumhuriyet', 'ata-altin', 'ataaltin'],
    description: 'Canlı Cumhuriyet / Ata Altını fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const container = buildFinanceContainer({
                title: 'Cumhuriyet Altını',
                code: 'CUMHURİYET/TRY',
                emoji: '🇹🇷',
                key: 'cumhuriyet-altini',
                data
            });
            return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        } catch (err) {
            console.error('Cumhuriyet altını komutu hatası:', err);
            return message.reply('❌ Güncel cumhuriyet altını fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
