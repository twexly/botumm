const { GoogleGenAI } = require('@google/genai');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js'); 

const userLimits = new Map(); // userId -> { count: number, resetAt: number }

module.exports = {
    name: 'ai',
    aliases: ['yapayzeka', 'gemini'],
    async execute(message, client) {
        const userId = message.author.id;
        const now = Date.now();
        
        // 24 Saatlik Limit Kontrolü
        let userQuota = userLimits.get(userId);
        if (!userQuota || now > userQuota.resetAt) {
            userQuota = { count: 0, resetAt: now + (24 * 60 * 60 * 1000) };
            userLimits.set(userId, userQuota);
        }

        const isAdmin = client.isModerator(message.member);
        const maxLimit = isAdmin ? 50 : 5;

        if (userQuota.count >= maxLimit) {
            const resetMinutes = Math.ceil((userQuota.resetAt - now) / (60 * 1000));
            return message.reply(`Günlük soru limitinizi (${maxLimit} soru) doldurdunuz. Limitiniz **${resetMinutes} dakika** sonra sıfırlanacaktır.`);
        }

        // Prompt Ayrıştırma
        let prompt = message.content.replace(/^[!.]ai\b/i, '').replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        if (!prompt) {
            return message.reply('Lütfen bana bir soru sorun! (Örnek: `.ai Türkiye\'nin başkenti neresidir?`)');
        }

        // API Key Kontrolü
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY;
        if (!apiKey) {
            const noKeyContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## ⚠️ Yapay Zeka API Anahtarı Bulunamadı'),
                    new TextDisplayBuilder().setContent(
                        'Yapay zeka sisteminin çalışabilmesi için bir **Google Gemini API Anahtarı** gereklidir.\n\n' +
                        '**Nasıl Eklenir?**\n' +
                        '1. [Google AI Studio](https://aistudio.google.com/app/apikey) adresine gidip ücretsiz API anahtarı oluşturun.\n' +
                        '2. Botun barındırıldığı panele (Render -> Environment Variables) `GEMINI_API_KEY` adıyla anahtarınızı ekleyin.'
                    )
                );
            return message.reply({ components: [noKeyContainer], flags: MessageFlags.IsComponentsV2 });
        }

        const statusMessage = await message.reply('Yapay zeka yanıtı hazırlanıyor...');

        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });

            // Sıralı aday model listesi (biri 404/kullanımdan kalkmış ise sonrakini dener)
            const candidateModels = [
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-3.6-flash',
                'gemini-2.5-flash'
            ];

            let aiResponseText = null;
            let lastError = null;

            for (const modelName of candidateModels) {
                try {
                    const response = await ai.models.generateContent({ 
                        model: modelName, 
                        contents: prompt 
                    });
                    if (response && response.text) {
                        aiResponseText = response.text;
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    // Eğer model 404 ise bir sonraki adaya geç
                    if (err.message && err.message.includes('404')) {
                        continue;
                    }
                    // Eğer yetki hatası (403/401) ise döngüyü kes
                    if (err.message && (err.message.includes('403') || err.message.includes('401') || err.message.includes('PERMISSION_DENIED'))) {
                        throw err;
                    }
                }
            }

            if (!aiResponseText) {
                throw lastError || new Error("Hiçbir modelden yanıt alınamadı.");
            }

            userQuota.count += 1;
            userLimits.set(userId, userQuota);

            const finalOutput = aiResponseText.length > 3900 
                ? aiResponseText.substring(0, 3900) + '... (Devamı kesildi)' 
                : aiResponseText;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Yapay Zeka Yanıtı\n\n${finalOutput}`)
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*Kalan Günlük Soru Hakkı: ${maxLimit - userQuota.count}*`)
                );

            await statusMessage.edit({
                content: '',
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("AI Komut Hatası:", error);

            let errorDesc = 'Yapay zeka yanıtı üretilirken bir hata oluştu.';
            if (error.message && (error.message.includes('403') || error.message.includes('PERMISSION_DENIED'))) {
                errorDesc = 'Google Gemini API anahtarının erişimi kısıtlanmış veya reddedilmiş. Lütfen https://aistudio.google.com/app/apikey adresinden yeni bir API anahtarı alıp güncelleyin.';
            } else if (error.message && error.message.includes('429')) {
                errorDesc = 'API istek kotası doldu. Lütfen birkaç dakika sonra tekrar deneyin.';
            }

            const errContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## ❌ Yapay Zeka Hatası'),
                    new TextDisplayBuilder().setContent(errorDesc)
                );

            await statusMessage.edit({
                content: '',
                components: [errContainer],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};