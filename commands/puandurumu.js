const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const emojis = require('../emojis');

// 5 dakikalık ekran görüntüsü önbelleği
let cachedScreenshot = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

async function fetchStandingsScreenshot() {
    const now = Date.now();
    if (cachedScreenshot && (now - lastFetchTime < CACHE_DURATION)) {
        return cachedScreenshot;
    }

    const { default: puppeteer } = await import('puppeteer-core');
    const possibleChromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    let executablePath = null;
    for (const p of possibleChromePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    if (!executablePath) {
        throw new Error('Sistemde Chrome veya Edge tarayıcısı bulunamadı.');
    }

    const browser = await puppeteer.launch({
        executablePath,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1280,1200'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1200, deviceScaleFactor: 2 });

        await page.goto('https://www.flashscore.com/football/turkey/super-lig/standings/2TRNmxYR/standings/overall/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Çerez kabul et
        try {
            const cookieBtn = await page.$('#onetrust-accept-btn-handler');
            if (cookieBtn) await cookieBtn.click();
        } catch (_) {}

        // Tabloyu bekle
        await page.waitForSelector('div[class*="tableWrapper"], div[class*="ui-table"], div.tableWrapper', { timeout: 15000 }).catch(() => null);

        // Reklam ve gereksiz öğeleri gizle
        await page.evaluate(() => {
            const toHide = [
                '#onetrust-consent-sdk',
                '#banner',
                '.header',
                '.headerMenu',
                '.leftMenu',
                'footer',
                'div[class*="adWrap"]',
                'div[class*="advertisement"]'
            ];
            toHide.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
            });
        });

        const tableEl = await page.$('div[class*="tableWrapper"]') || await page.$('div[class*="ui-table"]') || await page.$('div.standingsTable');

        let imageBuffer = null;
        if (tableEl) {
            imageBuffer = await tableEl.screenshot({ type: 'png' });
        } else {
            imageBuffer = await page.screenshot({ type: 'png' });
        }

        cachedScreenshot = imageBuffer;
        lastFetchTime = now;
        return imageBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = {
    name: 'puandurumu',
    aliases: ['puan', 'standings', 'ligtablosu', 'siralamalar'],
    description: 'FlashScore üzerinden canlı Süper Lig puan durumunu çeker ve görsel olarak gönderir.',
    async execute(message, client) {
        const waitMsg = await message.reply({
            content: `${emojis.settings} Güncel Süper Lig puan durumu FlashScore üzerinden alınıyor, lütfen bekleyin...`
        });

        try {
            const buffer = await fetchStandingsScreenshot();
            const attachment = new AttachmentBuilder(buffer, { name: 'puandurumu.png' });

            const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🏆 Trendyol Süper Lig — Canlı Puan Durumu'),
                    new TextDisplayBuilder().setContent(
                        `FlashScore verileriyle anlık olarak çekilen resmi lig sıralaması:\n\n` +
                        `${emojis.matter} **Kaynak:** [FlashScore Süper Lig](https://www.flashscore.com/football/turkey/super-lig/standings/2TRNmxYR/standings/overall/)\n` +
                        `${emojis.matter} **Son Güncelleme:** Saat \`${nowStr}\`\n\n` +
                        `> *Takımını seçmek için \`.superlig\` komutunu kullanabilirsin!*`
                    )
                )
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems([
                        { description: 'Süper Lig Puan Durumu', url: 'attachment://puandurumu.png' }
                    ])
                );

            await waitMsg.delete().catch(() => {});

            return message.channel.send({
                files: [attachment],
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (err) {
            console.error('Puan durumu alma hatası:', err);
            await waitMsg.edit({
                content: `${emojis.cross} Puan durumu tablosu çekilirken bir hata oluştu: \`${err.message}\``
            }).catch(() => {});
        }
    }
};
