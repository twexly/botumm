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

        // 1. Bilgilendirme / Bekleme Mesajı (Roller oluşturulmadan menü gönderilmez!)
        const waitMsg = await message.channel.send({
            content: `${emojis.settings} **Takım rolleri kontrol ediliyor ve hazırlanıyor, lütfen bekleyin...**\n*(5 büyük ligdeki toplam 91 takım kontrol edilmektedir. Bu işlem 1-2 dakika sürebilir)*`
        }).catch(() => null);

        // 2. TÜM ROLLERİ KONTROL ET VE OLUŞTUR (Menü gönderilmeden önce tamamlanır)
        try {
            const guildRoles = await message.guild.roles.fetch();

            for (const team of ALL_TEAMS) {
                const existingRole = guildRoles.find(r => r.name.toLowerCase() === team.name.toLowerCase());
                if (!existingRole) {
                    try {
                        const newRole = await message.guild.roles.create({
                            name: team.name,
                            color: team.color,
                            permissions: [], // Hiçbir yetki yok (Sıfır yetki)
                            hoist: false,
                            mentionable: false,
                            reason: 'Avrupa ve Süper Lig Takım Rol Sistemi'
                        });
                        guildRoles.set(newRole.id, newRole);
                        await new Promise(res => setTimeout(res, 1000)); // Discord rate-limit koruması
                    } catch (err) {
                        console.error(`Rol oluşturulamadı (${team.name}):`, err.message);
                    }
                } else if (existingRole.permissions.bitfield !== 0n) {
                    // Önceden kalan yetkileri sıfırla
                    await existingRole.setPermissions([], 'Takım rolü yetkileri sıfırlandı').catch(() => {});
                }
            }
        } catch (fetchErr) {
            console.error("Rol tarama hatası:", fetchErr);
        }

        // Roller tamamlandıktan sonra bekleme mesajını sil
        if (waitMsg) {
            await waitMsg.delete().catch(() => {});
        }

        // 3. Varsayılan Lig (Süper Lig) Menüsü
        const defaultLeague = LEAGUES.superlig;
        const options = defaultLeague.teams.map(team => ({
            label: team.name,
            value: team.id,
            description: team.desc,
            emoji: team.emoji
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('takimsec_menu_superlig')
            .setPlaceholder('Desteklediğin Süper Lig takımını seç...')
            .addOptions(options);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        // 4. Lig Seçim Butonları (Sadece kullanıcının eklediği özel emojiler)
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

        // 5. Components V2 Container (Yalnızca madde emojisi ve kullanıcının özel logoları)
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${emojis.superlig} Avrupa & Süper Lig Takım Seçim Paneli`),
                new TextDisplayBuilder().setContent(
                    `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir veya alttaki butonlardan istediğin lige tıklayarak diğer liglerin takımlarını görüntüleyebilirsin!\n\n` +
                    `${emojis.matter} **Varsayılan Lig:** ${emojis.superlig} **Süper Lig**\n` +
                    `${emojis.matter} Farklı bir lig seçmek için aşağıdaki lig butonlarına tıkla!\n` +
                    `${emojis.matter} Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                    `${emojis.matter} Başka bir takım seçersen eski takım rolün otomatik kaldırılır.\n` +
                    `${emojis.matter} Takımını istediğin zaman değiştirebilirsin.\n\n` +
                    `> *Tribündeki yerini al, takımını gururla temsil et!*`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(selectRow, leagueButtonsRow);

        // 6. Paneli Gönder (Çok Kademeli Güvenli Fallback)
        try {
            await message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        } catch (err) {
            console.error("Takım panel Components V2 gönderme hatası, klasik ActionRow deneniyor:", err);
            try {
                await message.channel.send({
                    content: `# ${emojis.superlig} Avrupa & Süper Lig Takım Seçim Paneli\n\n` +
                        `Aşağıdaki açılır menüyü kullanarak tuttuğun takımı seçebilir veya alttaki butonlardan istediğin lige tıklayarak diğer liglerin takımlarını görüntüleyebilirsin!\n\n` +
                        `${emojis.matter} **Varsayılan Lig:** ${emojis.superlig} **Süper Lig**\n` +
                        `${emojis.matter} Farklı bir lig seçmek için aşağıdaki lig butonlarına tıkla!\n` +
                        `${emojis.matter} Menüden takımını seçtiğinde bot otomatik olarak takım rolünü verir.\n` +
                        `${emojis.matter} Başka bir takım seçersen eski takım rolün otomatik kaldırılır.\n` +
                        `${emojis.matter} Takımını istediğin zaman değiştirebilirsin.\n\n` +
                        `> *Tribündeki yerini al, takımını gururla temsil et!*`,
                    components: [selectRow, leagueButtonsRow]
                });
            } catch (fallbackErr) {
                console.error("Takım panel fallback hatası:", fallbackErr);
            }
        }
    },
    LEAGUES,
    ALL_TEAMS
};
