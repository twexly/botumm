process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // SSL Hatası için eklemiştik

const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    AttachmentBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MessageFlags, 
    AuditLogEvent,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    UserSelectMenuBuilder,
    ActivityType
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont, loadImage } = require('canvas');
require('dotenv').config();

// Özel modern fontları yükle
try {
    const fontsDir = path.join(__dirname, 'assets', 'fonts');
    if (fs.existsSync(fontsDir)) {
        registerFont(path.join(fontsDir, 'Poppins-Bold.ttf'), { family: 'Poppins', weight: 'bold' });
        registerFont(path.join(fontsDir, 'Poppins-SemiBold.ttf'), { family: 'Poppins', weight: '600' });
        registerFont(path.join(fontsDir, 'Poppins-Medium.ttf'), { family: 'Poppins', weight: 'normal' });
    }
} catch (e) {}

// Süre formatlayıcı (Örn: 2 saat 15 dakika)
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const parts = [];
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0) parts.push(`${minutes} dakika`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} saniye`);
    return parts.join(' ');
}

// Denetim Kaydından (Audit Log) işlemi yapan yetkiliyi bulma
async function getAuditExecutor(guild, actionType, targetId = null) {
    try {
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: actionType });
        const firstEntry = fetchedLogs.entries.first();
        if (firstEntry && (!targetId || firstEntry.target?.id === targetId) && (Date.now() - firstEntry.createdTimestamp < 8000)) {
            return firstEntry.executor;
        }
    } catch (e) {}
    return null;
}

// --- UPTIME ROBOT WEB SUNUCUSU AYARI ---
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot 7/24 aktif olarak çalışıyor!');
});

app.listen(port, () => {
    console.log(`Web sunucusu ${port} portunda başarıyla başlatıldı.`);
});

// 1. ADIM: ÖNCE CLIENT TANIMLANIYOR
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration
    ] 
});

// 2. ADIM: SONRA DEĞİŞKENLER VE KOMUTLAR YÜKLENİYOR
client.commands = new Collection();
client.userStats = new Map();       
client.voiceSessions = new Map();   // Sesli oturum takibi
client.customVoiceRooms = new Map(); // Özel ses odaları takibi
client.xpCooldowns = new Map();     // XP kazanma bekleme süresi
client.ticketCooldowns = new Map(); // Ticket yetkili çağırma bekleme süresi
client.levelChannelId = null;       
client.welcomeChannelId = null;     
const dbPath = './database.json';
const configPath = './config.json';

client.serverConfig = {};
if (fs.existsSync(configPath)) {
    try {
        const rawConfig = JSON.parse(fs.readFileSync(configPath));
        client.serverConfig = rawConfig;
    } catch (e) {
        console.error("Config okunamadı:", e);
    }
}

// Sunucu bazlı config yardımcısı (Her sunucunun ayarları ayrı tutulur)
client.getGuildConfig = (guildId) => {
    if (!guildId) return {};
    if (!client.serverConfig[guildId]) {
        client.serverConfig[guildId] = {
            modLog: null,
            serverLog: null,
            levelChannel: null,
            welcomeChannel: null,
            welcomeTheme: 1,
            ticket: null,
            customVoiceCategory: null,
            customVoiceChannel: null,
            customVoicePanel: null,
            antiLink: false,
            modRole: null
        };
    }
    return client.serverConfig[guildId];
};

client.saveConfig = () => {
    fs.writeFileSync(configPath, JSON.stringify(client.serverConfig, null, 2));
};

// Yetkili / Moderatör Kontrolü (Sunucu Sahibi, Administrator veya Sunucunun Ayarlanan Yetkili Rolü)
client.isModerator = (member) => {
    if (!member) return false;
    if (member.id === member.guild?.ownerId) return true;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    const guildConfig = client.getGuildConfig(member.guild?.id);
    const modRoleId = guildConfig?.modRole;
    if (modRoleId && member.roles?.cache?.has(modRoleId)) return true;
    return false;
};

// Veritabanını Yükle
if (fs.existsSync(dbPath)) {
    try {
        const rawData = fs.readFileSync(dbPath);
        const parsedData = JSON.parse(rawData);
        for (const [key, value] of Object.entries(parsedData)) {
            client.userStats.set(key, value);
        }
    } catch (e) {
        console.error("Veritabanı okunamadı!", e);
    }
}

// Veritabanını Kaydetme Fonksiyonu
client.saveDatabase = () => {
    const obj = Object.fromEntries(client.userStats);
    fs.writeFileSync(dbPath, JSON.stringify(obj, null, 2));
};

// Komutları commands klasöründen okuma
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    if (command.aliases && Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
            client.commands.set(alias, command);
        }
    }
}

// Bot Aktif Olduğunda
client.once('ready', () => {
    console.log(`Bot aktif edildi: ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: '.yardım', type: ActivityType.Custom, state: '.yardım' }],
        status: 'online'
    });

    // Halihazırda ses kanalında bulunan üyelerin oturumlarını başlat
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.filter(c => c.isVoiceBased()).forEach(channel => {
            channel.members.filter(m => !m.user.bot).forEach(member => {
                if (!client.voiceSessions.has(member.id)) {
                    client.voiceSessions.set(member.id, Date.now());
                }
            });
        });
    });
});

// SESLİ KANAL TAKİBİ, ÖZEL ODA VE LOG
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.member?.user?.bot) return;
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const userId = newState.member?.id;
    const guildConfig = client.getGuildConfig(guild.id);

    // --- ÖZEL ODA (JOIN-TO-CREATE) SİSTEMİ ---
    if (guildConfig.customVoiceChannel && newState.channelId === guildConfig.customVoiceChannel) {
        try {
            const categoryId = guildConfig.customVoiceCategory;
            const userRoom = await guild.channels.create({
                name: `${newState.member.displayName} Odası`,
                type: ChannelType.GuildVoice,
                parent: categoryId || undefined,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: newState.member.id,
                        allow: [
                            PermissionFlagsBits.Connect,
                            PermissionFlagsBits.Speak,
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.ManageChannels
                        ]
                    }
                ]
            });

            client.customVoiceRooms.set(userRoom.id, {
                ownerId: newState.member.id,
                channelId: userRoom.id,
                lock: false
            });

            await newState.setChannel(userRoom);
        } catch (err) {
            console.error("Özel oda oluşturma hatası:", err);
        }
    }

    // --- BOŞALAN ÖZEL ODALARI OTOMATİK SİLME ---
    if (oldState.channelId && client.customVoiceRooms.has(oldState.channelId)) {
        const customChannel = guild.channels.cache.get(oldState.channelId);
        if (customChannel && customChannel.members.size === 0) {
            client.customVoiceRooms.delete(oldState.channelId);
            customChannel.delete().catch(() => {});
        }
    }

    // Kanala giriş
    if (!oldState.channelId && newState.channelId) {
        client.voiceSessions.set(userId, Date.now());
        sendLog(guild, 'Sesli Kanala Katıldı', [
            `**Kullanıcı:** ${newState.member.user} (\`${newState.member.user.tag}\` - \`${userId}\`)`,
            `**Katıldığı Kanal:** ${newState.channel} (\`${newState.channel.name}\`)`
        ]);
    } 
    // Kanaldan çıkış
    else if (oldState.channelId && !newState.channelId) {
        const joinTime = client.voiceSessions.get(userId);
        let durationText = 'Bilinmiyor';
        if (joinTime) {
            const duration = Date.now() - joinTime;
            const stats = client.userStats.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };
            stats.voiceTime = (stats.voiceTime || 0) + duration;
            client.userStats.set(userId, stats);
            client.saveDatabase();
            client.voiceSessions.delete(userId);
            durationText = formatDuration(duration);
        }
        sendLog(guild, 'Sesli Kanaldan Ayrıldı', [
            `**Kullanıcı:** ${oldState.member.user} (\`${oldState.member.user.tag}\` - \`${userId}\`)`,
            `**Ayrıldığı Kanal:** \`${oldState.channel.name}\``,
            `**Seste Kalma Süresi:** \`${durationText}\``
        ]);
    }
    // Kanal değiştirme
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        sendLog(guild, 'Sesli Kanal Değiştirdi', [
            `**Kullanıcı:** ${newState.member.user} (\`${newState.member.user.tag}\` - \`${userId}\`)`,
            `**Eski Kanal:** \`${oldState.channel.name}\``,
            `**Yeni Kanal:** ${newState.channel} (\`${newState.channel.name}\`)`
        ]);
    }
});

// LOG YARDIMCI FONKSİYONU (SUNUCU BAZLI & RENKSİZ FORMAT)
async function sendLog(guild, title, fields = []) {
    if (!guild) return;
    const guildConfig = client.getGuildConfig(guild.id);
    if (!guildConfig || !guildConfig.serverLog) return;
    const logChannel = guild.channels.cache.get(guildConfig.serverLog);
    if (!logChannel) return;

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const lines = Array.isArray(fields) ? [...fields] : [fields];
        lines.push(`**İşlem Zamanı:** <t:${timestamp}:F> (<t:${timestamp}:R>)`);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${title}`),
                new TextDisplayBuilder().setContent(lines.join('\n'))
            );
        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (e) {
        console.error("Log gönderme hatası:", e);
    }
}

// DİĞER DETAYLI LOG EVENTLERİ (SUNUCU BAZLI)
client.on('messageDelete', async message => {
    if (message.author?.bot || !message.guild) return;
    const executor = await getAuditExecutor(message.guild, AuditLogEvent.MessageDelete, message.author?.id);
    sendLog(message.guild, 'Mesaj Silindi', [
        `**Mesaj Sahibi:** ${message.author} (\`${message.author?.tag}\` - \`${message.author?.id}\`)`,
        `**Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Kullanıcının Kendisi / Bilinmiyor'}`,
        `**Kanal:** ${message.channel} (\`${message.channel?.name}\`)`,
        `**Silinen İçerik:**\n> ${message.content || '[İçerik Yok Veya Medya]'}`
    ]);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author?.bot || !newMessage.guild || oldMessage.content === newMessage.content) return;
    sendLog(newMessage.guild, 'Mesaj Düzenlendi', [
        `**Mesaj Sahibi:** ${newMessage.author} (\`${newMessage.author?.tag}\` - \`${newMessage.author?.id}\`)`,
        `**Kanal:** ${newMessage.channel} (\`${newMessage.channel?.name}\`)`,
        `**Mesaj Bağlantısı:** [Mesaja Git](${newMessage.url})`,
        `**Eski İçerik:**\n> ${oldMessage.content || '[Yok]'}`,
        `**Yeni İçerik:**\n> ${newMessage.content || '[Yok]'}`
    ]);
});

client.on('guildMemberAdd', member => {
    if (!member.guild) return;
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    sendLog(member.guild, 'Sunucuya Yeni Üye Katıldı', [
        `**Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
        `**Hesap Oluşturulma:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
        `**Güncel Sunucu Üye Sayısı:** \`${member.guild.memberCount}\``
    ]);
});

client.on('guildMemberRemove', async member => {
    if (!member.guild) return;
    const kickExecutor = await getAuditExecutor(member.guild, AuditLogEvent.MemberKick, member.id);
    const joinedTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    
    if (kickExecutor) {
        sendLog(member.guild, 'Üye Sunucudan Atıldı (Kick)', [
            `**Atılan Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
            `**Atan Yetkili:** ${kickExecutor} (\`${kickExecutor.tag}\`)`,
            `**Kalan Üye Sayısı:** \`${member.guild.memberCount}\``
        ]);
    } else {
        sendLog(member.guild, 'Üye Sunucudan Ayrıldı', [
            `**Ayrılan Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
            `**Sunucuya Katıldığı Tarih:** ${joinedTimestamp ? `<t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)` : 'Bilinmiyor'}`,
            `**Kalan Üye Sayısı:** \`${member.guild.memberCount}\``
        ]);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!newMember.guild) return;
    // Rol Değişikliği Takibi
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        const executor = await getAuditExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);

        if (addedRoles.size > 0) {
            sendLog(newMember.guild, 'Kullanıcıya Rol Verildi', [
                `**Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
                `**Rolü Veren:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor / Sistem'}`,
                `**Verilen Rol(ler):** ${addedRoles.map(r => `${r} (\`${r.name}\`)`).join(', ')}`
            ]);
        }
        if (removedRoles.size > 0) {
            sendLog(newMember.guild, 'Kullanıcıdan Rol Alındı', [
                `**Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
                `**Rolü Alan:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor / Sistem'}`,
                `**Alınan Rol(ler):** ${removedRoles.map(r => `${r} (\`${r.name}\`)`).join(', ')}`
            ]);
        }
    }

    // İsim Değişikliği Takibi
    if (oldMember.nickname !== newMember.nickname) {
        const executor = await getAuditExecutor(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);
        sendLog(newMember.guild, 'İsim (Nickname) Güncellendi', [
            `**Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
            `**Değiştiren:** ${executor ? `${executor} (\`${executor.tag}\`)` : `${newMember.user} (Kendisi)`}`,
            `**Eski İsim:** \`${oldMember.nickname || oldMember.user.username}\``,
            `**Yeni İsim:** \`${newMember.nickname || newMember.user.username}\``
        ]);
    }
});

client.on('guildBanAdd', async ban => {
    if (!ban.guild) return;
    const executor = await getAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    sendLog(ban.guild, 'Kullanıcı Sunucudan Yasaklandı (Ban)', [
        `**Yasaklanan Kullanıcı:** ${ban.user} (\`${ban.user.tag}\` - \`${ban.user.id}\`)`,
        `**Yasaklayan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `**Ban Sebebi:** \`${ban.reason || 'Sebep belirtilmedi.'}\``
    ]);
});

client.on('guildBanRemove', async ban => {
    if (!ban.guild) return;
    const executor = await getAuditExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    sendLog(ban.guild, 'Kullanıcının Yasağı Kaldırıldı (Unban)', [
        `**Yasağı Açılan:** ${ban.user} (\`${ban.user.tag}\` - \`${ban.user.id}\`)`,
        `**Yasağı Kaldıran Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`
    ]);
});

client.on('channelCreate', async channel => {
    if (!channel.guild) return;
    const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    sendLog(channel.guild, 'Yeni Kanal Oluşturuldu', [
        `**Kanal:** ${channel} (\`${channel.name}\` - \`${channel.id}\`)`,
        `**Oluşturan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `**Kategori:** \`${channel.parent ? channel.parent.name : 'Kategori Yok'}\``,
        `**Kanal Türü:** \`${channel.type}\``
    ]);
});

client.on('channelDelete', async channel => {
    if (!channel.guild) return;
    const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    sendLog(channel.guild, 'Kanal Silindi', [
        `**Silinen Kanal:** \`${channel.name}\` (\`${channel.id}\`)`,
        `**Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `**Bulunduğu Kategori:** \`${channel.parent ? channel.parent.name : 'Yok'}\``
    ]);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!newChannel.guild) return;
    if (oldChannel.name !== newChannel.name) {
        const executor = await getAuditExecutor(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);
        sendLog(newChannel.guild, 'Kanal Adı Güncellendi', [
            `**Kanal:** ${newChannel} (\`${newChannel.id}\`)`,
            `**Güncelleyen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
            `**Eski Kanal Adı:** \`${oldChannel.name}\``,
            `**Yeni Kanal Adı:** \`${newChannel.name}\``
        ]);
    }
});

client.on('roleCreate', async role => {
    if (!role.guild) return;
    const executor = await getAuditExecutor(role.guild, AuditLogEvent.RoleCreate, role.id);
    sendLog(role.guild, 'Yeni Rol Oluşturuldu', [
        `**Rol:** ${role} (\`${role.name}\` - \`${role.id}\`)`,
        `**Oluşturan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `**Renk Kodu:** \`${role.hexColor}\``
    ]);
});

client.on('roleDelete', async role => {
    if (!role.guild) return;
    const executor = await getAuditExecutor(role.guild, AuditLogEvent.RoleDelete, role.id);
    sendLog(role.guild, 'Rol Silindi', [
        `**Silinen Rol:** \`${role.name}\` (\`${role.id}\`)`,
        `**Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`
    ]);
});

// 3. ADIM: MESAJ DİNLENİYOR (KOMUTLAR VE XP SİSTEMİ)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildConfig = client.getGuildConfig(message.guild.id);

    // --- REKLAM / LİNK KORUMASI ---
    if (guildConfig.antiLink && !client.isModerator(message.member)) {
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9.-]+\.[a-z]{2,}\b)/i;
        if (linkRegex.test(message.content)) {
            try {
                await message.delete();
                await message.member.timeout(60 * 1000, "Link/Reklam gönderimi yasak!"); // 1 dakika timeout
                const replyMsg = await message.channel.send(`${message.author}, bu sunucuda link paylaşmak yasaktır! (1 Dakika Susturuldun)`);
                setTimeout(() => replyMsg.delete().catch(() => {}), 10000); // Uyarıyı 10 saniye sonra sil
                sendLog(message.guild, 'Reklam / Link Engellendi', [
                    `**Kullanıcı:** ${message.author} (\`${message.author.tag}\` - \`${message.author.id}\`)`,
                    `**Kanal:** ${message.channel} (\`${message.channel.name}\`)`,
                    `**Uygulanan Ceza:** \`1 Dakika Zaman Aşımı (Timeout)\``,
                    `**Engellenen Mesaj:**\n> ${message.content}`
                ]);
            } catch (err) {
                console.error("Link koruma hatası:", err);
            }
            return; // Eğer link atıldıysa işlemi durdur, level veya komut verme
        }
    }
    // --- OTOMATİK SELAM YANITI ---
    const lowerContent = message.content.toLowerCase();
    const greetings = ['sa', 'selam', 'selamun aleyküm', 'selamın aleyküm', 'sea', 's.a', 'selamlar'];
    if (greetings.includes(lowerContent)) {
        message.reply("Aleyküm Selam, Hoşgeldin.");
    }

    if (message.content.startsWith('!') || message.content.startsWith('.')) {
        const prefix = message.content[0];
        const rawContent = message.content.slice(1).trim();
        if (!rawContent) return; // Sadece "!" veya "." yazıldıysa işlem yapma

        const args = rawContent.split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) {
            // Bilinmeyen / Eksik yazılan komut için bilgilendirme mesajı
            const reply = await message.reply(`**${prefix}${commandName}** adında bir komut bulunamadı.\nKullanabileceğin komutlar: \`${prefix}rank\`, \`${prefix}toplevel\`, \`${prefix}ship\`, \`${prefix}ai\`, \`${prefix}adminrole\` vb.`);
            setTimeout(() => reply.delete().catch(() => {}), 6000);
            return;
        }

        // Yetki kontrolü (Sunucu Sahibi, Administrator veya Yetkili Rolü)
        if (command.modOnly) {
            if (!client.isModerator(message.member)) {
                const reply = await message.reply("Bu komutu kullanmak için gerekli moderatör rolüne veya yetkisine sahip değilsin.");
                setTimeout(() => reply.delete().catch(() => {}), 6000);
                return;
            }
            // Mod Log (Sunucu Bazlı)
            if (guildConfig.modLog) {
                const modLog = message.guild.channels.cache.get(guildConfig.modLog);
                if (modLog) {
                    const timestamp = Math.floor(Date.now() / 1000);
                    const container = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('## Moderatör Komut İşlemi'),
                            new TextDisplayBuilder().setContent(
                                `**Yetkili:** ${message.author} (\`${message.author.tag}\` - \`${message.author.id}\`)\n` +
                                `**Kanal:** ${message.channel} (\`${message.channel.name}\`)\n` +
                                `**Kullanılan Komut:** \`${message.content}\`\n` +
                                `**Zaman:** <t:${timestamp}:F> (<t:${timestamp}:R>)`
                            )
                        );
                    modLog.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                }
            }
        }
        return command.execute(message, client, args);
    }

    // --- GELİŞMİŞ LEVEL / XP SİSTEMİ ---
    const userId = message.author.id;
    const stats = client.userStats.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };
    stats.messages = (stats.messages || 0) + 1;

    // XP Kazanımı (Kullanıcı başına 45 saniye bekleme süresi - Spam koruması)
    const now = Date.now();
    const lastXP = client.xpCooldowns.get(userId) || 0;

    if (now - lastXP > 45000) {
        client.xpCooldowns.set(userId, now);
        const xpToAdd = Math.floor(Math.random() * 11) + 15; // 15-25 XP
        stats.xp = (stats.xp || 0) + xpToAdd;
    }

    // Seviye Atlama Formülü: (level * 150 + 50) XP gerekir
    const getNeededXP = (lvl) => lvl * 150 + 50;

    let leveledUp = false;
    while (stats.xp >= getNeededXP(stats.level)) {
        stats.xp -= getNeededXP(stats.level);
        stats.level = (stats.level || 1) + 1;
        leveledUp = true;
    }

    if (leveledUp) {
        const targetChannel = (guildConfig.levelChannel && message.guild.channels.cache.get(guildConfig.levelChannel)) || message.channel;
        if (targetChannel) {
            try {
                // --- 900x260 YÜKSEK KALİTELİ NEON LEVEL-UP KARTI ---
                const canvas = createCanvas(900, 260);
                const ctx = canvas.getContext('2d');

                // 1. Şeffaf Köşeler
                drawRoundRect(ctx, 0, 0, 900, 260, 28);
                ctx.clip();

                // 2. Arka Plan Gradyanı
                const bgGrad = ctx.createLinearGradient(0, 0, 900, 260);
                bgGrad.addColorStop(0, '#150921');
                bgGrad.addColorStop(0.5, '#260f3d');
                bgGrad.addColorStop(1, '#0e0517');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(0, 0, 900, 260);

                // Işık Efektleri
                ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
                ctx.beginPath(); ctx.arc(130, 130, 90, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = 'rgba(155, 89, 182, 0.15)';
                ctx.beginPath(); ctx.arc(750, 130, 100, 0, Math.PI*2); ctx.fill();

                // Dış İnce Çerçeve
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
                ctx.lineWidth = 3;
                drawRoundRect(ctx, 2, 2, 896, 256, 26);
                ctx.stroke();

                // 3. Avatar
                const avX = 130, avY = 130, avRadius = 65;
                try {
                    const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 256 });
                    const avatar = await loadImage(avatarURL);
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avX, avY, avRadius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(avatar, avX - avRadius, avY - avRadius, avRadius * 2, avRadius * 2);
                    ctx.restore();
                } catch (e) {}

                // Avatar Glow & Halka
                ctx.beginPath();
                ctx.arc(avX, avY, avRadius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
                ctx.lineWidth = 8;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(avX, avY, avRadius + 2, 0, Math.PI * 2);
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 4;
                ctx.stroke();

                // 4. Tebrik Metinleri
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';

                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = '#f1c40f';
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 10;
                ctx.fillText('TEBRİKLER! (SEVİYE ATLADIN)', 230, 85);
                ctx.shadowBlur = 0;

                ctx.font = 'bold 36px sans-serif';
                ctx.fillStyle = '#ffffff';
                const userDisplay = message.member?.displayName || message.author.globalName || message.author.username;
                let fittedUser = userDisplay;
                while (ctx.measureText(fittedUser).width > 380 && fittedUser.length > 3) {
                    fittedUser = fittedUser.slice(0, -1);
                }
                if (fittedUser !== userDisplay) fittedUser += '...';
                ctx.fillText(fittedUser, 230, 135);

                ctx.font = '19px sans-serif';
                ctx.fillStyle = '#c4b5fd';
                ctx.fillText('Harika gidiyorsun! Yeni seviyene ulaştın.', 230, 180);

                // 5. Sağ Bölüm: Dev Seviye Rozeti
                const badgeX = 740;
                const badgeY = 130;

                drawRoundRect(ctx, badgeX - 85, badgeY - 75, 170, 150, 24);
                ctx.fillStyle = 'rgba(241, 196, 15, 0.12)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(241, 196, 15, 0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = '#e2e8f0';
                ctx.fillText('YENI SEVIYE', badgeX, badgeY - 30);

                ctx.font = 'bold 64px sans-serif';
                ctx.fillStyle = '#f1c40f';
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 16;
                ctx.fillText(stats.level.toString(), badgeX, badgeY + 42);
                ctx.shadowBlur = 0;

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'level-up.png' });

                await targetChannel.send({ 
                    content: `${message.author} yeni bir seviyeye ulaştı. **(Seviye ${stats.level})**`, 
                    files: [attachment] 
                });
            } catch (err) {
                console.error("Level up canvas hatası:", err);
            }
        }
    }

    client.userStats.set(userId, stats);
    client.saveDatabase();
});

// --- YENİ EKLENEN: KARŞILAMA (WELCOME) SİSTEMİ ---
function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

client.on('guildMemberAdd', async (member) => {
    if (!member.guild) return;
    const guildConfig = client.getGuildConfig(member.guild.id);
    if (!guildConfig.welcomeChannel) return;
    const channel = member.guild.channels.cache.get(guildConfig.welcomeChannel);
    if (!channel) return;

    try {
        const canvas = createCanvas(1024, 250);
        const ctx = canvas.getContext('2d');

        const themeId = guildConfig.welcomeTheme || 1;
        const themeConfigs = {
            1: {
                bgFile: 'welcome_bg_1.png',
                glowColor: 'rgba(167, 139, 250, 0.4)',
                ringColor: '#c084fc',
                badgeBg: 'rgba(192, 132, 252, 0.2)',
                badgeBorder: 'rgba(192, 132, 252, 0.45)',
                badgeText: '#d8b4fe'
            },
            2: {
                bgFile: 'welcome_bg_2.png',
                glowColor: 'rgba(56, 189, 248, 0.4)',
                ringColor: '#38bdf8',
                badgeBg: 'rgba(56, 189, 248, 0.2)',
                badgeBorder: 'rgba(56, 189, 248, 0.45)',
                badgeText: '#7dd3fc'
            },
            3: {
                bgFile: 'welcome_bg_3.png',
                glowColor: 'rgba(251, 191, 36, 0.4)',
                ringColor: '#fbbf24',
                badgeBg: 'rgba(244, 63, 94, 0.2)',
                badgeBorder: 'rgba(251, 191, 36, 0.45)',
                badgeText: '#fde68a'
            }
        };
        const currentTheme = themeConfigs[themeId] || themeConfigs[1];

        // 1. Arka Plan Görseli
        const bgPngPath = path.join(__dirname, 'assets', currentTheme.bgFile);
        if (fs.existsSync(bgPngPath)) {
            const bgImage = await loadImage(fs.readFileSync(bgPngPath));
            ctx.drawImage(bgImage, 0, 0, 1024, 250);
        } else {
            // Şeffaf kırpma
            drawRoundRect(ctx, 0, 0, 1024, 250, 24);
            ctx.clip();
            const bgGrad = ctx.createLinearGradient(0, 0, 1024, 250);
            bgGrad.addColorStop(0, '#0a0a0f');
            bgGrad.addColorStop(1, '#14141e');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, 1024, 250);
        }

        // 2. Avatar Çizimi ve Neon Glow Halka
        const avSize = 144;
        const avX = 58;
        const avY = 53;

        // Dış Glow Halkası
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = currentTheme.glowColor;
        ctx.lineWidth = 6;
        ctx.stroke();

        // İç İnce Halka
        ctx.beginPath();
        ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 2, 0, Math.PI * 2);
        ctx.strokeStyle = currentTheme.ringColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Avatar Görseli
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        try {
            const avatar = await loadImage(avatarURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avX, avY, avSize, avSize);
            ctx.restore();
        } catch (e) {
            console.error("Avatar yükleme hatası:", e);
        }

        // 3. Sağ Üst Üye Sayısı Rozeti (Cam Efektli Pill Badge)
        const memberCount = member.guild.memberCount;
        const badgeText = `${memberCount}. ÜYE`;
        ctx.font = 'bold 16px "Poppins", "Segoe UI", "Arial", sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const badgePadX = 22;
        const badgeWidth = textWidth + badgePadX * 2;
        const badgeHeight = 38;
        const badgeX = 1024 - badgeWidth - 36;
        const badgeY = 28;
        const badgeRadius = 19;

        drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
        ctx.fillStyle = 'rgba(18, 16, 38, 0.65)';
        ctx.fill();
        ctx.strokeStyle = currentTheme.badgeBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#e9d5ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

        // 4. Şık Tipografi ve İsim Alanı
        const textStartX = 240;

        // "HOŞ GELDİN" Rozeti
        const welcomeTag = "HOŞ GELDİN";
        ctx.font = 'bold 12px "Poppins", "Segoe UI", "Arial", sans-serif';
        const tagWidth = ctx.measureText(welcomeTag).width + 20;
        drawRoundRect(ctx, textStartX, 60, tagWidth, 24, 12);
        ctx.fillStyle = currentTheme.badgeBg;
        ctx.fill();
        ctx.strokeStyle = currentTheme.badgeBorder;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = currentTheme.badgeText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(welcomeTag, textStartX + tagWidth / 2, 72);

        // Ana İsim (Display Name - Gölgeli ve Modern)
        const displayName = member.displayName || member.user.globalName || member.user.username;
        const maxTextWidth = badgeX - textStartX - 20;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 40px "Poppins", "Segoe UI", "Arial", sans-serif';
        let fittedName = displayName;
        while (ctx.measureText(fittedName).width > maxTextWidth && fittedName.length > 3) {
            fittedName = fittedName.slice(0, -1);
        }
        if (fittedName !== displayName) fittedName += '...';

        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(fittedName, textStartX, 136);
        ctx.shadowColor = 'transparent';

        // Kullanıcı Adı (@username)
        ctx.font = '600 20px "Poppins", "Segoe UI", "Arial", sans-serif';
        ctx.fillStyle = '#94a3b8';
        const username = `@${member.user.username}`;
        ctx.fillText(username, textStartX, 174);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'welcome.png' });
        
        // Üye sayısını boşluklu yazdırma formatı
        const countStr = memberCount.toString().split('').join(' '); 

        await channel.send({
            content: `> ${member.user} Sunucuya katıldı. Seninle birlikte **${countStr}** kişi olduk.`,
            files: [attachment]
        });

    } catch (err) {
        console.error("Welcome resmi oluşturulurken hata:", err);
    }
});

// --- ÖZEL ODA VE KARŞILAMA ETKİLEŞİM YÖNETİCİSİ (BUTONLAR, MODALLAR VE SEÇİM MENÜLERİ) ---
client.on('interactionCreate', async (interaction) => {
    // 0. KARŞILAMA TEMA SEÇİMİ BUTONLARI
    if (interaction.isButton() && interaction.customId.startsWith('welcome_theme_')) {
        if (!interaction.guild) return;
        if (!client.isModerator(interaction.member)) {
            return interaction.reply({ content: 'Bu ayarı sadece sunucu yetkilileri değiştirebilir.', flags: MessageFlags.Ephemeral });
        }

        const themeNum = parseInt(interaction.customId.replace('welcome_theme_', '')) || 1;
        const guildConfig = client.getGuildConfig(interaction.guild.id);
        guildConfig.welcomeTheme = themeNum;
        client.saveConfig();

        const themeNames = {
            1: 'Gece Sakurası (Mor & Lila Teması)',
            2: 'Siber Gece Mavisi (Neon Mavi Teması)',
            3: 'Kızıl Akşam & Altın (Amber Teması)'
        };

        const channelMention = guildConfig.welcomeChannel ? `<#${guildConfig.welcomeChannel}>` : 'Belirtilmedi';

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('welcome_theme_1')
                .setLabel('Tema 1')
                .setStyle(themeNum === 1 ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welcome_theme_2')
                .setLabel('Tema 2')
                .setStyle(themeNum === 2 ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('welcome_theme_3')
                .setLabel('Tema 3')
                .setStyle(themeNum === 3 ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        const content = `## Karşılama Sistemi Aktif Edildi\n` +
            `Karşılama kanalı: ${channelMention}\n\n` +
            `Aşağıdaki mavi numaralara tıklayarak tema önizleme görsellerine bakabilir, beğendiğiniz temayı butonlardan seçebilirsiniz:\n\n` +
            `• **[1](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_1.png)** — Gece Sakurası (Mor & Lila Teması)\n` +
            `• **[2](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_2.png)** — Siber Gece Mavisi (Neon Mavi Teması)\n` +
            `• **[3](https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_theme_3.png)** — Kızıl Akşam & Altın (Amber Teması)\n\n` +
            `Karşılama arka planı başarıyla **Tema ${themeNum} — ${themeNames[themeNum]}** olarak ayarlandı.`;

        await interaction.update({ content, components: [row] });
        return;
    }

    // --- TICKET SİSTEMİ ETKİLEŞİMLERİ ---
    if (interaction.isButton() && interaction.customId === 'ticket_create') {
        if (!interaction.guild) return;
        const guildConfig = client.getGuildConfig(interaction.guild.id);
        const ticketCfg = guildConfig.ticket;

        if (!ticketCfg || !ticketCfg.categoryId || !ticketCfg.roleId) {
            return interaction.reply({
                content: 'Bu sunucuda ticket sistemi henüz tam olarak yapılandırılmamış.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Kullanıcının halihazırda bu kategoride açık bileti var mı kontrol et (Spam önleme)
        const existingTicket = interaction.guild.channels.cache.find(c => 
            c.parentId === ticketCfg.categoryId && 
            c.topic?.includes(interaction.user.id)
        );

        if (existingTicket) {
            return interaction.reply({
                content: `Zaten aktif bir destek talebiniz bulunuyor: ${existingTicket}`,
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            const safeUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'talep';
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${safeUsername}`,
                type: ChannelType.GuildText,
                parent: ticketCfg.categoryId,
                topic: `Ticket Sahibi: ${interaction.user.id} (${interaction.user.tag})`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: ticketCfg.roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels
                        ]
                    }
                ]
            });

            const ticketContainer = new ContainerBuilder();
            const ticketSection = new SectionBuilder();
            ticketSection.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${ticketCfg.ticketTitle || 'Destek Talebi'} — #${safeUsername}`),
                new TextDisplayBuilder().setContent(
                    `${ticketCfg.ticketWelcome || 'Hoş geldiniz! Lütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın. Yetkili ekibimiz en kısa sürede sizinle ilgilenecektir.'}\n\n` +
                    `> **Kullanıcı:** ${interaction.user}\n` +
                    `> **Yetkili Ekip:** <@&${ticketCfg.roleId}>`
                )
            );
            if (ticketCfg.thumbnail) {
                ticketSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(ticketCfg.thumbnail));
            }
            ticketContainer.addSectionComponents(ticketSection);

            if (ticketCfg.banner) {
                ticketContainer.addSeparatorComponents(new SeparatorBuilder());
                const media = new MediaGalleryBuilder().addItems([{ media: { url: ticketCfg.banner } }]);
                ticketContainer.addMediaGalleryComponents(media);
            }

            ticketContainer.addSeparatorComponents(new SeparatorBuilder());

            const controlRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Talebi Kapat')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_transcript')
                    .setLabel('Transkript Al')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ticket_ping_staff')
                    .setLabel('Yetkili Çağır')
                    .setStyle(ButtonStyle.Primary)
            );
            ticketContainer.addActionRowComponents(controlRow);

            await ticketChannel.send({
                content: `${interaction.user} <@&${ticketCfg.roleId}>`,
                components: [ticketContainer],
                flags: MessageFlags.IsComponentsV2
            });

            await interaction.reply({
                content: `Destek talebiniz başarıyla oluşturuldu: ${ticketChannel}`,
                flags: MessageFlags.Ephemeral
            });

        } catch (err) {
            console.error("Ticket kanalı oluşturma hatası:", err);
            return interaction.reply({
                content: 'Destek kanalı oluşturulurken bir yetki hatası meydana geldi.',
                flags: MessageFlags.Ephemeral
            });
        }
        return;
    }

    // Talebi Kapat Butonu (Onay İster)
    if (interaction.isButton() && interaction.customId === 'ticket_close') {
        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close_confirm').setLabel('Evet, Kapat').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_close_cancel').setLabel('İptal').setStyle(ButtonStyle.Secondary)
        );
        return interaction.reply({
            content: 'Bu destek talebini kapatmak istediğinize emin misiniz? Kanal 5 saniye sonra kalıcı olarak silinecektir.',
            components: [confirmRow]
        });
    }

    // Kapatma İptal
    if (interaction.isButton() && interaction.customId === 'ticket_close_cancel') {
        return interaction.message.delete().catch(() => {});
    }

    // Kapatma Onaylandı
    if (interaction.isButton() && interaction.customId === 'ticket_close_confirm') {
        await interaction.reply({ content: 'Destek talebi kapatılıyor. Transkript hazırlanıyor ve kanal 5 saniye içinde silinecektir...' });

        const guildConfig = client.getGuildConfig(interaction.guild.id);
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const sorted = Array.from(messages.values()).reverse();
            let transcriptText = `--- DESTEK TALEBİ TRANSKRİPT: ${interaction.channel.name} ---\n`;
            transcriptText += `Tarih: ${new Date().toLocaleString('tr-TR')}\n`;
            transcriptText += `Kapatan: ${interaction.user.tag} (${interaction.user.id})\n\n`;

            sorted.forEach(m => {
                const time = new Date(m.createdTimestamp).toLocaleTimeString('tr-TR');
                transcriptText += `[${time}] ${m.author.tag}: ${m.content || '[Ek / Medya]'}\n`;
            });

            if (guildConfig.ticket?.logChannelId) {
                const logChan = interaction.guild.channels.cache.get(guildConfig.ticket.logChannelId);
                if (logChan) {
                    const transFile = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), { name: `transcript-${interaction.channel.name}.txt` });
                    const logContainer = new ContainerBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('# Destek Talebi Kapatıldı'),
                            new TextDisplayBuilder().setContent(
                                `• **Kanal:** \`${interaction.channel.name}\`\n` +
                                `• **Kapatan:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
                                `• **Kapanma Zamanı:** <t:${Math.floor(Date.now() / 1000)}:F>`
                            )
                        );

                    await logChan.send({ 
                        components: [logContainer], 
                        files: [transFile],
                        flags: MessageFlags.IsComponentsV2
                    });
                }
            }
        } catch (e) {
            console.error("Transkript alma hatası:", e);
        }

        setTimeout(() => {
            interaction.channel.delete().catch(() => {});
        }, 5000);
        return;
    }

    // Transkript Al Butonu
    if (interaction.isButton() && interaction.customId === 'ticket_transcript') {
        await interaction.deferReply();
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const sorted = Array.from(messages.values()).reverse();
            let transcriptText = `--- DESTEK TALEBİ TRANSKRİPT: ${interaction.channel.name} ---\n`;
            transcriptText += `Tarih: ${new Date().toLocaleString('tr-TR')}\n\n`;

            sorted.forEach(m => {
                const time = new Date(m.createdTimestamp).toLocaleTimeString('tr-TR');
                transcriptText += `[${time}] ${m.author.tag}: ${m.content || '[Ek / Medya]'}\n`;
            });

            const transFile = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), { name: `transcript-${interaction.channel.name}.txt` });
            await interaction.editReply({ content: 'Sohbet transkripti başarıyla oluşturuldu:', files: [transFile] });
        } catch (e) {
            console.error("Transkript oluşturma hatası:", e);
            await interaction.editReply({ content: 'Transkript oluşturulurken bir hata meydana geldi.' });
        }
        return;
    }

    // Yetkili Çağır Butonu
    if (interaction.isButton() && interaction.customId === 'ticket_ping_staff') {
        const cooldownKey = `staff_ping_${interaction.channel.id}`;
        const lastPing = client.ticketCooldowns.get(cooldownKey) || 0;
        if (Date.now() - lastPing < 300000) { // 5 dakika bekleme süresi
            const remainingSec = Math.ceil((300000 - (Date.now() - lastPing)) / 1000);
            return interaction.reply({
                content: `Yetkilileri tekrar çağırabilmek için lütfen **${remainingSec} saniye** bekleyin.`,
                flags: MessageFlags.Ephemeral
            });
        }
        client.ticketCooldowns.set(cooldownKey, Date.now());
        const guildConfig = client.getGuildConfig(interaction.guild.id);
        const roleMention = guildConfig.ticket?.roleId ? `<@&${guildConfig.ticket.roleId}>` : '@yetkili';
        await interaction.reply({ content: `🔔 ${interaction.user} destek ekibini çağırdı! ${roleMention}` });
        return;
    }

    // 1. ÖZEL ODA BUTON ETKİLEŞİMLERİ
    if (interaction.isButton() && interaction.customId.startsWith('ozeloda_')) {
        const userVoiceChannelId = interaction.member?.voice?.channelId;
        const room = userVoiceChannelId ? client.customVoiceRooms.get(userVoiceChannelId) : null;

        if (!room || room.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: 'Bu işlemi gerçekleştirmek için sana ait olan bir özel ses kanalının içinde olmalısın.',
                flags: MessageFlags.Ephemeral
            });
        }

        const voiceChannel = interaction.guild.channels.cache.get(room.channelId);
        if (!voiceChannel) {
            return interaction.reply({ content: 'Özel ses odası bulunamadı.', flags: MessageFlags.Ephemeral });
        }

        // İsim Değiştir Modal
        if (interaction.customId === 'ozeloda_rename') {
            const modal = new ModalBuilder()
                .setCustomId('ozeloda_modal_rename')
                .setTitle('Oda İsmini Değiştir');

            const nameInput = new TextInputBuilder()
                .setCustomId('room_name')
                .setLabel('Yeni Oda İsmi')
                .setStyle(TextInputStyle.Short)
                .setValue(voiceChannel.name)
                .setMaxLength(32)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
            return interaction.showModal(modal);
        }

        // Kişi Limiti Modal
        if (interaction.customId === 'ozeloda_limit') {
            const modal = new ModalBuilder()
                .setCustomId('ozeloda_modal_limit')
                .setTitle('Kişi Limitini Ayarla');

            const limitInput = new TextInputBuilder()
                .setCustomId('room_limit')
                .setLabel('Kişi Limiti (0 = Limitsiz, Max: 99)')
                .setStyle(TextInputStyle.Short)
                .setValue(voiceChannel.userLimit.toString())
                .setMaxLength(2)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
            return interaction.showModal(modal);
        }

        // Oda Kilitle / Aç
        if (interaction.customId === 'ozeloda_lock') {
            const currentLock = room.lock || false;
            const newLock = !currentLock;
            room.lock = newLock;

            await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
                Connect: newLock ? false : null
            });

            return interaction.reply({
                content: newLock ? 'Özel odanız kilitlendi. İzin verilmeyen kullanıcılar giremez.' : 'Özel odanızın kilidi açıldı. Artık herkes katılabilir.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Kullanıcı At Menüsü
        if (interaction.customId === 'ozeloda_kick') {
            const select = new UserSelectMenuBuilder()
                .setCustomId('ozeloda_select_kick')
                .setPlaceholder('Odadan çıkartılacak kullanıcıyı seçin...')
                .setMaxValues(1);

            return interaction.reply({
                content: 'Lütfen odadan çıkartmak istediğiniz kullanıcıyı seçin:',
                components: [new ActionRowBuilder().addComponents(select)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Erişim Ver Menüsü
        if (interaction.customId === 'ozeloda_allow') {
            const select = new UserSelectMenuBuilder()
                .setCustomId('ozeloda_select_allow')
                .setPlaceholder('Giriş izni verilecek kullanıcıyı seçin...')
                .setMaxValues(1);

            return interaction.reply({
                content: 'Lütfen odaya giriş izni vermek istediğiniz kullanıcıyı seçin:',
                components: [new ActionRowBuilder().addComponents(select)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Erişim Kaldır Menüsü
        if (interaction.customId === 'ozeloda_deny') {
            const select = new UserSelectMenuBuilder()
                .setCustomId('ozeloda_select_deny')
                .setPlaceholder('Giriş izni kaldırılacak kullanıcıyı seçin...')
                .setMaxValues(1);

            return interaction.reply({
                content: 'Lütfen giriş iznini kaldırmak istediğiniz kullanıcıyı seçin:',
                components: [new ActionRowBuilder().addComponents(select)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Sahiplik Devret Menüsü
        if (interaction.customId === 'ozeloda_transfer') {
            const select = new UserSelectMenuBuilder()
                .setCustomId('ozeloda_select_transfer')
                .setPlaceholder('Oda sahipliğini devretmek istediğiniz kullanıcıyı seçin...')
                .setMaxValues(1);

            return interaction.reply({
                content: 'Lütfen oda sahipliğini devretmek istediğiniz kullanıcıyı seçin:',
                components: [new ActionRowBuilder().addComponents(select)],
                flags: MessageFlags.Ephemeral
            });
        }

        // Odayı Kapat
        if (interaction.customId === 'ozeloda_delete') {
            client.customVoiceRooms.delete(room.channelId);
            await voiceChannel.delete().catch(() => {});
            return interaction.reply({
                content: 'Özel ses odanız başarıyla silindi.',
                flags: MessageFlags.Ephemeral
            });
        }
    }

    // 2. MODAL YANITLARI
    if (interaction.isModalSubmit()) {
        const userVoiceChannelId = interaction.member?.voice?.channelId;
        const room = userVoiceChannelId ? client.customVoiceRooms.get(userVoiceChannelId) : null;

        if (!room || room.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: 'Bu işlemi gerçekleştirmek için sana ait bir özel odada olmalısın.',
                flags: MessageFlags.Ephemeral
            });
        }

        const voiceChannel = interaction.guild.channels.cache.get(room.channelId);
        if (!voiceChannel) {
            return interaction.reply({ content: 'Özel ses odası bulunamadı.', flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'ozeloda_modal_rename') {
            const newName = interaction.fields.getTextInputValue('room_name');
            await voiceChannel.setName(newName);
            return interaction.reply({ content: `Oda ismi **${newName}** olarak güncellendi.`, flags: MessageFlags.Ephemeral });
        }

        if (interaction.customId === 'ozeloda_modal_limit') {
            const limitStr = interaction.fields.getTextInputValue('room_limit');
            const limit = parseInt(limitStr);
            if (isNaN(limit) || limit < 0 || limit > 99) {
                return interaction.reply({ content: 'Lütfen 0 ile 99 arasında bir sayı girin.', flags: MessageFlags.Ephemeral });
            }
            await voiceChannel.setUserLimit(limit);
            return interaction.reply({ content: `Oda limiti **${limit === 0 ? 'Limitsiz' : limit}** olarak ayarlandı.`, flags: MessageFlags.Ephemeral });
        }
    }

    // 3. USER SELECT MENU YANITLARI
    if (interaction.isUserSelectMenu()) {
        const userVoiceChannelId = interaction.member?.voice?.channelId;
        const room = userVoiceChannelId ? client.customVoiceRooms.get(userVoiceChannelId) : null;

        if (!room || room.ownerId !== interaction.user.id) {
            return interaction.reply({
                content: 'Bu işlemi gerçekleştirmek için sana ait bir özel odada olmalısın.',
                flags: MessageFlags.Ephemeral
            });
        }

        const voiceChannel = interaction.guild.channels.cache.get(room.channelId);
        if (!voiceChannel) {
            return interaction.reply({ content: 'Özel ses odası bulunamadı.', flags: MessageFlags.Ephemeral });
        }

        const targetUserId = interaction.values[0];

        if (interaction.customId === 'ozeloda_select_kick') {
            const targetMember = voiceChannel.members.get(targetUserId);
            if (targetMember) await targetMember.voice.disconnect().catch(() => {});
            await voiceChannel.permissionOverwrites.edit(targetUserId, { Connect: false });
            return interaction.update({
                content: `<@${targetUserId}> kullanıcısı odadan atıldı ve girişi engellendi.`,
                components: []
            });
        }

        if (interaction.customId === 'ozeloda_select_allow') {
            await voiceChannel.permissionOverwrites.edit(targetUserId, { Connect: true, ViewChannel: true });
            return interaction.update({
                content: `<@${targetUserId}> kullanıcısına odaya giriş izni verildi.`,
                components: []
            });
        }

        if (interaction.customId === 'ozeloda_select_deny') {
            const targetMember = voiceChannel.members.get(targetUserId);
            if (targetMember) await targetMember.voice.disconnect().catch(() => {});
            await voiceChannel.permissionOverwrites.edit(targetUserId, { Connect: false });
            return interaction.update({
                content: `<@${targetUserId}> kullanıcısının odaya giriş izni kaldırıldı.`,
                components: []
            });
        }

        if (interaction.customId === 'ozeloda_select_transfer') {
            room.ownerId = targetUserId;
            await voiceChannel.permissionOverwrites.edit(targetUserId, {
                Connect: true,
                Speak: true,
                ViewChannel: true,
                MoveMembers: true,
                MuteMembers: true,
                DeafenMembers: true,
                ManageChannels: true
            });
            return interaction.update({
                content: `Oda sahipliği başarıyla <@${targetUserId}> kullanıcısına devredildi.`,
                components: []
            });
        }
    }
});

// Bot Girişi
client.login(process.env.DISCORD_TOKEN);
