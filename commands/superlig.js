const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

const SUPER_LIG_TEAMS = [
    { id: 'sl_galatasaray', name: 'Galatasaray', color: '#A90432', emoji: '<:galatasaray:1548047618049843331>', desc: 'Sarı Kırmızı • Cimbom' },
    { id: 'sl_fenerbahce', name: 'Fenerbahçe', color: '#002366', emoji: '<:fenerbahce:1548047920329396244>', desc: 'Sarı Lacivert • Sarı Kanarya' },
    { id: 'sl_besiktas', name: 'Beşiktaş', color: '#111111', emoji: '<:besiktas:1548047466623139860>', desc: 'Siyah Beyaz • Kara Kartal' },
    { id: 'sl_trabzonspor', name: 'Trabzonspor', color: '#8B0000', emoji: '<:trabzonspor:1548046641024602192>', desc: 'Bordo Mavi • Karadeniz Fırtınası' },
    { id: 'sl_basaksehir', name: 'Başakşehir', color: '#FF7518', emoji: '<:basaksehir:1548047417834995742>', desc: 'Turuncu Lacivert • Boz Baykuşlar' },
    { id: 'sl_samsunspor', name: 'Samsunspor', color: '#E30A17', emoji: '<:samsunspor:1548047336154865776>', desc: 'Kırmızı Beyaz Siyah • Şimşekler' },
    { id: 'sl_goztepe', name: 'Göztepe', color: '#FFD700', emoji: '<:goztepe:1548047700358996019>', desc: 'Sarı Kırmızı • Göz Göz' },
    { id: 'sl_kasimpasa', name: 'Kasımpaşa', color: '#003399', emoji: '<:kasimpasa:1548047669119815771>', desc: 'Lacivert Beyaz • Paşa' },
    { id: 'sl_caykurrizespor', name: 'Çaykur Rizespor', color: '#006633', emoji: '<:caykurrizespor:1548047499971919924>', desc: 'Yeşil Mavi • Atmacalar' },
    { id: 'sl_alanyaspor', name: 'Alanyaspor', color: '#FF8C00', emoji: '<:alanyaspor:1548047391146377287>', desc: 'Turuncu Yeşil • Şimşekler' },
    { id: 'sl_kocaelispor', name: 'Kocaelispor', color: '#006400', emoji: '<:kocaelispor:1548047864293228564>', desc: 'Yeşil Siyah • Körfez' },
    { id: 'sl_erzurumspor', name: 'Erzurumspor', color: '#003399', emoji: '<:erzurumspor:1548047798572945499>', desc: 'Mavi Beyaz • Dadaşlar' },
    { id: 'sl_genclerbirligi', name: 'Gençlerbirliği', color: '#C8102E', emoji: '<:genclerbirligi:1548047755983855626>', desc: 'Kırmızı Kara • Alkaralar' },
    { id: 'sl_amedspor', name: 'Amedspor', color: '#008000', emoji: '<:amedspor:1548047728641056858>', desc: 'Yeşil Kırmızı Beyaz' },
    { id: 'sl_corumfk', name: 'Çorum FK', color: '#8B0000', emoji: '<:corumfk:1548047588467408896>', desc: 'Kırmızı Siyah' }
];

module.exports = {
    name: 'superlig',
    aliases: ['süperlig', 'takim', 'takım', 'takimsec'],
    modOnly: true,
    description: 'Süper Lig takım rollerini oluşturur ve interaktif takım seçim panelini gönderir.',
    async execute(message, client) {
        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        // Komut mesajını temizle (varsa)
        await message.delete().catch(() => {});

        // 1. Select Menu Seçeneklerini Oluştur
        const options = SUPER_LIG_TEAMS.map(team => ({
            label: team.name,
            value: team.id || `sl_${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            description: team.desc,
            emoji: team.emoji
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('superlig_takim_sec')
            .setPlaceholder('⚽ Desteklediğin Süper Lig takımını seç...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 2. Components V2 Container
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# ⚽ Süper Lig Takım Seçim Paneli'),
                new TextDisplayBuilder().setContent(
                    `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir ve sunucudaki takım rolünü anında alabilirsin!\n\n` +
                    `${emojis.matter} **Nasıl Çalışır?**\n` +
                    `• Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                    `• Başka bir takım seçersen eski takım rolün otomatik olarak kaldırılır.\n` +
                    `• Takımını istediğin zaman değiştirebilirsin.\n\n` +
                    `> *Tribündeki yerini al, takımını gururla temsil et!*`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(row);

        // 3. Paneli Anında Gönder (Çok Kademeli Güvenli Fallback)
        try {
            await message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (err) {
            console.error("Components V2 gönderme hatası, klasik ActionRow deneniyor:", err);
            try {
                await message.channel.send({
                    content: `# ⚽ Süper Lig Takım Seçim Paneli\n\n` +
                        `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir ve sunucudaki takım rolünü anında alabilirsin!\n\n` +
                        `${emojis.matter} **Nasıl Çalışır?**\n` +
                        `• Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                        `• Başka bir takım seçersen eski takım rolün otomatik olarak kaldırılır.\n` +
                        `• Takımını istediğin zaman değiştirebilirsin.\n\n` +
                        `> *Tribündeki yerini al, takımını gururla temsil et!*`,
                    components: [row]
                });
            } catch (fallbackErr) {
                console.error("Özel emojili menü hatası, sade menü deneniyor:", fallbackErr);
                const plainOptions = SUPER_LIG_TEAMS.map(team => ({
                    label: team.name,
                    value: team.id || `sl_${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
                    description: team.desc
                }));
                const plainMenu = new StringSelectMenuBuilder()
                    .setCustomId('superlig_takim_sec')
                    .setPlaceholder('⚽ Desteklediğin Süper Lig takımını seç...')
                    .addOptions(plainOptions);
                const plainRow = new ActionRowBuilder().addComponents(plainMenu);
                await message.channel.send({
                    content: `# ⚽ Süper Lig Takım Seçim Paneli\n\n` +
                        `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir ve sunucudaki takım rolünü anında alabilirsin!\n\n` +
                        `• Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                        `• Başka bir takım seçersen eski takım rolün otomatik olarak kaldırılır.\n` +
                        `• Takımını istediğin zaman değiştirebilirsin.\n\n` +
                        `> *Tribündeki yerini al, takımını gururla temsil et!*`,
                    components: [plainRow]
                });
            }
        }

        // 4. Arka planda eksik rolleri güvenle ve sessizce oluştur (Kullanıcıyı asla bekletmez)
        (async () => {
            try {
                const guildRoles = await message.guild.roles.fetch().catch(() => null);
                if (!guildRoles) return;
                for (const team of SUPER_LIG_TEAMS) {
                    const exists = guildRoles.some(r => r.name.toLowerCase() === team.name.toLowerCase());
                    if (!exists) {
                        await message.guild.roles.create({
                            name: team.name,
                            color: team.color,
                            reason: 'Süper Lig Takım Seçim Sistemi'
                        }).catch(() => {});
                        await new Promise(res => setTimeout(res, 1200)); // Discord rate limit koruması
                    }
                }
            } catch (e) {}
        })();
    },
    SUPER_LIG_TEAMS
};
