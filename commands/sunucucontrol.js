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

// Kontrol Paneli Ana Menüsü
function getControlPanelMenu(guildName) {
    const content = `## 🎛️ Gelişmiş Sunucu Kontrol ve Yönetim Paneli\n` +
        `Sunucunuz (**${guildName}**) üzerinde otomasyon, toplu temizlik, kanal/rol yönetimi ve hızlı yapılandırma işlemlerini aşağıdaki menüden yönetebilirsiniz.\n\n` +
        `> ⚠️ *Dikkat: Silme ve sıfırlama işlemleri kalıcıdır, işlem yaparken dikkatli olun!*`;

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_btn_create_channels')
            .setLabel('Toplu Kanal Oluştur')
            .setEmoji('📁')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_create_roles')
            .setLabel('Toplu Rol Oluştur')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_rename_server')
            .setLabel('Sunucu Adını Değiştir')
            .setEmoji('✏️')
            .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_btn_delete_channels')
            .setLabel('Tüm Kanalları Sil')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_delete_roles')
            .setLabel('Yönetici Olmayan Rolleri Sil')
            .setEmoji('🔥')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_nuke_server')
            .setLabel('Hızlı Sunucu Sıfırla (Nuke)')
            .setEmoji('☢️')
            .setStyle(ButtonStyle.Danger)
    );

    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('scontrol_btn_stats')
            .setLabel('Sunucu İstatistikleri')
            .setEmoji('📊')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_lockdown')
            .setLabel('Sunucu Kilidi (Lockdown)')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('scontrol_btn_unlockdown')
            .setLabel('Kilidi Kaldır')
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Secondary)
    );

    return { content, components: [row1, row2, row3] };
}

module.exports = {
    name: 'sunucucontrol',
    aliases: ['sunucuyonet', 'scontrol', 'sc'],
    modOnly: true,
    description: 'Kanal silme, toplu kanal/rol oluşturma, sunucu kilitleme ve sıfırlama gibi 10+ farklı yönetim aracı sunar.',
    getControlPanelMenu,

    async execute(message, client, args) {
        if (!message.guild) return;

        // Yetki kontrolü (Botun ve kullanıcının yetkileri)
        if (!client.isModerator(message.member) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({
                content: `${emojis.cross || '❌'} Bu komutu yalnızca **Yönetici** veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        const panel = getControlPanelMenu(message.guild.name);
        return message.reply(panel);
    },

    // Buton ve Etkileşim Yöneticisi (Interaction Handler - Botun ana interaction dinleyicisine entegre edilebilir)
    async handleInteraction(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId.startsWith('scontrol_')) {
            const action = interaction.customId.replace('scontrol_', '');

            // 1. Sunucu Adını Değiştirme Modalı
            if (action === 'btn_rename_server') {
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

            // 2. Toplu Kanal Oluşturma Modalı
            if (action === 'btn_create_channels') {
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

            // 3. Kanalları Silme İşlemi
            if (action === 'btn_delete_channels') {
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

            // 4. Rolleri Silme İşlemi (Yönetici ve bot rollerini korur)
            if (action === 'btn_delete_roles') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                    return interaction.reply({ content: '❌ Bu işlem için **Rolleri Yönet** yetkiniz olmalı.', ephemeral: true });
                }

                await interaction.update({ content: '🔥 Güvenli olmayan roller temizleniyor...', components: [] });

                let deletedRoles = 0;
                for (const [id, role] of interaction.guild.roles.cache) {
                    if (role.managed || role.position >= interaction.guild.members.me.roles.highest.position || role.permissions.has(PermissionFlagsBits.Administrator)) {
                        continue; // Bot rolleri, üst roller ve admin rollerini koru
                    }
                    try {
                        await role.delete();
                        deletedRoles++;
                    } catch (err) {
                        console.error(` Rol silinemedi (${role.name}):`, err);
                    }
                }

                return interaction.followUp({ content: `✅ Toplam **${deletedRoles}** standart rol başarıyla silindi!`, ephemeral: true });
            }

            // 5. Sunucu İstatistikleri
            if (action === 'btn_stats') {
                const guild = interaction.guild;
                const statsMsg = `📊 **Sunucu İstatistikleri — ${guild.name}**\n\n` +
                    `• **Toplam Üye:** ${guild.memberCount}\n` +
                    `• **Kanal Sayısı:** ${guild.channels.cache.size}\n` +
                    `• **Rol Sayısı:** ${guild.roles.cache.size}\n` +
                    `• **Boost Seviyesi:** ${guild.premiumTier} (${guild.premiumSubscriptionCount} Boost)\n` +
                    `• **Oluşturulma Tarihi:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
                
                return interaction.reply({ content: statsMsg, ephemeral: true });
            }

            // 6. Sunucu Kilidi (Lockdown - @everyone mesaj göndermesini kapatır)
            if (action === 'btn_lockdown' || action === 'btn_unlockdown') {
                const isLock = action === 'btn_lockdown';
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

            // 7. Hızlı Sunucu Sıfırlama (Nuke)
            if (action === 'btn_nuke_server') {
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

            if (action === 'confirm_nuke_yes') {
                await interaction.update({ content: '☢️ Sunucu sıfırlama işlemi başlatıldı...', components: [] });
                // Tüm kanalları sil
                for (const [id, channel] of interaction.guild.channels.cache) {
                    try { await channel.delete(); } catch (e) {}
                }
                // Varsayılan bir kanal aç
                const defaultChan = await interaction.guild.channels.create({
                    name: 'genel-sohbet',
                    type: ChannelType.GuildText
                });
                return defaultChan.send('🎉 Sunucu başarıyla sıfırlandı ve temizlendi!');
            }

            if (action === 'confirm_nuke_no') {
                return interaction.update({ content: '❌ İşlem iptal edildi.', components: [] });
            }
        }

        // Modal Gönderimleri (Form Verileri)
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
        }
    }
};
