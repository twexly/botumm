const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

const SUPER_LIG_TEAMS = [
    { name: 'Galatasaray', color: '#A90432', emoji: '🦁', desc: 'Sarı Kırmızı • Cimbom' },
    { name: 'Fenerbahçe', color: '#002366', emoji: '🟡', desc: 'Sarı Lacivert • Sarı Kanarya' },
    { name: 'Beşiktaş', color: '#111111', emoji: '🦅', desc: 'Siyah Beyaz • Kara Kartal' },
    { name: 'Trabzonspor', color: '#8B0000', emoji: '🌊', desc: 'Bordo Mavi • Karadeniz Fırtınası' },
    { name: 'Başakşehir', color: '#FF7518', emoji: '🦉', desc: 'Turuncu Lacivert • Boz Baykuşlar' },
    { name: 'Samsunspor', color: '#E30A17', emoji: '🔴', desc: 'Kırmızı Beyaz Siyah • Kırmızı Şimşekler' },
    { name: 'Eyüpspor', color: '#4B0082', emoji: '🟣', desc: 'Eflatun Sarı • Eflatunlar' },
    { name: 'Göztepe', color: '#FFD700', emoji: '⚓', desc: 'Sarı Kırmızı • Göz Göz' },
    { name: 'Sivasspor', color: '#C8102E', emoji: '🔴', desc: 'Kırmızı Beyaz • Yiğidolar' },
    { name: 'Kasımpaşa', color: '#003399', emoji: '🔵', desc: 'Lacivert Beyaz • Paşa' },
    { name: 'Antalyaspor', color: '#E30A17', emoji: '🦂', desc: 'Kırmızı Beyaz • Akrepler' },
    { name: 'Çaykur Rizespor', color: '#006633', emoji: '🟢', desc: 'Yeşil Mavi • Atmacalar' },
    { name: 'Gaziantep FK', color: '#A50021', emoji: '🦅', desc: 'Kırmızı Siyah • Şahinler' },
    { name: 'Konyaspor', color: '#008000', emoji: '🦅', desc: 'Yeşil Beyaz • Anadolu Kartalı' },
    { name: 'Alanyaspor', color: '#FF8C00', emoji: '🟠', desc: 'Turuncu Yeşil • Şimşekler' },
    { name: 'Bodrum FK', color: '#00A859', emoji: '⛵', desc: 'Yeşil Beyaz' },
    { name: 'Kayserispor', color: '#FFD700', emoji: '⭐', desc: 'Sarı Kırmızı • Anadolu Yıldızı' },
    { name: 'Hatayspor', color: '#800020', emoji: '🌟', desc: 'Bordo Beyaz • Güneyin Yıldızı' },
    { name: 'Adana Demirspor', color: '#0080FF', emoji: '⚡', desc: 'Mavi Lacivert • Mavi Şimşekler' }
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

        const waitMsg = await message.reply({
            content: `${emojis.settings} Süper Lig takım rolleri kontrol ediliyor ve hazırlanıyor, lütfen bekleyin...`
        });

        // 1. Rolleri kontrol et ve yoksa otomatik oluştur
        const guildRoles = await message.guild.roles.fetch();
        let createdCount = 0;

        for (const team of SUPER_LIG_TEAMS) {
            const exists = guildRoles.some(r => r.name.toLowerCase() === team.name.toLowerCase());
            if (!exists) {
                try {
                    await message.guild.roles.create({
                        name: team.name,
                        color: team.color,
                        reason: 'Süper Lig Takım Seçim Sistemi'
                    });
                    createdCount++;
                } catch (err) {
                    console.error(`Rol oluşturulamadı (${team.name}):`, err.message);
                }
            }
        }

        // 2. Select Menu Seçeneklerini Oluştur
        const options = SUPER_LIG_TEAMS.map(team => ({
            label: team.name,
            value: `sl_${team.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            description: team.desc,
            emoji: team.emoji
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('superlig_takim_sec')
            .setPlaceholder('⚽ Desteklediğin Süper Lig takımını seç...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 3. Components V2 Container
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

        await waitMsg.delete().catch(() => {});

        return message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    },
    SUPER_LIG_TEAMS
};
