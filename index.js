process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // SSL Hatası için eklemiştik

const { Client, GatewayIntentBits, Collection, AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const { createCanvas } = require('canvas');
require('dotenv').config();

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
    console.log(`🌐 Web sunucusu ${port} portunda başarıyla başlatıldı.`);
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
client.xpCooldowns = new Map();     // XP kazanma bekleme süresi
client.levelChannelId = null;       
client.welcomeChannelId = null;     
const dbPath = './database.json';
const configPath = './config.json';

client.serverConfig = { modLog: null, serverLog: null };
if (fs.existsSync(configPath)) {
    try {
        client.serverConfig = JSON.parse(fs.readFileSync(configPath));
        client.levelChannelId = client.serverConfig.levelChannel;
        client.welcomeChannelId = client.serverConfig.welcomeChannel;
    } catch (e) {
        console.error("Config okunamadı:", e);
    }
}

client.saveConfig = () => {
    client.serverConfig.levelChannel = client.levelChannelId;
    client.serverConfig.welcomeChannel = client.welcomeChannelId;
    fs.writeFileSync(configPath, JSON.stringify(client.serverConfig, null, 2));
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
}

// Bot Aktif Olduğunda
client.once('ready', () => {
    console.log(`🚀 Bot aktif edildi: ${client.user.tag}`);
});

// SESLİ KANAL TAKİBİ VE LOG
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) return;
    const userId = newState.member.id;

    // Kanala giriş
    if (!oldState.channelId && newState.channelId) {
        client.voiceSessions.set(userId, Date.now());
        sendLog(client, '🔊 Sesli Kanala Katıldı', [
            `👤 **Kullanıcı:** ${newState.member.user} (\`${newState.member.user.tag}\` - \`${userId}\`)`,
            `🔊 **Katıldığı Kanal:** ${newState.channel} (\`${newState.channel.name}\`)`
        ], 0x2ecc71);
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
        sendLog(client, '🔈 Sesli Kanaldan Ayrıldı', [
            `👤 **Kullanıcı:** ${oldState.member.user} (\`${oldState.member.user.tag}\` - \`${userId}\`)`,
            `🔈 **Ayrıldığı Kanal:** \`${oldState.channel.name}\``,
            `⏳ **Seste Kalma Süresi:** \`${durationText}\``
        ], 0xe74c3c);
    }
    // Kanal değiştirme
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        sendLog(client, '🔁 Sesli Kanal Değiştirdi', [
            `👤 **Kullanıcı:** ${newState.member.user} (\`${newState.member.user.tag}\` - \`${userId}\`)`,
            `🔴 **Eski Kanal:** \`${oldState.channel.name}\``,
            `🟢 **Yeni Kanal:** ${newState.channel} (\`${newState.channel.name}\`)`
        ], 0x3498db);
    }
});

// LOG YARDIMCI FONKSİYONU (V2 COMPONENTS & DETAYLI FORMAT)
async function sendLog(client, title, fields = [], color = 0x2b2d31) {
    if (!client.serverConfig || !client.serverConfig.serverLog) return;
    const logChannel = client.channels.cache.get(client.serverConfig.serverLog);
    if (!logChannel) return;

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const lines = Array.isArray(fields) ? [...fields] : [fields];
        lines.push(`⏰ **İşlem Zamanı:** <t:${timestamp}:F> (<t:${timestamp}:R>)`);

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${title}`),
                new TextDisplayBuilder().setContent(lines.join('\n'))
            );
        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (e) {
        console.error("Log gönderme hatası:", e);
    }
}

// DİĞER DETAYLI LOG EVENTLERİ
client.on('messageDelete', async message => {
    if (message.author?.bot) return;
    const executor = await getAuditExecutor(message.guild, AuditLogEvent.MessageDelete, message.author?.id);
    sendLog(client, '🗑️ Mesaj Silindi', [
        `👤 **Mesaj Sahibi:** ${message.author} (\`${message.author?.tag}\` - \`${message.author?.id}\`)`,
        `🛡️ **Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Kullanıcının Kendisi / Bilinmiyor'}`,
        `📁 **Kanal:** ${message.channel} (\`${message.channel?.name}\`)`,
        `💬 **Silinen İçerik:**\n> ${message.content || '[İçerik Yok Veya Medya]'}`
    ], 0xe74c3c);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    sendLog(client, '✏️ Mesaj Düzenlendi', [
        `👤 **Mesaj Sahibi:** ${newMessage.author} (\`${newMessage.author?.tag}\` - \`${newMessage.author?.id}\`)`,
        `📁 **Kanal:** ${newMessage.channel} (\`${newMessage.channel?.name}\`)`,
        `🔗 **Mesaj Bağlantısı:** [Mesaja Git](${newMessage.url})`,
        `🔴 **Eski İçerik:**\n> ${oldMessage.content || '[Yok]'}`,
        `🟢 **Yeni İçerik:**\n> ${newMessage.content || '[Yok]'}`
    ], 0xf1c40f);
});

client.on('guildMemberAdd', member => {
    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    sendLog(client, '📥 Sunucuya Yeni Üye Katıldı', [
        `👤 **Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
        `📅 **Hesap Oluşturulma:** <t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
        `👥 **Güncel Sunucu Üye Sayısı:** \`${member.guild.memberCount}\``
    ], 0x2ecc71);
});

client.on('guildMemberRemove', async member => {
    const kickExecutor = await getAuditExecutor(member.guild, AuditLogEvent.MemberKick, member.id);
    const joinedTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    
    if (kickExecutor) {
        sendLog(client, '🥾 Üye Sunucudan Atıldı (Kick)', [
            `👤 **Atılan Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
            `🛡️ **Atan Yetkili:** ${kickExecutor} (\`${kickExecutor.tag}\`)`,
            `👥 **Kalan Üye Sayısı:** \`${member.guild.memberCount}\``
        ], 0xe67e22);
    } else {
        sendLog(client, '🚪 Üye Sunucudan Ayrıldı', [
            `👤 **Ayrılan Kullanıcı:** ${member.user} (\`${member.user.tag}\` - \`${member.id}\`)`,
            `📅 **Sunucuya Katıldığı Tarih:** ${joinedTimestamp ? `<t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)` : 'Bilinmiyor'}`,
            `👥 **Kalan Üye Sayısı:** \`${member.guild.memberCount}\``
        ], 0xe74c3c);
    }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Rol Değişikliği Takibi
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        const executor = await getAuditExecutor(newMember.guild, AuditLogEvent.MemberRoleUpdate, newMember.id);

        if (addedRoles.size > 0) {
            sendLog(client, '🎭 Kullanıcıya Rol Verildi', [
                `👤 **Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
                `🛡️ **Rolü Veren:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor / Sistem'}`,
                `🟢 **Verilen Rol(ler):** ${addedRoles.map(r => `${r} (\`${r.name}\`)`).join(', ')}`
            ], 0x3498db);
        }
        if (removedRoles.size > 0) {
            sendLog(client, '🎭 Kullanıcıdan Rol Alındı', [
                `👤 **Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
                `🛡️ **Rolü Alan:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor / Sistem'}`,
                `🔴 **Alınan Rol(ler):** ${removedRoles.map(r => `${r} (\`${r.name}\`)`).join(', ')}`
            ], 0xe67e22);
        }
    }

    // İsim Değişikliği Takibi
    if (oldMember.nickname !== newMember.nickname) {
        const executor = await getAuditExecutor(newMember.guild, AuditLogEvent.MemberUpdate, newMember.id);
        sendLog(client, '📝 İsim (Nickname) Güncellendi', [
            `👤 **Kullanıcı:** ${newMember.user} (\`${newMember.user.tag}\` - \`${newMember.id}\`)`,
            `🛡️ **Değiştiren:** ${executor ? `${executor} (\`${executor.tag}\`)` : `${newMember.user} (Kendisi)`}`,
            `🔴 **Eski İsim:** \`${oldMember.nickname || oldMember.user.username}\``,
            `🟢 **Yeni İsim:** \`${newMember.nickname || newMember.user.username}\``
        ], 0x3498db);
    }
});

client.on('guildBanAdd', async ban => {
    const executor = await getAuditExecutor(ban.guild, AuditLogEvent.MemberBanAdd, ban.user.id);
    sendLog(client, '🔨 Kullanıcı Sunucudan Yasaklandı (Ban)', [
        `👤 **Yasaklanan Kullanıcı:** ${ban.user} (\`${ban.user.tag}\` - \`${ban.user.id}\`)`,
        `🛡️ **Yasaklayan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `📜 **Ban Sebebi:** \`${ban.reason || 'Sebep belirtilmedi.'}\``
    ], 0xe74c3c);
});

client.on('guildBanRemove', async ban => {
    const executor = await getAuditExecutor(ban.guild, AuditLogEvent.MemberBanRemove, ban.user.id);
    sendLog(client, '🔓 Kullanıcının Yasağı Kaldırıldı (Unban)', [
        `👤 **Yasağı Açılan:** ${ban.user} (\`${ban.user.tag}\` - \`${ban.user.id}\`)`,
        `🛡️ **Yasağı Kaldıran Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`
    ], 0x2ecc71);
});

client.on('channelCreate', async channel => {
    const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelCreate, channel.id);
    sendLog(client, '📁 Yeni Kanal Oluşturuldu', [
        `📁 **Kanal:** ${channel} (\`${channel.name}\` - \`${channel.id}\`)`,
        `🛡️ **Oluşturan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `📂 **Kategori:** \`${channel.parent ? channel.parent.name : 'Kategori Yok'}\``,
        `⚙️ **Kanal Türü:** \`${channel.type}\``
    ], 0x2ecc71);
});

client.on('channelDelete', async channel => {
    const executor = await getAuditExecutor(channel.guild, AuditLogEvent.ChannelDelete, channel.id);
    sendLog(client, '📁 Kanal Silindi', [
        `📁 **Silinen Kanal:** \`${channel.name}\` (\`${channel.id}\`)`,
        `🛡️ **Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `📂 **Bulunduğu Kategori:** \`${channel.parent ? channel.parent.name : 'Yok'}\``
    ], 0xe74c3c);
});

client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (oldChannel.name !== newChannel.name) {
        const executor = await getAuditExecutor(newChannel.guild, AuditLogEvent.ChannelUpdate, newChannel.id);
        sendLog(client, '📁 Kanal Adı Güncellendi', [
            `📁 **Kanal:** ${newChannel} (\`${newChannel.id}\`)`,
            `🛡️ **Güncelleyen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
            `🔴 **Eski Kanal Adı:** \`${oldChannel.name}\``,
            `🟢 **Yeni Kanal Adı:** \`${newChannel.name}\``
        ], 0xf1c40f);
    }
});

client.on('roleCreate', async role => {
    const executor = await getAuditExecutor(role.guild, AuditLogEvent.RoleCreate, role.id);
    sendLog(client, '🏷️ Yeni Rol Oluşturuldu', [
        `🏷️ **Rol:** ${role} (\`${role.name}\` - \`${role.id}\`)`,
        `🛡️ **Oluşturan Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`,
        `🎨 **Renk Kodu:** \`${role.hexColor}\``
    ], 0x2ecc71);
});

client.on('roleDelete', async role => {
    const executor = await getAuditExecutor(role.guild, AuditLogEvent.RoleDelete, role.id);
    sendLog(client, '🏷️ Rol Silindi', [
        `🏷️ **Silinen Rol:** \`${role.name}\` (\`${role.id}\`)`,
        `🛡️ **Silen Yetkili:** ${executor ? `${executor} (\`${executor.tag}\`)` : 'Bilinmiyor'}`
    ], 0xe74c3c);
});

// 3. ADIM: MESAJ DİNLENİYOR (KOMUTLAR VE XP SİSTEMİ)
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- REKLAM / LİNK KORUMASI ---
    if (client.serverConfig.antiLink && !message.member.roles.cache.has('1541337917467795478')) {
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9.-]+\.[a-z]{2,}\b)/i;
        if (linkRegex.test(message.content)) {
            try {
                await message.delete();
                await message.member.timeout(60 * 1000, "Link/Reklam gönderimi yasak!"); // 1 dakika timeout
                const replyMsg = await message.channel.send(`⚠️ ${message.author}, bu sunucuda link paylaşmak yasaktır! (1 Dakika Susturuldun)`);
                setTimeout(() => replyMsg.delete().catch(() => {}), 10000); // Uyarıyı 10 saniye sonra sil
                sendLog(client, '🔗 Reklam / Link Engellendi', [
                    `👤 **Kullanıcı:** ${message.author} (\`${message.author.tag}\` - \`${message.author.id}\`)`,
                    `📁 **Kanal:** ${message.channel} (\`${message.channel.name}\`)`,
                    `🚫 **Uygulanan Ceza:** \`1 Dakika Zaman Aşımı (Timeout)\``,
                    `💬 **Engellenen Mesaj:**\n> ${message.content}`
                ], 0xe74c3c);
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
            const reply = await message.reply(`❓ **${prefix}${commandName}** adında bir komut bulunamadı!\n💡 Kullanabileceğin komutlar: \`${prefix}rank\`, \`${prefix}toplevel\`, \`${prefix}ship\`, \`${prefix}ai\` vb.`);
            setTimeout(() => reply.delete().catch(() => {}), 6000);
            return;
        }

        // Yetki kontrolü (sadece 1541337917467795478 ID'li rol)
        if (command.modOnly) {
            if (!message.member.roles.cache.has('1541337917467795478')) {
                const reply = await message.reply("❌ Bu komutu kullanmak için gerekli moderatör rolüne sahip değilsin!");
                setTimeout(() => reply.delete().catch(() => {}), 6000);
                return;
            }
            // Mod Log
            if (client.serverConfig.modLog) {
                const modLog = client.channels.cache.get(client.serverConfig.modLog);
                if (modLog) {
                    const timestamp = Math.floor(Date.now() / 1000);
                    const container = new ContainerBuilder()
                        .setAccentColor(0x9b59b6)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent('## 🛡️ Moderatör Komut İşlemi'),
                            new TextDisplayBuilder().setContent(
                                `👤 **Yetkili:** ${message.author} (\`${message.author.tag}\` - \`${message.author.id}\`)\n` +
                                `📁 **Kanal:** ${message.channel} (\`${message.channel.name}\`)\n` +
                                `⚡ **Kullanılan Komut:** \`${message.content}\`\n` +
                                `⏰ **Zaman:** <t:${timestamp}:F> (<t:${timestamp}:R>)`
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
        const targetChannel = (client.levelChannelId && client.channels.cache.get(client.levelChannelId)) || message.channel;
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
                ctx.fillText('✨ TEBRİKLER! (SEVİYE ATLADIN)', 230, 85);
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
                ctx.fillText('YENİ SEVİYE', badgeX, badgeY - 30);

                ctx.font = 'bold 64px sans-serif';
                ctx.fillStyle = '#f1c40f';
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 16;
                ctx.fillText(stats.level.toString(), badgeX, badgeY + 42);
                ctx.shadowBlur = 0;

                const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'level-up.png' });

                await targetChannel.send({ 
                    content: `🎉 ${message.author} yeni bir seviyeye ulaştı! **(Seviye ${stats.level})**`, 
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
const { loadImage } = require('canvas');
const path = require('path');

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
    if (!client.welcomeChannelId) return;
    const channel = member.guild.channels.cache.get(client.welcomeChannelId);
    if (!channel) return;

    try {
        const canvas = createCanvas(1024, 250);
        const ctx = canvas.getContext('2d');

        // 1. Arka Plan Görseli (1024x250 Doğrudan Şeffaf PNG)
        const bgPngPath = path.join(__dirname, 'assets', 'welcome_bg.png');
        if (fs.existsSync(bgPngPath)) {
            const bg = await loadImage(bgPngPath);
            ctx.drawImage(bg, 0, 0, 1024, 250);
        } else {
            ctx.fillStyle = '#1c1524';
            ctx.fillRect(0, 0, 1024, 250);
        }

        // 2. Avatar
        const avatarRadius = 75;
        const avatarX = 125;
        const avatarY = 125;

        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        try {
            const avatar = await loadImage(avatarURL);
            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
            ctx.restore();
        } catch (e) {
            console.error("Avatar yükleme hatası:", e);
        }

        // Avatar ince çerçeve
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 3. Sağ Üst Rozet (Pill Badge: 6092. üye)
        const memberCount = member.guild.memberCount;
        const badgeText = `${memberCount}. üye`;
        ctx.font = 'bold 20px sans-serif';
        const textWidth = ctx.measureText(badgeText).width;
        const badgePadX = 22;
        const badgeWidth = textWidth + badgePadX * 2;
        const badgeHeight = 42;
        const badgeX = 1024 - badgeWidth - 35;
        const badgeY = 28;
        const badgeRadius = 21;

        drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

        // 4. İsim ve Kullanıcı Adı
        const displayName = member.displayName || member.user.globalName || member.user.username;
        const username = `@${member.user.username}`;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        // Ana İsim (Display Name)
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#ffffff';
        const maxTextWidth = badgeX - 235 - 20;
        let fittedName = displayName;
        while (ctx.measureText(fittedName).width > maxTextWidth && fittedName.length > 3) {
            fittedName = fittedName.slice(0, -1);
        }
        if (fittedName !== displayName) fittedName += '...';
        ctx.fillText(fittedName, 235, 120);

        // Kullanıcı Adı (@username)
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#9e9bb0';
        ctx.fillText(username, 235, 160);

        const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'welcome.png' });
        
        // Üye sayısını boşluklu yazdırma formatı
        const countStr = memberCount.toString().split('').join(' '); 

        await channel.send({
            content: `> <a:hello:1541362303797301318> ${member.user} Sunucuya katıldı! Seninle birlikte **${countStr}** Kişi olduk`,
            files: [attachment]
        });

    } catch (err) {
        console.error("Welcome resmi oluşturulurken hata:", err);
    }
});

// Bot Girişi
client.login(process.env.DISCORD_TOKEN);
