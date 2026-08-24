process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // SSL Hatası için eklemiştik

const { Client, GatewayIntentBits, Collection, AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const { createCanvas } = require('canvas');
require('dotenv').config();

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
    client.user.setActivity('Ryu ❤️ Wolflykia', { type: 4 }); // 4 = Custom
});

// SESLİ KANAL TAKİBİ VE LOG
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) return;
    const userId = newState.member.id;

    if (!oldState.channelId && newState.channelId) {
        client.voiceSessions.set(userId, Date.now());
        sendLog(client, '🔊 Sesliye Katıldı', `${newState.member.user} **${newState.channel.name}** kanalına giriş yaptı.`, 0x2ecc71);
    } 
    else if (oldState.channelId && !newState.channelId) {
        const joinTime = client.voiceSessions.get(userId);
        if (joinTime) {
            const duration = Date.now() - joinTime;
            const stats = client.userStats.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };
            stats.voiceTime = (stats.voiceTime || 0) + duration;
            client.userStats.set(userId, stats);
            client.saveDatabase();
            client.voiceSessions.delete(userId);
        }
        sendLog(client, '🔈 Sesliden Ayrıldı', `${oldState.member.user} **${oldState.channel.name}** kanalından çıkış yaptı.`, 0xe74c3c);
    }
});

// LOG YARDIMCI FONKSİYONU (V2 COMPONENTS)
async function sendLog(client, title, description, color = 0x2b2d31) {
    if (!client.serverConfig || !client.serverConfig.serverLog) return;
    const logChannel = client.channels.cache.get(client.serverConfig.serverLog);
    if (!logChannel) return;

    try {
        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`### ${title}`),
                new TextDisplayBuilder().setContent(description)
            );
        await logChannel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (e) {
        console.error("Log gönderme hatası:", e);
    }
}

// DİĞER LOG EVENTLERİ (UÇAN KAÇAN HER ŞEY)
client.on('messageDelete', message => {
    if (message.author?.bot) return;
    sendLog(client, '🗑️ Mesaj Silindi', `**Kullanıcı:** ${message.author}\n**Kanal:** ${message.channel}\n**İçerik:**\n> ${message.content || '[İçerik Yok Veya Medya]'}`, 0xe74c3c);
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    sendLog(client, '✏️ Mesaj Düzenlendi', `**Kullanıcı:** ${newMessage.author}\n**Kanal:** ${newMessage.channel}\n\n**Eski:** ${oldMessage.content || '[Yok]'}\n**Yeni:** ${newMessage.content || '[Yok]'}`, 0xf1c40f);
});

client.on('guildMemberAdd', member => {
    sendLog(client, '📥 Sunucuya Katıldı', `${member.user} sunucumuza katıldı.`, 0x2ecc71);
});

client.on('guildMemberRemove', member => {
    sendLog(client, '🚪 Sunucudan Ayrıldı', `${member.user} aramızdan ayrıldı.`, 0xe74c3c);
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
        const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
        if (addedRoles.size > 0) sendLog(client, '🎭 Rol Eklendi', `${newMember.user} üyesine **${addedRoles.map(r => r.name).join(', ')}** rolü verildi.`, 0x3498db);
        if (removedRoles.size > 0) sendLog(client, '🎭 Rol Alındı', `${newMember.user} üyesinden **${removedRoles.map(r => r.name).join(', ')}** rolü alındı.`, 0xe67e22);
    }
    if (oldMember.nickname !== newMember.nickname) {
        sendLog(client, '📝 İsim Değiştirildi', `${newMember.user} ismini güncelledi.\n**Eski:** ${oldMember.nickname || oldMember.user.username}\n**Yeni:** ${newMember.nickname || newMember.user.username}`, 0x3498db);
    }
});

client.on('guildBanAdd', ban => {
    sendLog(client, '🔨 Kullanıcı Banlandı', `${ban.user} sunucudan yasaklandı.\n**Sebep:** ${ban.reason || 'Belirtilmedi'}`, 0xe74c3c);
});

client.on('guildBanRemove', ban => {
    sendLog(client, '🔓 Kullanıcı Banı Açıldı', `${ban.user} adlı kişinin yasağı kaldırıldı.`, 0x2ecc71);
});

client.on('channelCreate', channel => {
    sendLog(client, '📁 Kanal Oluşturuldu', `**Kanal Adı:** ${channel}\n**Tür:** ${channel.type}`, 0x2ecc71);
});

client.on('channelDelete', channel => {
    sendLog(client, '📁 Kanal Silindi', `**Kanal Adı:** ${channel.name}`, 0xe74c3c);
});

client.on('channelUpdate', (oldChannel, newChannel) => {
    if (oldChannel.name !== newChannel.name) {
        sendLog(client, '📁 Kanal Güncellendi', `**Kanal:** ${newChannel}\n**Eski Adı:** ${oldChannel.name}\n**Yeni Adı:** ${newChannel.name}`, 0xf1c40f);
    }
});

client.on('roleCreate', role => {
    sendLog(client, '🏷️ Rol Oluşturuldu', `**Rol Adı:** ${role} (${role.name})`, 0x2ecc71);
});

client.on('roleDelete', role => {
    sendLog(client, '🏷️ Rol Silindi', `**Rol Adı:** ${role.name}`, 0xe74c3c);
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
                sendLog(client, '🔗 Reklam Engellendi', `${message.author} link atmaya çalıştı ve 1 dakika susturuldu.`, 0xe74c3c);
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
        const prefixLength = message.content.startsWith('!') ? 1 : 1;
        const args = message.content.slice(prefixLength).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (command) {
            // Yetki kontrolü (sadece 1541337917467795478 ID'li rol)
            if (command.modOnly) {
                if (!message.member.roles.cache.has('1541337917467795478')) {
                    return message.reply("❌ Bu komutu kullanmak için gerekli moderatör rolüne sahip değilsin!");
                }
                // Mod Log
                if (client.serverConfig.modLog) {
                    const modLog = client.channels.cache.get(client.serverConfig.modLog);
                    if (modLog) {
                        const container = new ContainerBuilder()
                            .setAccentColor(0x9b59b6)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent('### 🛡️ Moderatör İşlemi'),
                                new TextDisplayBuilder().setContent(`**Yetkili:** ${message.author}\n**Kanal:** ${message.channel}\n**Komut:** \`${message.content}\``)
                            );
                        modLog.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                    }
                }
            }
            return command.execute(message, client, args);
        }
    }

    const userId = message.author.id;
    const stats = client.userStats.get(userId) || { xp: 0, level: 1, messages: 0, voiceTime: 0 };

    const xpToAdd = Math.floor(Math.random() * 10) + 15;
    stats.xp += xpToAdd;
    stats.messages += 1;

    const xpNeeded = stats.level * 100;

    if (stats.xp >= xpNeeded) {
        stats.level += 1;
        stats.xp -= xpNeeded; 

        if (client.levelChannelId) {
            const levelChannel = client.channels.cache.get(client.levelChannelId);
            
            if (levelChannel) {
                try {
                    // --- YENİ KALİTELİ LEVEL UP GÖRSELİ ---
                    const canvas = createCanvas(1400, 500);
                    const ctx = canvas.getContext('2d');

                    const radius = 60;
                    const padding = 20;

                    // Dış Çerçeve ve Arka Plan
                    ctx.beginPath();
                    ctx.moveTo(padding + radius, padding);
                    ctx.lineTo(canvas.width - padding - radius, padding);
                    ctx.quadraticCurveTo(canvas.width - padding, padding, canvas.width - padding, padding + radius);
                    ctx.lineTo(canvas.width - padding, canvas.height - padding - radius);
                    ctx.quadraticCurveTo(canvas.width - padding, canvas.height - padding, canvas.width - padding - radius, canvas.height - padding);
                    ctx.lineTo(padding + radius, canvas.height - padding);
                    ctx.quadraticCurveTo(padding, canvas.height - padding, padding, canvas.height - padding - radius);
                    ctx.lineTo(padding, padding + radius);
                    ctx.quadraticCurveTo(padding, padding, padding + radius, padding);
                    ctx.closePath();

                    ctx.fillStyle = '#1e1f22'; // Daha koyu ve modern bir arka plan
                    ctx.fill();

                    ctx.strokeStyle = '#f1c40f'; // Altın sarısı dış çerçeve
                    ctx.lineWidth = 15;
                    ctx.stroke();

                    // Yıldız veya Ekstra Süsleme (Level atlama ruhunu vermek için küçük şık bir süs)
                    ctx.font = 'bold 90px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    const username = message.author.username;
                    ctx.fillText(`Tebrikler ${username}!`, canvas.width / 2, 200);
                    
                    ctx.font = 'bold 110px sans-serif';
                    ctx.fillStyle = '#f1c40f'; // Altın sarısı
                    ctx.fillText(`${stats.level}. SEVİYE`, canvas.width / 2, 360);

                    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'level-up.png' });

                    await levelChannel.send({ 
                        content: `🎉 <@${userId}> yeni bir seviyeye ulaştı!`, 
                        files: [attachment] 
                    });
                } catch (err) {
                    console.error("Canvas oluşturulurken hata:", err);
                }
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
