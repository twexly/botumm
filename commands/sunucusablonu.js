const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const emojis = require('../emojis');

const TEMPLATES = {
    fivem: {
        key: 'fivem',
        name: 'FiveM Roleplay Sunucusu (Xen RP Mimarisi)',
        emoji: '🎮',
        previewUrl: 'https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_sablon_fivem.png',
        desc: 'Xen Roleplay (1184994484396765295) mimarisinde kapsamlı FiveM V sunucu şablonu; Departmanlar, Çeteler, Adalet, Kayıt/Başvuru ve Ses Kanalları.',
        categories: [
            {
                name: '📌┃{SERVER_NAME}・BİLGİ',
                channels: [
                    { name: '📍┃sınırsız-davet', type: 0 },
                    { name: '📢┃duyurular', type: 0 },
                    { name: '📜┃kurallar', type: 0 },
                    { name: '🌐┃sunucu-ip', type: 0 },
                    { name: '🎁┃etkinlik-çekiliş', type: 0 },
                    { name: '🚀┃boost-ayrıcalıkları', type: 0 }
                ]
            },
            {
                name: '📝┃KAYIT & BAŞVURU',
                channels: [
                    { name: '📝┃whitelist-kayıt', type: 0 },
                    { name: '👮┃lspd-başvuru', type: 0 },
                    { name: '🚑┃ems-başvuru', type: 0 },
                    { name: '🔫┃çete-aile-başvuru', type: 0 },
                    { name: '💼┃işletme-başvuru', type: 0 },
                    { name: '🛡️┃yetkili-başvuru', type: 0 }
                ]
            },
            {
                name: '💬┃GENEL TOPLULUK',
                channels: [
                    { name: '💬┃genel-sohbet', type: 0 },
                    { name: '📸┃foto-medya', type: 0 },
                    { name: '🎬┃klip-video', type: 0 },
                    { name: '🤖┃bot-komut', type: 0 },
                    { name: '💰┃ic-ticaret-pazar', type: 0 },
                    { name: '📰┃sarı-sayfalar', type: 0 }
                ]
            },
            {
                name: '🎫┃DESTEK MERKEZİ',
                channels: [
                    { name: '🎫┃destek-talebi', type: 0 },
                    { name: '💡┃öneri-istek', type: 0 },
                    { name: '🐛┃bug-raporu', type: 0 },
                    { name: '🚨┃oyuncu-şikayet', type: 0 },
                    { name: '⚖️┃ck-talepleri', type: 0 }
                ]
            },
            {
                name: '🚨┃DEPARTMAN | LSPD',
                channels: [
                    { name: '📢┃lspd-duyuru', type: 0 },
                    { name: '📋┃sabıka-sicil-kayıt', type: 0 },
                    { name: '🔫┃el-konulan-esyalar', type: 0 },
                    { name: '📻 LSPD Genel Telsiz', type: 2 },
                    { name: '📻 LSPD Devriye 1', type: 2 },
                    { name: '📻 LSPD Devriye 2', type: 2 },
                    { name: '📻 LSPD Operasyon', type: 2 }
                ]
            },
            {
                name: '🚑┃DEPARTMAN | EMS',
                channels: [
                    { name: '📢┃ems-duyuru', type: 0 },
                    { name: '📋┃hasta-kayıt', type: 0 },
                    { name: '💊┃ilaç-rapor-teslim', type: 0 },
                    { name: '📻 EMS Genel Telsiz', type: 2 },
                    { name: '📻 EMS Nöbet Odası', type: 2 }
                ]
            },
            {
                name: '⚖️┃ADALET & İŞLETMELER',
                channels: [
                    { name: '⚖️┃mahkeme-duyuru', type: 0 },
                    { name: '📜┃dava-dosyaları', type: 0 },
                    { name: '🏢┃onaylı-işletmeler', type: 0 },
                    { name: '🚗┃galeri-araçlar', type: 0 }
                ]
            },
            {
                name: '🔫┃İLLEGAL & ÇETELER',
                channels: [
                    { name: '🔫┃illegal-kurallar', type: 0 },
                    { name: '🏴┃çete-duyuruları', type: 0 },
                    { name: '⚔️┃redzone-bilgilendirme', type: 0 },
                    { name: '📻 İllegal Telsiz 1', type: 2 },
                    { name: '📻 İllegal Telsiz 2', type: 2 }
                ]
            },
            {
                name: '🔊┃GENEL SES ODALARI',
                channels: [
                    { name: '☕ Muhabbet 1', type: 2 },
                    { name: '☕ Muhabbet 2', type: 2 },
                    { name: '🎮 Oyun & Yayın 1', type: 2 },
                    { name: '🎮 Oyun & Yayın 2', type: 2 },
                    { name: '⏳ Destek Bekleme 1', type: 2 },
                    { name: '⏳ Destek Bekleme 2', type: 2 }
                ]
            },
            {
                name: '👑┃YÖNETİM & TOPLANTI',
                channels: [
                    { name: '🔒┃yetkili-sohbet', type: 0 },
                    { name: '🔒┃yetkili-duyuru', type: 0 },
                    { name: '🔒┃rol-hatası-bildirim', type: 0 },
                    { name: '🔒 Yönetim Toplantı Odası', type: 2 },
                    { name: '🔒 Supervisor Odası', type: 2 }
                ]
            }
        ],
        roles: [
            { name: '👑 {SERVER_NAME} | Founder', color: '#E74C3C', hoist: true },
            { name: '⭐ {SERVER_NAME} | Project Director', color: '#C0392B', hoist: true },
            { name: '⚡ {SERVER_NAME} | Master', color: '#9B59B6', hoist: true },
            { name: '💎 {SERVER_NAME} | Management', color: '#8E44AD', hoist: true },
            { name: '🛡️ {SERVER_NAME} | Head Admin', color: '#E67E22', hoist: true },
            { name: '💼 {SERVER_NAME} | Administrator', color: '#F39C12', hoist: true },
            { name: '👔 {SERVER_NAME} | Supervisor', color: '#16A085', hoist: true },
            { name: '⚖️ {SERVER_NAME} | Head Moderator', color: '#1ABC9C', hoist: true },
            { name: '🔧 {SERVER_NAME} | Moderator', color: '#2ECC71', hoist: true },
            { name: '🎮 {SERVER_NAME} | Game Staff', color: '#27AE60', hoist: true },
            { name: '👮 Chief of Police (LSPD)', color: '#2980B9', hoist: true },
            { name: '👮 Police Officer', color: '#3498DB', hoist: true },
            { name: '🚑 Chief of EMS', color: '#E91E63', hoist: true },
            { name: '🚑 Paramedic (EMS)', color: '#FF7675', hoist: true },
            { name: '⚖️ Başsavcı / Hakim', color: '#6C5CE7', hoist: true },
            { name: '🏢 Onaylı İşletme Sahibi', color: '#D35400', hoist: true },
            { name: '🔫 Çete / Aile Lideri', color: '#2D3436', hoist: true },
            { name: '🔫 Çete / Aile Üyesi', color: '#636E72', hoist: true },
            { name: '🚀 Server Booster', color: '#FD79A8', hoist: true },
            { name: '💎 Sponsor / Donator', color: '#F1C40F', hoist: true },
            { name: '📜 Whitelist Oyuncu', color: '#00CEC9', hoist: true },
            { name: '🎮 {SERVER_NAME} Oyuncusu', color: '#B2BEC3', hoist: false }
        ]
    },
    mc: {
        key: 'mc',
        name: 'Minecraft Oyun Sunucusu',
        emoji: '⛏️',
        previewUrl: 'https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_sablon_mc.png',
        desc: 'Minecraft sunucuları için IP, Güncellemeler, Kurallar, Klanlar, Destek ve Oyun Ses Odaları.',
        categories: [
            {
                name: '📢 SUNUCU BİLGİ',
                channels: [
                    { name: '📢・duyurular', type: 0 },
                    { name: '🌐・sunucu-ip', type: 0 },
                    { name: '📜・kurallar', type: 0 },
                    { name: '🎁・etkinlikler', type: 0 }
                ]
            },
            {
                name: '💬 TOPLULUK',
                channels: [
                    { name: '💬・genel-sohbet', type: 0 },
                    { name: '📸・ekran-görüntüleri', type: 0 },
                    { name: '💰・oyun-ticaret', type: 0 },
                    { name: '🤖・bot-komut', type: 0 }
                ]
            },
            {
                name: '⚔️ KLANLAR & OYUNCULAR',
                channels: [
                    { name: '⚔️・klan-tanıtım', type: 0 },
                    { name: '💡・öneri-istek', type: 0 },
                    { name: '🐛・hata-bildirimi', type: 0 }
                ]
            },
            {
                name: '🔊 OYUN SES ODALARI',
                channels: [
                    { name: '🌲 Survival 1', type: 2 },
                    { name: '🌲 Survival 2', type: 2 },
                    { name: '⚔️ Bedwars Odası', type: 2 },
                    { name: '☁️ Skyblock Odası', type: 2 }
                ]
            }
        ],
        roles: [
            { name: '👑 Kurucu', color: '#C0392B', hoist: true },
            { name: '🛡️ Admin', color: '#D35400', hoist: true },
            { name: '🔨 Mimar', color: '#F39C12', hoist: true },
            { name: '⚡ VIP+', color: '#27AE60', hoist: true },
            { name: '💎 VIP', color: '#2980B9', hoist: true },
            { name: '🎥 YouTuber', color: '#E74C3C', hoist: true },
            { name: '⚔️ Klan Lideri', color: '#8E44AD', hoist: true },
            { name: '🎮 Oyuncu', color: '#BDC3C7', hoist: false }
        ]
    },
    public: {
        key: 'public',
        name: 'Public / Topluluk Sunucusu',
        emoji: '🌟',
        previewUrl: 'https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_sablon_public.png',
        desc: 'Her türlü topluluk ve arkadaş grubu için Sohbet, Medya, Müzik, Çekiliş ve Genel Ses Odaları.',
        categories: [
            {
                name: '📜 BAŞLANGIÇ',
                channels: [
                    { name: '📜・kurallar', type: 0 },
                    { name: '📢・duyurular', type: 0 },
                    { name: '👋・hoş-geldin', type: 0 }
                ]
            },
            {
                name: '💬 SOHBET & MUHABBET',
                channels: [
                    { name: '💬・genel-sohbet', type: 0 },
                    { name: '📸・foto-chat', type: 0 },
                    { name: '🤖・bot-komut', type: 0 },
                    { name: '🎁・çekilişler', type: 0 }
                ]
            },
            {
                name: '🎵 MÜZİK & EĞLENCE',
                channels: [
                    { name: '🎵・şarkı-komut', type: 0 },
                    { name: '📻 7/24 Müzik Odası', type: 2 }
                ]
            },
            {
                name: '🔊 GENEL SES ODALARI',
                channels: [
                    { name: '☕ Muhabbet Odası 1', type: 2 },
                    { name: '☕ Muhabbet Odası 2', type: 2 },
                    { name: '🎮 Oyun Odası 1', type: 2 },
                    { name: '🎮 Oyun Odası 2', type: 2 }
                ]
            }
        ],
        roles: [
            { name: '👑 Kurucu', color: '#9B59B6', hoist: true },
            { name: '⭐ Yönetim', color: '#3498DB', hoist: true },
            { name: '🛡️ Moderatör', color: '#1ABC9C', hoist: true },
            { name: '💎 Destekçi', color: '#E91E63', hoist: true },
            { name: '🎉 Çekiliş Katılımcısı', color: '#F1C40F', hoist: true },
            { name: '✨ Aktif Üye', color: '#E67E22', hoist: true },
            { name: '👤 Üye', color: '#95A5A6', hoist: false }
        ]
    },
    youtube: {
        key: 'youtube',
        name: 'YouTube / İçerik Üreticisi Sunucusu',
        emoji: '🎬',
        previewUrl: 'https://raw.githubusercontent.com/twexly/botumm/main/assets/preview_sablon_youtube.png',
        desc: 'Youtuber ve yayıncılar için Video Bildirimleri, Fan-Art, Abone Odaları ve Özel Yayın Kanalları.',
        categories: [
            {
                name: '📺 YAYIN & VİDEO',
                channels: [
                    { name: '📺・yeni-videolar', type: 0 },
                    { name: '🔴・canlı-yayınlar', type: 0 },
                    { name: '📢・duyurular', type: 0 },
                    { name: '📜・kurallar', type: 0 }
                ]
            },
            {
                name: '💡 FİKİR & ETKİLEŞİM',
                channels: [
                    { name: '💡・video-önerileri', type: 0 },
                    { name: '🎨・fan-art', type: 0 },
                    { name: '😂・memeler', type: 0 }
                ]
            },
            {
                name: '💬 TOPLULUK',
                channels: [
                    { name: '💬・genel-sohbet', type: 0 },
                    { name: '⭐・katıl-özel-sohbet', type: 0 },
                    { name: '📷・medya', type: 0 }
                ]
            },
            {
                name: '🎙️ YAYIN & OYUN ODALARI',
                channels: [
                    { name: '🎙️ Yayın Odası (Kilitli)', type: 2 },
                    { name: '🎮 İzleyici Oyun Odası 1', type: 2 },
                    { name: '🎮 İzleyici Oyun Odası 2', type: 2 },
                    { name: '🔊 Sohbet Odası', type: 2 }
                ]
            }
        ],
        roles: [
            { name: '🎬 YouTuber / Yayıncı', color: '#FF0000', hoist: true },
            { name: '⭐ Baş Moderatör', color: '#E67E22', hoist: true },
            { name: '🛡️ Moderatör', color: '#3498DB', hoist: true },
            { name: '🏆 VIP Abone', color: '#F1C40F', hoist: true },
            { name: '🌟 Katıl Üyesi', color: '#2ECC71', hoist: true },
            { name: '🎨 Tasarımcı', color: '#9B59B6', hoist: true },
            { name: '👥 Takipçi', color: '#95A5A6', hoist: false }
        ]
    }
};

function generateTemplateMenu(serverName) {
    const encodedName = encodeURIComponent(serverName.slice(0, 30));

    const content = `## 📋 Sunucu Şablon Sistemi — ${serverName}\n` +
        `Aşağıdaki numaralı bağlantılara tıklayarak şablonların kanal ve rol önizlemelerine bakabilir, sunucunuz için uygun olan şablonu butonlardan seçebilirsiniz:\n\n` +
        `• **[1](${TEMPLATES.fivem.previewUrl})** — 🎮 **FiveM Roleplay Sunucu Şablonu**\n` +
        `• **[2](${TEMPLATES.mc.previewUrl})** — ⛏️ **Minecraft Oyun Sunucu Şablonu**\n` +
        `• **[3](${TEMPLATES.public.previewUrl})** — 🌟 **Public / Topluluk Sunucu Şablonu**\n` +
        `• **[4](${TEMPLATES.youtube.previewUrl})** — 🎬 **YouTube / Yayıncı Sunucu Şablonu**\n\n` +
        `*Bir şablon seçtiğinizde detaylı kanal/rol listesi açılacak ve tek tıkla otomatik kurulum seçeneği sunulacaktır!*`;

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sablon_pick_fivem_${encodedName}`).setLabel('FiveM Sunucusu').setEmoji('🎮').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`sablon_pick_mc_${encodedName}`).setLabel('Minecraft Sunucusu').setEmoji('⛏️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sablon_pick_public_${encodedName}`).setLabel('Public Sunucusu').setEmoji('🌟').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`sablon_pick_youtube_${encodedName}`).setLabel('YouTube Sunucusu').setEmoji('🎬').setStyle(ButtonStyle.Danger)
    );

    return { content, components: [row] };
}

function getResolvedTemplate(templateKey, serverName) {
    const raw = TEMPLATES[templateKey];
    if (!raw) return null;
    const name = (serverName && serverName.trim()) ? serverName.trim() : 'Roleplay';

    const jsonStr = JSON.stringify(raw);
    const replaced = jsonStr.replace(/\{SERVER_NAME\}/g, name);

    return JSON.parse(replaced);
}

module.exports = {
    name: 'sunucusablonu',
    aliases: ['sunucuşablonu', 'sablon', 'şablon', 'template', 'templates'],
    modOnly: true,
    description: 'Profesyonel sunucu şablonlarını görsel önizlemeleriyle sunar ve tek tıkla otomatik kurar.',
    TEMPLATES,
    getResolvedTemplate,
    generateTemplateMenu,
    async execute(message, client, args) {
        if (!message.guild) return;

        if (!client.isModerator(message.member)) {
            return message.reply({
                content: `${emojis.cross} Bu komutu sadece sunucu sahibi, yöneticiler veya yetkili rolüne sahip kullanıcılar kullanabilir.`
            });
        }

        // 1. İsim komutta doğrudan verilmiş mi?
        if (args && args.length > 0) {
            const serverName = args.join(' ').trim();
            const menu = generateTemplateMenu(serverName);
            return message.reply(menu);
        }

        // 2. İsim verilmediyse kullanıcıya sor (.welcome stili):
        const askRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('sablon_ask_yes')
                .setLabel('Evet, İsim Belirle')
                .setEmoji('1545103227865927690')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('sablon_ask_no')
                .setLabel('Hayır, Mevcut İsimle Devam Et')
                .setEmoji('1545103202616090724')
                .setStyle(ButtonStyle.Secondary)
        );

        const askContent = `❓ **Sunucunuza özel bir isim girmediniz!**\n` +
            `Şablon oluşturulurken sunucunuza özel bir isim belirlemek ister misiniz?\n\n` +
            `> *Özel bir isim belirleyerek şablonu özelleştirebilir veya mevcut sunucu adınızla (\`${message.guild.name}\`) devam edebilirsiniz.*`;

        return message.reply({
            content: askContent,
            components: [askRow]
        });
    }
};
