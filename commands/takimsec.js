const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    MessageFlags 
} = require('discord.js');
const emojis = require('../emojis');
const { LEAGUES, ALL_TEAMS } = require('../data/leagues');

module.exports = {
    name: 'takimsec',
    aliases: ['superlig', 'süperlig', 'takim', 'takım', 'takimlar', 'takımlar', 'ligler'],
    modOnly: true,
    description: 'Süper Lig ve Avrupa ligleri takım rollerini oluşturur ve interaktif lig/takım seçim panelini gönderir.',
    async execute(message, client) {
        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        // Komut mesajını temizle
        await message.delete().catch(() => {});

        // 1. Bilgilendirme Mesajı (Roller arka planda hazırlanırken kullanıcıyı bilgilendir)
        const statusMsg = await message.channel.send({
            content: `${emojis.settings} **Takım rolleri taranıyor ve hazırlanıyor...**\n*(5 büyük ligdeki toplam 91 takım rolü arka planda oluşturulmaktadır. Discord limitleri sebebiyle bu işlem 1-2 dakika sürebilir. Bu esnada aşağıdaki panelden seçim anında yapılabilir!)*`
        }).catch(() => null);

        // 2. Varsayılan Lig (Süper Lig) Menüsü
        const defaultLeague = LEAGUES.superlig;
        const options = defaultLeague.teams.map(team => ({
            label: team.name,
            value: team.id,
            description: team.desc,
            emoji: team.emoji
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('takimsec_menu_superlig')
            .setPlaceholder('⚽ Desteklediğin Süper Lig takımını seç...')
            .addOptions(options);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        // 3. Lig Seçim Butonları (5 Büyük Lig)
        const leagueButtonsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('takimsec_btn_superlig')
                .setLabel('Süper Lig')
                .setEmoji('1548051464310755460')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('takimsec_btn_premierleague')
                .setLabel('Premier League')
                .setEmoji('1548086673689288844')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('takimsec_btn_laliga')
                .setLabel('La Liga')
                .setEmoji('1548086645818007613')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('takimsec_btn_seriea')
                .setLabel('Serie A')
                .setEmoji('1548086699505094769')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('takimsec_btn_bundesliga')
                .setLabel('Bundesliga')
                .setEmoji('1548086595234828328')
                .setStyle(ButtonStyle.Secondary)
        );

        // 4. Components V2 Container
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# ⚽ Avrupa & Süper Lig Takım Seçim Paneli'),
                new TextDisplayBuilder().setContent(
                    `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir veya alttaki butonlardan istediğin lige tıklayarak diğer liglerin takımlarını görüntüleyebilirsin!\n\n` +
                    `${emojis.matter} **Varsayılan Lig:** ${emojis.superlig} **Süper Lig**\n` +
                    `• Farklı bir lig seçmek için aşağıdaki lig butonlarına tıkla!\n` +
                    `• Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                    `• Başka bir takım seçersen eski takım rolün otomatik kaldırılır.\n` +
                    `• Takımını istediğin zaman değiştirebilirsin.\n\n` +
                    `> *Tribündeki yerini al, takımını gururla temsil et!*`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(selectRow, leagueButtonsRow);

        // 5. Paneli Anında Gönder (Çok Kademeli Güvenli Fallback)
        try {
            await message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (err) {
            console.error("Takım panel Components V2 gönderme hatası, klasik ActionRow deneniyor:", err);
            try {
                await message.channel.send({
                    content: `# ⚽ Avrupa & Süper Lig Takım Seçim Paneli\n\n` +
                        `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir veya alttaki butonlardan istediğin lige tıklayarak diğer liglerin takımlarını görüntüleyebilirsin!\n\n` +
                        `${emojis.matter} **Varsayılan Lig:** ${emojis.superlig} **Süper Lig**\n` +
                        `• Farklı bir lig seçmek için aşağıdaki lig butonlarına tıkla!\n` +
                        `• Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                        `• Başka bir takım seçersen eski takım rolün otomatik kaldırılır.\n` +
                        `• Takımını istediğin zaman değiştirebilirsin.\n\n` +
                        `> *Tribündeki yerini al, takımını gururla temsil et!*`,
                    components: [selectRow, leagueButtonsRow]
                });
            } catch (fallbackErr) {
                console.error("Takım panel fallback hatası:", fallbackErr);
            }
        }

        // 6. Arka Planda Eksik Rolleri Güvenle ve Sessizce Oluştur (Kullanıcıyı asla bekletmez)
        (async () => {
            try {
                const guildRoles = await message.guild.roles.fetch().catch(() => null);
                if (!guildRoles) return;

                let createdCount = 0;
                for (const team of ALL_TEAMS) {
                    const existingRole = guildRoles.find(r => r.name.toLowerCase() === team.name.toLowerCase());
                    if (!existingRole) {
                        await message.guild.roles.create({
                            name: team.name,
                            color: team.color,
                            permissions: [], // Hiçbir yetki yok (Sıfır yetki)
                            hoist: false,
                            mentionable: false,
                            reason: 'Avrupa ve Süper Lig Takım Rol Sistemi'
                        }).catch(() => {});
                        createdCount++;
                        await new Promise(res => setTimeout(res, 1200)); // Discord rate-limit koruması
                    } else if (existingRole.permissions.bitfield !== 0n) {
                        // Eğer rolde önceden kalma herhangi bir yetki varsa temizle
                        await existingRole.setPermissions([], 'Takım rolü yetkileri sıfırlandı').catch(() => {});
                    }
                }

                if (statusMsg) {
                    await statusMsg.edit({
                        content: `${emojis.tick} **Tüm liglerdeki takım rolleri başarıyla kontrol edildi ve hazırlandı!** *(91 takım aktif)*`
                    }).catch(() => {});
                    setTimeout(() => statusMsg.delete().catch(() => {}), 15000);
                }
            } catch (e) {
                console.error("Arka plan rol oluşturma hatası:", e);
            }
        })();
    },
    LEAGUES,
    ALL_TEAMS
};
