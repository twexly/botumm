const { EmbedBuilder } = require('discord.js');
const { getFinanceData } = require('../utils/finance');

module.exports = {
    name: 'doviz',
    aliases: ['döviz', 'kurlar', 'piyasa', 'altin', 'altın'],
    description: 'Piyasalardaki güncel döviz ve altın kurlarını özet olarak gösterir.',
    async execute(message) {
        try {
            const data = await getFinanceData();

            const formatLine = (name, key, emoji) => {
                const item = data[key];
                if (!item) return `• ${emoji} **${name}:** Bilgi alınamadı`;
                const arrow = item['Değişim']?.includes('-') ? '🔻' : '🔺';
                return `• ${emoji} **${name}:** Alış: \`${item['Alış']} ₺\` | Satış: \`${item['Satış']} ₺\` (\`${item['Değişim']}\` ${arrow})`;
            };

            const embed = new EmbedBuilder()
                .setColor(0xF1C40F)
                .setTitle('📊 Canlı Piyasa, Döviz ve Altın Fiyatları')
                .setDescription('> *Trunçgil Finans üzerinden anlık çekilen güncel serbest piyasa kurları:*')
                .addFields(
                    {
                        name: '💵 Döviz Kurları',
                        value: [
                            formatLine('Dolar (USD)', 'USD', '💵'),
                            formatLine('Euro (EUR)', 'EUR', '💶'),
                            formatLine('Sterlin (GBP)', 'GBP', '💷')
                        ].join('\n')
                    },
                    {
                        name: '🥇 Altın Fiyatları',
                        value: [
                            formatLine('Gram Altın', 'gram-altin', '🥇'),
                            formatLine('Çeyrek Altın', 'ceyrek-altin', '🪙'),
                            formatLine('Yarım Altın', 'yarim-altin', '🪙'),
                            formatLine('Tam Altın', 'tam-altin', '💰'),
                            formatLine('Cumhuriyet Altını', 'cumhuriyet-altini', '🇹🇷')
                        ].join('\n')
                    }
                )
                .setFooter({ text: `Güncelleme: ${data.Update_Date || 'Canlı Veri'} • .dolar, .euro, .gramaltin vb. ile detay bakın` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Döviz özet komutu hatası:', err);
            return message.reply('❌ Piyasa verileri çekilirken bir hata oluştu.');
        }
    }
};
