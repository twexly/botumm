const { EmbedBuilder } = require('discord.js');

let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 1000; // 30 saniye önbellek

async function getFinanceData() {
    const now = Date.now();
    if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedData;
    }

    const res = await fetch('https://finans.truncgil.com/today.json', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    if (!res.ok) {
        throw new Error(`Finans API yanıt vermedi (HTTP ${res.status})`);
    }

    const data = await res.json();
    cachedData = data;
    lastFetchTime = now;
    return data;
}

function buildFinanceEmbed({ title, code, emoji, key, data }) {
    const item = data[key];
    if (!item) {
        return new EmbedBuilder()
            .setColor(0xE74C3C)
            .setTitle(`${emoji} ${title}`)
            .setDescription('Bu finans verisi şu anda piyasadan alınamadı.');
    }

    const changeRaw = item['Değişim'] || '0';
    const isNegative = changeRaw.includes('-');
    const color = isNegative ? 0xE74C3C : 0x2ECC71;
    const arrow = isNegative ? '🔻' : '🔺';

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emoji} ${title} (${code})`)
        .setDescription(`> *Piyasalardan anlık olarak alınan canlı kur/fiyat bilgisi:*`)
        .addFields(
            { name: '📥 Alış Fiyatı', value: `\`${item['Alış']} ₺\``, inline: true },
            { name: '📤 Satış Fiyatı', value: `\`${item['Satış']} ₺\``, inline: true },
            { name: '📊 24s Değişim', value: `\`${item['Değişim']}\` ${arrow}`, inline: true }
        )
        .setFooter({ text: `Piyasa Verisi: Trunçgil Finans • Güncelleme: ${data.Update_Date || 'Canlı'}` })
        .setTimestamp();

    return embed;
}

module.exports = {
    getFinanceData,
    buildFinanceEmbed
};
