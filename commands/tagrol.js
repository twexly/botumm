const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags, 
    PermissionFlagsBits, 
    EmbedBuilder 
} = require('discord.js');
const emojis = require('../emojis');

/**
 * Bir üyenin kullanıcı adında, görünen adında veya sunucu takma adında tag olup olmadığını kontrol eder.
 */
function hasTag(member, tag) {
    if (!member || !tag) return false;
    const cleanTag = tag.trim().toLowerCase();
    const user = member.user;

    // 1. Kullanıcı adı (Örn: ahmet✦)
    if (user?.username && user.username.toLowerCase().includes(cleanTag)) return true;
    // 2. Global Görünen Ad (Örn: Ahmet ✦)
    if (user?.globalName && user.globalName.toLowerCase().includes(cleanTag)) return true;
    // 3. Sunucu İçi Takma Ad (Nickname) (Örn: ✦ Ahmet)
    if (member.nickname && member.nickname.toLowerCase().includes(cleanTag)) return true;
    // 4. member.displayName
    if (member.displayName && member.displayName.toLowerCase().includes(cleanTag)) return true;

    return false;
}

/**
 * Tek bir üyenin tag rolünü kontrol edip gerekiyorsa rolü verir veya alır.
 */
async function handleMemberTagRole(member, client) {
    if (!member || !member.guild || member.user?.bot) return;

    const guildConfig = client.getGuildConfig(member.guild.id);
    if (!guildConfig?.tagRole) return;

    const { tag, roleId, logChannelId } = guildConfig.tagRole;
    if (!tag || !roleId) return;

    const botMember = member.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return;

    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId).catch(() => null);
    if (!role) return;

    // Botun rolü yetersizse işlem yapma
    if (botMember.roles.highest.position <= role.position) return;

    const userHasTag = hasTag(member, tag);
    const memberHasRole = member.roles.cache.has(roleId);

    // Tagı var ama rolü yok -> Rolü ver
    if (userHasTag && !memberHasRole) {
        try {
            await member.roles.add(role, `Tag (${tag}) eklendiği için otomatik tag rolü verildi.`);
            if (logChannelId) {
                const logCh = member.guild.channels.cache.get(logChannelId);
                if (logCh) {
                    await logCh.send({
                        content: `🎉 ${member} kullanıcısı ismine **\`${tag}\`** tagını ekledi ve ${role} rolü verildi!`
                    }).catch(() => {});
                }
            }
        } catch (e) {
            console.error(`Tag rolü verme hatası (${member.user.tag}):`, e.message);
        }
    } 
    // Tagı çıkarmış ama rolü var -> Rolü geri al
    else if (!userHasTag && memberHasRole) {
        try {
            await member.roles.remove(role, `Tag (${tag}) çıkarıldığı için tag rolü geri alındı.`);
            if (logChannelId) {
                const logCh = member.guild.channels.cache.get(logChannelId);
                if (logCh) {
                    await logCh.send({
                        content: `⚠️ ${member} kullanıcısı isminden **\`${tag}\`** tagını kaldırdığı için ${role} rolü geri alındı.`
                    }).catch(() => {});
                }
            }
        } catch (e) {
            console.error(`Tag rolü alma hatası (${member.user.tag}):`, e.message);
        }
    }
}

/**
 * Sunucudaki tüm üyeleri tarayarak tagı olanlara rol verir, olmayanlardan alır.
 */
async function scanGuildMembers(guild, client) {
    const guildConfig = client.getGuildConfig(guild.id);
    if (!guildConfig?.tagRole) return null;

    const { tag, roleId } = guildConfig.tagRole;
    if (!tag || !roleId) return null;

    const botMember = guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        throw new Error('Botun **Rolleri Yönet** yetkisi bulunmuyor.');
    }

    const role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
    if (!role) throw new Error('Tag rolü sunucuda bulunamadı.');

    if (botMember.roles.highest.position <= role.position) {
        throw new Error(`Botun en yüksek rolü (${botMember.roles.highest.name}), tag rolünün (${role.name}) altında! Bot rolünü üste taşıyın.`);
    }

    await guild.members.fetch().catch(() => {});
    const members = guild.members.cache.filter(m => !m.user.bot);

    let tagCount = 0;
    let addedCount = 0;
    let removedCount = 0;

    for (const member of members.values()) {
        const userHasTag = hasTag(member, tag);
        const memberHasRole = member.roles.cache.has(roleId);

        if (userHasTag) {
            tagCount++;
            if (!memberHasRole) {
                const ok = await member.roles.add(role, 'Toplu tag taraması ile verildi').then(() => true).catch(() => false);
                if (ok) addedCount++;
                await new Promise(r => setTimeout(r, 120)); // Rate-limit koruması
            }
        } else if (memberHasRole) {
            const ok = await member.roles.remove(role, 'Toplu tag taraması (tag yok)').then(() => true).catch(() => false);
            if (ok) removedCount++;
            await new Promise(r => setTimeout(r, 120)); // Rate-limit koruması
        }
    }

    return {
        total: members.size,
        tagCount,
        addedCount,
        removedCount
    };
}

module.exports = {
    name: 'tagrol',
    aliases: ['tag-rol', 'tagrole', 'tag-role', 'tag'],
    modOnly: true,
    description: 'Sunucu tagı alan üyeleri tespit edip otomatik rol verir ve çıkarınca rolü alır.',
    hasTag,
    handleMemberTagRole,
    scanGuildMembers,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        const botMember = message.guild.members.me;
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({
                content: `${emojis.cross} Botun rol verebilmesi ve alabilmesi için **Rolleri Yönet (Manage Roles)** yetkisine ihtiyacı vardır.`
            });
        }

        const guildConfig = client.getGuildConfig(message.guild.id);

        // 1. SIFIRLA / SİL / KALDIR SEÇENEĞİ
        if (args && args.length > 0 && ['sıfırla', 'sifirla', 'kapat', 'sil', 'reset', 'delete'].includes(args[0].toLowerCase())) {
            if (!guildConfig.tagRole) {
                return message.reply('⚠️ Bu sunucuda zaten ayarlanmış bir tag rol sistemi bulunmuyor.');
            }

            delete guildConfig.tagRole;
            client.saveConfig();

            const resetContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('# 🗑️ Tag Rol Sistemi Sıfırlandı'),
                    new TextDisplayBuilder().setContent(
                        `Tag rol sistemi başarıyla devre dışı bırakıldı ve sunucu ayarlarından kaldırıldı.\n\n` +
                        `• Tekrar açmak için: \`.tagrol <tag> @rol\` kullanabilirsiniz.`
                    )
                );

            return message.reply({ components: [resetContainer], flags: MessageFlags.IsComponentsV2 });
        }

        // 2. TARA / DAĞIT SEÇENEĞİ (.tagrol tara)
        if (args && args.length > 0 && ['tara', 'dağıt', 'dagit', 'sync', 'scan'].includes(args[0].toLowerCase())) {
            if (!guildConfig.tagRole) {
                return message.reply('⚠️ Henüz bir tag rol sistemi kurulmamış! Önce kurmak için: `.tagrol <tag> @rol`');
            }

            const waitMsg = await message.reply('⏳ Sunucudaki tüm üyeler taranıyor ve roller eşitleniyor, lütfen bekleyin...');
            try {
                const results = await scanGuildMembers(message.guild, client);
                const role = message.guild.roles.cache.get(guildConfig.tagRole.roleId);

                const scanContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🔄 Tag Tarama ve Dağıtım Tamamlandı!'),
                        new TextDisplayBuilder().setContent(
                            `Tüm sunucu üyeleri kontrol edildi ve tag rolleri eşitlendi:\n\n` +
                            `• **Hedef Tag:** \`${guildConfig.tagRole.tag}\`\n` +
                            `• **Hedef Rol:** ${role || 'Bilinmiyor'}\n` +
                            `• **Taranan Toplam Üye:** \`${results.total}\`\n` +
                            `• **Tagı Bulunan Üye:** \`${results.tagCount}\`\n` +
                            `• **Yeni Rol Verilen:** \`+${results.addedCount}\`\n` +
                            `• **Rolü Geri Alınan:** \`-${results.removedCount}\`\n\n` +
                            `> *Artık tagı alanlara anında otomatik rol verilecek, çıkaranlardan ise otomatik alınacaktır!*`
                        )
                    );

                return waitMsg.edit({ content: null, components: [scanContainer], flags: MessageFlags.IsComponentsV2 });
            } catch (err) {
                console.error('Tag tara hatası:', err);
                return waitMsg.edit(`❌ Tarama sırasında bir hata oluştu: ${err.message}`);
            }
        }

        // 3. PARAMETRESİZ ÇAĞRILDIĞINDA DURUMU GÖSTER
        if (!args || args.length === 0) {
            if (guildConfig.tagRole) {
                const { tag, roleId, logChannelId } = guildConfig.tagRole;
                const role = message.guild.roles.cache.get(roleId);
                const logCh = logChannelId ? message.guild.channels.cache.get(logChannelId) : null;

                // Cache'teki taglı üyeleri say
                const tagCount = message.guild.members.cache.filter(m => !m.user.bot && hasTag(m, tag)).size;

                const statusContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🏷️ Tag Rol Sistemi Durumu'),
                        new TextDisplayBuilder().setContent(
                            `Bu sunucuda aktif bir tag rol sistemi bulunmaktadır:\n\n` +
                            `• **Sunucu Tagı:** \`${tag}\`\n` +
                            `• **Verilecek Rol:** ${role || 'Rol bulunamadı!'}\n` +
                            `• **Log Kanalı:** ${logCh ? `${logCh}` : '*Ayarlanmadı*'}\n` +
                            `• **Şu An Taglı Üye Sayısı:** \`${tagCount}\` üye\n\n` +
                            `> *Kullanıcılar ismine veya durumuna **\`${tag}\`** eklediğinde otomatik rol verilir, çıkardığında ise rol geri alınır.*`
                        )
                    )
                    .addSeparatorComponents(new SeparatorBuilder());

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('tagrol_scan_btn')
                        .setLabel('Üyeleri Tara & Rolleri Dağıt')
                        .setEmoji('🔄')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('tagrol_reset_btn')
                        .setLabel('Sistemi Sıfırla')
                        .setEmoji('🗑️')
                        .setStyle(ButtonStyle.Danger)
                );
                statusContainer.addActionRowComponents(row);

                return message.reply({ components: [statusContainer], flags: MessageFlags.IsComponentsV2 });
            } else {
                const infoContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('# 🏷️ Tag Rol Sistemi Kurulumu'),
                        new TextDisplayBuilder().setContent(
                            `Sunucunuzun tagını (sembolünü veya kelimesini) ismine ekleyen üyelere otomatik rol verip, tagı çıkaranlardan otomatik alan gelişmiş sistem.\n\n` +
                            `### 📖 Kurulum Formatı:\n` +
                            `• **\`.tagrol <tag> @rol\`** veya **\`.tagrol @rol <tag>\`**\n\n` +
                            `### 💡 Örnek Kullanımlar:\n` +
                            `• \`.tagrol ✦ @Taglı\`\n` +
                            `• \`.tagrol Lotus @LotusEkibi\`\n` +
                            `• \`.tagrol [TW] @Ailesi\`\n\n` +
                            `### ⚙️ Ek Komutlar:\n` +
                            `• **\`.tagrol tara\`** : Mevcut tüm üyeleri tarar ve tagı olanlara rolü dağıtır.\n` +
                            `• **\`.tagrol sıfırla\`** : Tag rol sistemini kapatır ve ayarları siler.`
                        )
                    );

                return message.reply({ components: [infoContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }

        // 4. KURULUM PARAMETRELERİNİ ÇÖZÜMLE
        // Rolü tespit et (Mention veya ID veya İsim)
        let targetRole = message.mentions.roles.first();
        let targetTag = null;

        if (targetRole) {
            // Mention kullanılmış, kalan argümanlar tag'dir
            const roleMentionStr = `<@&${targetRole.id}>`;
            const remaining = args.filter(a => a !== roleMentionStr && a !== `<@!&${targetRole.id}>` && a !== targetRole.id);
            if (remaining.length > 0) {
                targetTag = remaining.join(' ').trim();
            }
        } else {
            // Mention yok, argümanlardan biri rol ID'si veya rol adı olabilir
            for (let i = 0; i < args.length; i++) {
                const cleanId = args[i].replace(/[<@&>]/g, '').trim();
                const foundRole = message.guild.roles.cache.get(cleanId) || 
                    message.guild.roles.cache.find(r => r.name.toLowerCase() === cleanId.toLowerCase());
                if (foundRole) {
                    targetRole = foundRole;
                    const remaining = args.slice();
                    remaining.splice(i, 1);
                    if (remaining.length > 0) {
                        targetTag = remaining.join(' ').trim();
                    }
                    break;
                }
            }
        }

        // Eğer mevcut ayarlı tag veya rol varsa ve sadece biri verilmişse tamamla
        if (!targetTag && guildConfig.tagRole?.tag && targetRole) {
            targetTag = guildConfig.tagRole.tag;
        } else if (!targetRole && guildConfig.tagRole?.roleId && args.length > 0) {
            targetTag = args.join(' ').trim();
            targetRole = message.guild.roles.cache.get(guildConfig.tagRole.roleId);
        }

        if (!targetRole || !targetTag) {
            return message.reply({
                content: `${emojis.cross} Lütfen hem tagı hem de verilecek rolü belirtin!\n\n` +
                    `${emojis.settings} **Doğru Kullanım:** \`.tagrol <tag> @rol\` (Örn: \`.tagrol ✦ @Taglı\`)`
            });
        }

        // Hiyerarşi kontrolü
        if (botMember.roles.highest.position <= targetRole.position) {
            return message.reply({
                content: `${emojis.cross} Botun en yüksek rolü (${botMember.roles.highest.name}), verilecek ${targetRole} rolünün altında!\n` +
                    `Lütfen Discord Sunucu Ayarları > Roller kısmından botun rolünü ${targetRole.name} rolünün üzerine taşıyın.`
            });
        }

        // Ayarları kaydet
        guildConfig.tagRole = {
            tag: targetTag,
            roleId: targetRole.id,
            logChannelId: guildConfig.tagRole?.logChannelId || null,
            updatedAt: Date.now()
        };
        client.saveConfig();

        // Kurulum onay kartı (Components V2)
        const setupContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('# ✅ Tag Rol Sistemi Başarıyla Kuruldu!'),
                new TextDisplayBuilder().setContent(
                    `Sunucu tagı ve otomatik verilecek rol tanımlandı:\n\n` +
                    `• **Belirlenen Tag:** \`${targetTag}\`\n` +
                    `• **Verilecek Rol:** ${targetRole}\n` +
                    `• **Çalışma Mantığı:** Üyeler ismine **\`${targetTag}\`** eklediğinde rol anında verilir; tagı sildiklerinde rol otomatik geri alınır.\n\n` +
                    `> *Mevcut sunucu üyelerini tarayıp isminde tag olanlara rolü hemen vermek için aşağıdaki **Üyeleri Tara & Dağıt** butonuna tıklayın!*`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder());

        const setupRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('tagrol_scan_btn')
                .setLabel('Şimdi Üyeleri Tara & Rolleri Dağıt')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('tagrol_reset_btn')
                .setLabel('Sistemi Sıfırla')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Secondary)
        );
        setupContainer.addActionRowComponents(setupRow);

        return message.reply({ components: [setupContainer], flags: MessageFlags.IsComponentsV2 });
    }
};

