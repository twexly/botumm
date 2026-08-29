const { GoogleGenAI } = require('@google/genai');
const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js'); 

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const userLimits = new Map();

module.exports = {
    name: 'ai',
    async execute(message, client) {
        const userId = message.author.id;
        
        // Limit Kontrolü
        const currentCount = userLimits.get(userId) || 0;
        if (currentCount >= 2) {
            return message.reply('Günlük 2 soru limitini doldurdun.');
        }

        let prompt = message.content.replace(/^[!.]ai/i, '').replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
        if (!prompt) {
            return message.reply('Lütfen bana bir soru sor! (Örnek: .ai Merhaba)');
        }

        const statusMessage = await message.reply('Yapay zeka yanıtı hazırlanıyor...');

        try {
            userLimits.set(userId, currentCount + 1);

            const response = await ai.models.generateContent({ 
                model: 'gemini-2.5-flash', 
                contents: prompt 
            });
            
            const aiResponseText = response.text;

            const finalOutput = aiResponseText.length > 3900 
                ? aiResponseText.substring(0, 3900) + '... (Devamı var)' 
                : aiResponseText;

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Yapay Zeka Yanıtı\n\n${finalOutput}`)
                )
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`*Kalan Hak: ${2 - (currentCount + 1)}*`)
                );

            await statusMessage.edit({
                content: '',
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error("AI Hatası:", error); 
            userLimits.set(userId, currentCount); 
            await statusMessage.edit('Yanıt üretilemedi. Daha sonra tekrar dene.');
        }
    }
};