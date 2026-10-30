const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');
const emojis = require('../emojis');

function getControlPanelMenu(guildName) {
    const content = `## 🎛️ Gelişmiş Sunucu Kontrol ve Yönetim Paneli — ${guildName}\n` +
        `Sunucunuz üzerinde otomasyon, toplu temizlik, kanal/rol yönetimi ve hızlı yapılandırma işlemlerini aşağıdaki menüden yönetebilirsiniz.\n\n` +
        `> ⚠️ *Dikkat: Silme ve sıfırlama işlemleri kalıcıdır, işlem yaparken dikkatli olun!*`;

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_create_channels')
            .setLabel('Toplu Kanal Oluştur')
            .setEmoji('📁')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('scontrol_create_roles')
            .setLabel('Toplu Rol Oluştur')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('scontrol_rename_server')
            .setLabel('Sunucu Adını Değiştir')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_delete_channels')
            .setLabel('Tüm Kanalları Sil')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('scontrol_delete_roles')
            .setLabel('Yönetici Olmayan Rolleri Sil')
            .setEmoji('🔥')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('scontrol_nuke_server')
            .setLabel('Hızlı Sunucu Sıfırla (Nuke)')
            .setEmoji('☢️')
            .setStyle(ButtonStyle.Danger)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_stats')
            .setLabel('Sunucu İstatistikleri')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('scontrol_lockdown')
            .setLabel('Sunucu Kilidi (Lockdown)')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('scontrol_unlockdown')
            .setLabel('Kilidi Kaldır')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Secondary)
    );

    return { content, components: [row1, row2, row3] };
}

module.exports = {
    name: 'sunucucontrol',
    aliases: ['sunucuyonet', 'scontrol', 'sc'],
    description: 'Kanal silme, toplu kanal/rol oluşturma ve sıfırlama araçları sunar.',
    getControlPanelMenu,

    // Botunun ana messageCreate dinleyicisinden doğrudan çağrılması için:
    async run(message, client, args) {
        if (!message.guild) return;

        // Yetki kontrolü (Yönetici değilse engelle)
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({
                content: `❌ Bu komutu sadece **Yönetici** yetkisine sahip kullanıcılar kullanabilir.`
            });
        }

        const menu = getControlPanelMenu(message.guild.name);
        return message.reply(menu);
    },

    // Butonlar ve Modal formlar için etkileşim yöneticisi
    async handleInteraction(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId.startsWith('scontrol_')) {
            const action = interaction.customId;

            if (action === 'scontrol_rename_server') {
                const modal = new ModalBuilder()
                    .setCustomId('scontrol_modal_rename')
                    .setTitle('Sunucu Adını Güncelle');

                const nameInput = new TextInputBuilder()
                    .setCustomId('server_new_name')
                    .setLabel('Yeni Sunucu Adı')
                    .setPlaceholder('Örn: Xen Roleplay | V2')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100);

                modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
                return await interaction.showModal(modal);
            }

            if (action === 'scontrol_create_channels') {
                const modal = new ModalBuilder()
                    .setCustomId('scontrol_modal_channels')
                    .setTitle('Toplu Kanal Oluşturucu');

                const prefixInput = new TextInputBuilder()
                    .setCustomId('channel_prefix_list')
                    .setLabel('Kanal İsimleri (Virgül ile ayırın)')
                    .setPlaceholder('duyurular, kurallar, genel-sohbet, destek-talebi')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(prefixInput));
                return await interaction.showModal(modal);
            }

            if (action === 'scontrol_create_roles') {
                const modal = new ModalBuilder()
                    .setCustomId('scontrol_modal_roles')
                    .setTitle('Toplu Rol Oluşturucu');

                const roleInput = new TextInputBuilder()
                    .setCustomId('role_name_list')
                    .setLabel('Rol İsimleri (Virgül ile ayırın)')
                    .setPlaceholder('Kurucu, Yönetici, Moderator, Üye')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(roleInput));
                return await interaction.showModal(modal);
            }

            if (action === 'scontrol_delete_channels') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.reply({ content: '❌ Bu işlem için **Kanalları Yönet** yetkiniz olmalı.', ephemeral: true });
                }

                await interaction.update({ content: '🗑️ Sunucudaki tüm kanallar siliniyor, lütfen bekleyin...', components: [] });
                
                let deletedCount = 0;
                for (const [id, channel] of interaction.guild.channels.cache) {
                    try {
                        await channel.delete();
                        deletedCount++;
                    } catch (err) {
                        console.error(`Kanal silinemedi (${channel.name}):`, err);
                    }
                }

                return interaction.followUp({ content: `✅ Başarıyla **${deletedCount}** kanal silindi!`, ephemeral: true });
            }

            if (action === 'scontrol_delete_roles') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return interaction.reply({ content: '❌ Bu işlem için **Rolleri Yönet** yetkiniz olmalı.', ephemeral: true });
                }

                await interaction.update({ content: '🔥 Güvenli olmayan roller temizleniyor...', components: [] });

                let deletedRoles = 0;
                for (const [id, role] of interaction.guild.roles.cache) {
                    if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position || role.permissions.has(PermissionFlagsBits.Administrator)) {
                        continue;
                    }
                    try {
                        await role.delete();
                        deletedRoles++;
                    } catch (err) {
                        console.error(`Rol silinemedi (${role.name}):`, err);
                    }
                }

                return interaction.followUp({ content: `✅ Toplam **${deletedRoles}** standart rol başarıyla silindi!`, ephemeral: true });
            }

            if (action === 'scontrol_stats') {
                const guild = interaction.guild;
                const statsMsg = `📊 **Sunucu İstatistikleri — ${guild.name}**\n\n` +
                    `• **Toplam Üye:** ${guild.memberCount}\n` +
                    `• **Kanal Sayısı:** ${guild.channels.cache.size}\n` +
                    `• **Rol Sayısı:** ${guild.roles.cache.size}\n` +
                    `• **Boost Seviyesi:** ${guild.premiumTier} (${guild.premiumSubscriptionCount} Boost)\n` +
                    `• **Oluşturulma Tarihi:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
                
                return interaction.reply({ content: statsMsg, ephemeral: true });
            }

            if (action === 'scontrol_lockdown' || action === 'scontrol_unlockdown') {
                const isLock = action === 'scontrol_lockdown';
                await interaction.update({ content: `⏳ Sunucu genel kanalları ${isLock ? 'kilitleniyor' : 'açılıyor'}...`, components: [] });

                let updatedChannels = 0;
                const everyoneRole = interaction.guild.roles.everyone;

                for (const [id, channel] of interaction.guild.channels.cache) {
                    if (channel.type === ChannelType.GuildText) {
                        try {
                            await channel.permissionOverwrites.edit(everyoneRole, {
                                SendMessages: isLock ? false : null
                            });
                            updatedChannels++;
                        } catch (err) {}
                    }
                }

                return interaction.followUp({ content: `✅ Sunucu başarıyla ${isLock ? 'kilitlendi 🔒' : 'açıldı 🔓'} (${updatedChannels} kanal güncellendi).`, ephemeral: true });
            }

            if (action === 'scontrol_nuke_server') {
                const confirmRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('scontrol_confirm_nuke_yes').setLabel('EVET, HER ŞEYİ SIFIRLA').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('scontrol_confirm_nuke_no').setLabel('İptal Et').setStyle(ButtonStyle.Secondary)
                );

                return interaction.reply({
                    content: `☢️ **DİKKAT:** Sunucudaki tüm kanalları silmek ve sıfırdan kurmak üzeresiniz! Bu işlem geri alınamaz. Emin misiniz?`,
                    components: [confirmRow],
                    ephemeral: true
                });
            }

            if (action === 'scontrol_confirm_nuke_yes') {
                await interaction.update({ content: '☢️ Sunucu sıfırlama işlemi başlatıldı...', components: [] });
                for (const [id, channel] of interaction.guild.channels.cache) {
                    try { await channel.delete(); } catch (e) {}
                }
                const defaultChan = await interaction.guild.channels.create({
                    name: 'genel-sohbet',
                    type: ChannelType.GuildText
                });
                return defaultChan.send('🎉 Sunucu başarıyla sıfırlandı ve temizlendi!');
            }

            if (action === 'scontrol_confirm_nuke_no') {
                return interaction.update({ content: '❌ İşlem iptal edildi.', components: [] });
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'scontrol_modal_rename') {
                const newName = interaction.fields.getTextInputValue('server_new_name');
                try {
                    await interaction.guild.setName(newName);
                    return interaction.reply({ content: `✅ Sunucu adı başarıyla **${newName}** olarak değiştirildi!`, ephemeral: true });
                } catch (err) {
                    return interaction.reply({ content: `❌ Sunucu adı değiştirilemedi: ${err.message}`, ephemeral: true });
                }
            }

            if (interaction.customId === 'scontrol_modal_channels') {
                const rawNames = interaction.fields.getTextInputValue('channel_prefix_list');
                const channelNames = rawNames.split(',').map(n => n.trim()).filter(n => n.length > 0);

                if (channelNames.length === 0) {
                    return interaction.reply({ content: '❌ Geçerli bir kanal ismi girilmedi.', ephemeral: true });
                }

                await interaction.reply({ content: `⏳ Toplam **${channelNames.length}** adet kanal oluşturuluyor...`, ephemeral: true });

                let createdCount = 0;
                for (const name of channelNames) {
                    try {
                        await interaction.guild.channels.create({
                            name: name,
                            type: ChannelType.GuildText
                        });
                        createdCount++;
                    } catch (err) {
                        console.error(`Kanal oluşturulamadı (${name}):`, err);
                    }
                }

                return interaction.followUp({ content: `✅ Toplam **${createdCount}/${channelNames.length}** kanal başarıyla oluşturuldu!`, ephemeral: true });
            }

            if (interaction.customId === 'scontrol_modal_roles') {
                const rawRoles = interaction.fields.getTextInputValue('role_name_list');
                const roleNames = rawRoles.split(',').map(n => n.trim()).filter(n => n.length > 0);

                if (roleNames.length === 0) {
                    return interaction.reply({ content: '❌ Geçerli bir rol ismi girilmedi.', ephemeral: true });
                }

                await interaction.reply({ content: `⏳ Toplam **${roleNames.length}** adet rol oluşturuluyor...`, ephemeral: true });

                let createdCount = 0;
                for (const roleName of roleNames) {
                    try {
                        await interaction.guild.roles.create({
                            name: roleName,
                            reason: 'Toplu rol oluşturma aracı ile eklendi.'
                        });
                        createdCount++;
                    } catch (err) {
                        console.error(`Rol oluşturulamadı (${roleName}):`, err);
                    }
                }

                return interaction.followUp({ content: `✅ Toplam **${createdCount}/${roleNames.length}** rol başarıyla oluşturuldu!`, ephemeral: true });
            }
        }
    }
};
