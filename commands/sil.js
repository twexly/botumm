const { PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    name: 'sil',
    aliases: ['clear', 'purge', 'temizle'],
    modOnly: true,
    description: 'Belirtilen sayıda mesajı kanaldan toplu olarak siler.',
    async execute(message, client, args) {
        if (!message.guild) return;

        // Botun yetki kontrolü
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply(`${emojis.cross} Botun mesajları silmek için **Mesajları Yönet (Manage Messages)** yetkisi bulunmuyor.`);
        }

        // Hedef kullanıcı kontrolü (.sil @üye 50 veya .sil 50 @üye)
        const targetMember = message.mentions.members.first();
        let amount = null;

        for (const arg of args) {
            const parsed = parseInt(arg, 10);
            if (!isNaN(parsed) && parsed > 0) {
                amount = parsed;
                break;
            }
        }

        if (!amount || amount < 1 || amount > 100) {
            const warn = await message.reply(
                `❓ **Kullanım:** \`.sil <1-100>\` veya \`.sil @kullanıcı <1-100>\`\n` +
                `> **Örnek:** \`.sil 50\` *(Son 50 mesajı siler)*\n` +
                `> **Örnek:** \`.sil @üye 20\` *(Sadece o üyenin mesajlarını siler)*`
            );
            setTimeout(() => warn.delete().catch(() => {}), 8000);
            return;
        }

        try {
            // Önce komut mesajını sil
            await message.delete().catch(() => {});

            if (targetMember) {
                // Belirli bir üyenin mesajlarını sil
                const fetched = await message.channel.messages.fetch({ limit: 100 });
                const userMessages = fetched
                    .filter(m => m.author.id === targetMember.id)
                    .first(amount);

                if (userMessages.length === 0) {
                    const noMsg = await message.channel.send(`⚠️ ${targetMember} kullanıcısına ait son 100 mesaj içinde silinebilecek mesaj bulunamadı.`);
                    setTimeout(() => noMsg.delete().catch(() => {}), 5000);
                    return;
                }

                const deleted = await message.channel.bulkDelete(userMessages, true);
                const reply = await message.channel.send(`🗑️ ${targetMember} kullanıcısına ait **${deleted.size}** mesaj başarıyla silindi.`);
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            } else {
                // Genel mesaj silme
                const deleted = await message.channel.bulkDelete(amount, true);
                const reply = await message.channel.send(`🗑️ **${deleted.size}** adet mesaj başarıyla silindi.`);
                setTimeout(() => reply.delete().catch(() => {}), 5000);
            }
        } catch (err) {
            console.error("Toplu mesaj silme hatası:", err);
            const errReply = await message.channel.send(`${emojis.cross} Mesajlar silinirken bir hata oluştu. *(Discord kuralı gereği 14 günden eski mesajlar toplu silinemez)*`);
            setTimeout(() => errReply.delete().catch(() => {}), 7000);
        }
    }
};
