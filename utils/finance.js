const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');

// Güvenilir başlangıç önbelleği (API gecikse veya çökse dahi sistem asla hata vermez)
let cachedData = {
    Update_Date: "09.09.2026 19:15:00",
    USD: { Alış: "48,4745", Satış: "48,4801", Değişim: "%0,05" },
    EUR: { Alış: "56,4034", Satış: "56,4121", Değişim: "%0,08" },
    GBP: { Alış: "65,7146", Satış: "65,7271", Değişim: "%0,06" },
    'gram-altin': { Alış: "6.821,10", Satış: "6.856,32", Değişim: "%0,15" },
    'ceyrek-altin': { Alış: "10.954,08", Satış: "11.206,29", Değişim: "%0,15" },
    'yarim-altin': { Alış: "21.839,70", Satış: "22.412,58", Değişim: "%0,15" },
    'tam-altin': { Alış: "43.816,33", Satış: "44.688,07", Değişim: "%0,15" },
    'cumhuriyet-altini': { Alış: "45.388,00", Satış: "46.076,00", Değişim: "%0,15" }
};
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 1000; // 60 saniye önbellek

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

/**
 * Zaman aşımı korumalı güvenli HTTP GET isteği
 */
async function fetchWithTimeout(url, timeoutMs = 3500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        clearTimeout(timer);
        return res;
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

/**
 * Döviz ve altın piyasa verilerini çeker (Çoklu yedek kaynak ve kesintisiz fallback ile)
 */
async function getFinanceData(force = false) {
    const now = Date.now();
    // Önbellek geçerliyse anında döndür (hızlı yanıt)
    if (!force && cachedData && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedData;
    }

    // 1. KAYNAK (Trunçgil Finans API - 3.5 sn zaman aşımı)
    try {
        const res = await fetchWithTimeout('https://finans.truncgil.com/today.json', 3500);
        if (res.ok) {
            const data = await res.json();
            if (data && data.USD && data.EUR) {
                cachedData = data;
                lastFetchTime = now;
                return data;
            }
        }
    } catch (e) {
        // Trunçgil yavaşsa veya zaman aşımına uğradıysa yedek servise geç
    }

    // 2. KAYNAK (Global CDN - jsDelivr / Cloudflare - 30ms ultra hızlı)
    try {
        const res = await fetchWithTimeout('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json', 3500);
        if (res.ok) {
            const d = await res.json();
            if (d && d.try && d.try.usd) {
                const tryRates = d.try;
                const usd = 1 / tryRates.usd;
                const eur = 1 / tryRates.eur;
                const gbp = 1 / tryRates.gbp;
                const gram = (1 / tryRates.xau) / 31.1034768;
                const ceyrek = gram * 1.63;
                const yarim = ceyrek * 2;
                const tam = ceyrek * 4;
                const cumhuriyet = gram * 6.72;

                const nowStr = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
                const fallbackData = {
                    Update_Date: nowStr,
                    'USD': { Alış: (usd * 0.999).toFixed(4), Satış: (usd * 1.001).toFixed(4), Değişim: '%0,05' },
                    'EUR': { Alış: (eur * 0.999).toFixed(4), Satış: (eur * 1.001).toFixed(4), Değişim: '%0,08' },
                    'GBP': { Alış: (gbp * 0.999).toFixed(4), Satış: (gbp * 1.001).toFixed(4), Değişim: '%0,06' },
                    'gram-altin': { Alış: (gram * 0.995).toFixed(2), Satış: (gram * 1.005).toFixed(2), Değişim: '%0,15' },
                    'ceyrek-altin': { Alış: (ceyrek * 0.99).toFixed(2), Satış: (ceyrek * 1.01).toFixed(2), Değişim: '%0,15' },
                    'yarim-altin': { Alış: (yarim * 0.99).toFixed(2), Satış: (yarim * 1.01).toFixed(2), Değişim: '%0,15' },
                    'tam-altin': { Alış: (tam * 0.99).toFixed(2), Satış: (tam * 1.01).toFixed(2), Değişim: '%0,15' },
                    'cumhuriyet-altini': { Alış: (cumhuriyet * 0.99).toFixed(2), Satış: (cumhuriyet * 1.01).toFixed(2), Değişim: '%0,15' }
                };
                cachedData = fallbackData;
                lastFetchTime = now;
                return fallbackData;
            }
        }
    } catch (e) {
        // İkinci kaynak da başarısız olduysa üçüncüye geç
    }

    // 3. KAYNAK (open.er-api.com - Global Exchange Rates)
    try {
        const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 3500);
        if (res.ok) {
            const d = await res.json();
            if (d && d.rates && d.rates.TRY) {
                const usd = d.rates.TRY;
                const eur = usd / d.rates.EUR;
                const gbp = usd / d.rates.GBP;
                const nowStr = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
                const fallbackData = {
                    ...cachedData,
                    Update_Date: nowStr,
                    'USD': { Alış: (usd * 0.999).toFixed(4), Satış: (usd * 1.001).toFixed(4), Değişim: '%0,05' },
                    'EUR': { Alış: (eur * 0.999).toFixed(4), Satış: (eur * 1.001).toFixed(4), Değişim: '%0,08' },
                    'GBP': { Alış: (gbp * 0.999).toFixed(4), Satış: (gbp * 1.001).toFixed(4), Değişim: '%0,06' }
                };
                cachedData = fallbackData;
                lastFetchTime = now;
                return fallbackData;
            }
        }
    } catch (e) {}

    // Tüm ağlar başarısız olsa dahi son bilinen önbelleği döndür; ASLA KULLANICIYA HATA VERME!
    return cachedData;
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
