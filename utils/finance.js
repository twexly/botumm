const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 1000; // 15 saniye önbellek

const FINANCE_KEYS = {
    'USD': { title: 'Amerikan Doları', code: 'USD/TRY', emoji: '💵', key: 'USD' },
    'EUR': { title: 'Euro', code: 'EUR/TRY', emoji: '💶', key: 'EUR' },
    'GBP': { title: 'İngiliz Sterlini', code: 'GBP/TRY', emoji: '💷', key: 'GBP' },
    'gram-altin': { title: 'Gram Altın', code: 'ALTIN/GRAM', emoji: '🥇', key: 'gram-altin' },
    'ceyrek-altin': { title: 'Çeyrek Altın', code: 'ALTIN/ÇEYREK', emoji: '🪙', key: 'ceyrek-altin' },
    'yarim-altin': { title: 'Yarım Altın', code: 'ALTIN/YARIM', emoji: '🪙', key: 'yarim-altin' },
    'tam-altin': { title: 'Tam Altın', code: 'ALTIN/TAM', emoji: '💰', key: 'tam-altin' },
    'cumhuriyet-altini': { title: 'Cumhuriyet Altını', code: 'ALTIN/ATA', emoji: '🇹🇷', key: 'cumhuriyet-altini' }
};

async function getFinanceData(force = false) {
    const now = Date.now();
    if (!force && cachedData && (now - lastFetchTime < CACHE_DURATION)) {
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

function buildFinanceContainer({ title, code, emoji, key, data }) {
    const item = data[key];
    if (!item) {
        return new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ❌ ${emoji} ${title}`),
                new TextDisplayBuilder().setContent('Bu finans verisi şu anda piyasadan alınamadı.')
            );
    }

    const changeRaw = item['Değişim'] || '0';
    const isNegative = changeRaw.includes('-');
    const arrow = isNegative ? '🔻' : '🔺';
    const trendText = isNegative ? 'Düşüşte' : 'Yükselişte';

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${emoji} ${title} (${code})`),
            new TextDisplayBuilder().setContent(
                `> *Piyasalardan anlık olarak alınan canlı kur/fiyat bilgisi:*\n\n` +
                `• **📥 Alış Fiyatı:** \`${item['Alış']} ₺\`\n` +
                `• **📤 Satış Fiyatı:** \`${item['Satış']} ₺\`\n` +
                `• **📊 24s Değişim:** \`${item['Değişim']}\` ${arrow} (${trendText})\n` +
                `• **🕒 Son Güncelleme:** \`${data.Update_Date || 'Canlı'}\``
            )
        )
        .addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`fin_refresh_${key}`)
            .setLabel('Kuru Yenile')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(row);

    return container;
}

function buildMarketSummaryContainer(data) {
    const formatLine = (name, key, emoji) => {
        const item = data[key];
        if (!item) return `• ${emoji} **${name}:** Bilgi alınamadı`;
        const arrow = item['Değişim']?.includes('-') ? '🔻' : '🔺';
        return `• ${emoji} **${name}:** \`${item['Alış']} ₺\` / \`${item['Satış']} ₺\` (\`${item['Değişim']}\` ${arrow})`;
    };

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent('# 📊 Canlı Piyasa, Döviz ve Altın Kurları'),
            new TextDisplayBuilder().setContent('> *Trunçgil Finans üzerinden anlık çekilen güncel serbest piyasa kurları:*')
        )
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 💵 Döviz Kurları (Alış / Satış)\n` +
                `${formatLine('Dolar (USD)', 'USD', '💵')}\n` +
                `${formatLine('Euro (EUR)', 'EUR', '💶')}\n` +
                `${formatLine('Sterlin (GBP)', 'GBP', '💷')}`
            ),
            new TextDisplayBuilder().setContent(
                `### 🥇 Altın Fiyatları (Alış / Satış)\n` +
                `${formatLine('Gram Altın', 'gram-altin', '🥇')}\n` +
                `${formatLine('Çeyrek Altın', 'ceyrek-altin', '🪙')}\n` +
                `${formatLine('Yarım Altın', 'yarim-altin', '🪙')}\n` +
                `${formatLine('Tam Altın', 'tam-altin', '💰')}\n` +
                `${formatLine('Cumhuriyet Altını', 'cumhuriyet-altini', '🇹🇷')}\n\n` +
                `*Son Güncelleme: ${data.Update_Date || 'Canlı Veri'}*`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder());

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('fin_refresh_summary')
            .setLabel('Piyasayı Yenile')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Secondary)
    );
    container.addActionRowComponents(row);

    return container;
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
    buildFinanceContainer,
    buildMarketSummaryContainer,
    buildFinanceEmbed,
    FINANCE_KEYS
};
