const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'rolekle',
    modOnly: true,
    async execute(message, client, args) {
        // 1. Hedef Üyeyi Bul
        const targetMember = message.mentions.members.first() || 
            (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);

        if (!targetMember) {
            return message.reply("Lütfen rol verilecek kullanıcıyı etiketleyin veya ID'sini girin. (Örnek: .rolekle @kullanıcı @rol)");
        }

        // 2. Rolü Bul (Etiket, ID veya İsim ile)
        let targetRole = message.mentions.roles.first();
        if (!targetRole && args[1]) {
            targetRole = message.guild.roles.cache.get(args[1]) || 
                message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase());
        }

        if (!targetRole) {
            return message.reply("Lütfen geçerli bir rol etiketleyin, ID'sini yazın veya adını girin.");
        }

        // 3. Yetki & Hiyerarşi Kontrolleri
        if (targetMember.roles.cache.has(targetRole.id)) {
            return message.reply(`**${targetMember.user.tag}** kullanıcısı zaten ${targetRole} rolüne sahip.`);
        }

        const botMember = message.guild.members.me;
        if (targetRole.position >= botMember.roles.highest.position) {
            return message.reply("Bu rol benim en yüksek rolümden üstte veya eşit olduğu için verilemiyor.");
        }

        // 4. Rolü Ver
        try {
            await targetMember.roles.add(targetRole, `Rol veren: ${message.author.tag} (${message.author.id})`);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## Rol Başarıyla Verildi`),
                    new TextDisplayBuilder().setContent(
                        `**Kullanıcı:** ${targetMember} (\`${targetMember.user.tag}\`)\n` +
                        `**Verilen Rol:** ${targetRole} (\`${targetRole.name}\`)\n` +
                        `**Yetkili:** ${message.author} (\`${message.author.tag}\`)\n` +
                        `**Tarih:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

            const replyMsg = await message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
            setTimeout(() => replyMsg.delete().catch(() => {}), 10000);

        } catch (error) {
            console.error("Rol ekleme hatası:", error);
            message.reply("Rol verilirken bir hata oluştu. Botun 'Rolleri Yönet' yetkisini ve rol sırasını kontrol edin.");
        }
    }
};
