const { getFinanceData, buildFinanceEmbed } = require('../utils/finance');

module.exports = {
    name: 'cumhuriyetaltini',
    aliases: ['cumhuriyet-altini', 'cumhuriyetaltın', 'cumhuriyet', 'ata-altin', 'ataaltin'],
    description: 'Canlı Cumhuriyet / Ata Altını fiyatını gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();
            const embed = buildFinanceEmbed({
                title: 'Cumhuriyet Altını',
                code: 'CUMHURİYET/TRY',
                emoji: '🇹🇷',
                key: 'cumhuriyet-altini',
                data
            });
            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Cumhuriyet altını komutu hatası:', err);
            return message.reply('❌ Güncel cumhuriyet altını fiyatı çekilirken bir hata oluştu. Lütfen biraz sonra tekrar deneyin.');
        }
    }
};
