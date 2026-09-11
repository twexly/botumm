const emojis = require('../emojis');

const LEAGUES = {
    superlig: {
        id: 'superlig',
        name: 'Süper Lig',
        fullName: 'Trendyol Süper Lig',
        emoji: emojis.superlig,
        feedCode: 'to_ABdATjMP_2TRNmxYR_1',
        teams: [
            { id: 'sl_galatasaray', name: 'Galatasaray', color: '#A90432', emoji: '<:galatasaray:1548047618049843331>', desc: 'Sarı Kırmızı • Cimbom' },
            { id: 'sl_fenerbahce', name: 'Fenerbahçe', color: '#002366', emoji: '<:fenerbahce:1548047920329396244>', desc: 'Sarı Lacivert • Sarı Kanarya' },
            { id: 'sl_besiktas', name: 'Beşiktaş', color: '#111111', emoji: '<:besiktas:1548047466623139860>', desc: 'Siyah Beyaz • Kara Kartal' },
            { id: 'sl_trabzonspor', name: 'Trabzonspor', color: '#8B0000', emoji: '<:trabzonspor:1548046641024602192>', desc: 'Bordo Mavi • Fırtına' },
            { id: 'sl_basaksehir', name: 'Başakşehir', color: '#FF7518', emoji: '<:basaksehir:1548047417834995742>', desc: 'Turuncu Lacivert • Boz Baykuşlar' },
            { id: 'sl_samsunspor', name: 'Samsunspor', color: '#E30A17', emoji: '<:samsunspor:1548047336154865776>', desc: 'Kırmızı Beyaz Siyah • Şimşekler' },
            { id: 'sl_goztepe', name: 'Göztepe', color: '#FFD700', emoji: '<:goztepe:1548047700358996019>', desc: 'Sarı Kırmızı • Göz Göz' },
            { id: 'sl_kasimpasa', name: 'Kasımpaşa', color: '#003399', emoji: '<:kasimpasa:1548047669119815771>', desc: 'Lacivert Beyaz • Paşa' },
            { id: 'sl_caykurrizespor', name: 'Çaykur Rizespor', color: '#006633', emoji: '<:caykurrizespor:1548047499971919924>', desc: 'Yeşil Mavi • Atmacalar' },
            { id: 'sl_alanyaspor', name: 'Alanyaspor', color: '#FF8C00', emoji: '<:alanyaspor:1548047391146377287>', desc: 'Turuncu Yeşil • Şimşekler' },
            { id: 'sl_kocaelispor', name: 'Kocaelispor', color: '#006400', emoji: '<:kocaelispor:1548047864293228564>', desc: 'Yeşil Siyah • Körfez' },
            { id: 'sl_erzurumspor', name: 'Erzurumspor', color: '#003399', emoji: '<:erzurumspor:1548047798572945499>', desc: 'Mavi Beyaz • Dadaşlar' },
            { id: 'sl_genclerbirligi', name: 'Gençlerbirliği', color: '#C8102E', emoji: '<:genclerbirligi:1548047755983855626>', desc: 'Kırmızı Kara • Alkaralar' },
            { id: 'sl_amedspor', name: 'Amedspor', color: '#008000', emoji: '<:amedspor:1548047728641056858>', desc: 'Yeşil Kırmızı Beyaz' },
            { id: 'sl_corumfk', name: 'Çorum FK', color: '#8B0000', emoji: '<:corumfk:1548047588467408896>', desc: 'Kırmızı Siyah' }
        ]
    },
    premierleague: {
        id: 'premierleague',
        name: 'Premier League',
        fullName: 'English Premier League',
        emoji: emojis.premierleague,
        feedCode: 'to_SY30SsKF_CfoA8Dmm_1',
        teams: [
            { id: 'pl_arsenal', name: 'Arsenal', color: '#EF0107', emoji: '<:arsenal:1548086574636601365>', desc: 'Kırmızı Beyaz • Topçular' },
            { id: 'pl_astonvilla', name: 'Aston Villa', color: '#670E36', emoji: '<:astonvilla:1548086576104341564>', desc: 'Bordo Gök Mavisi • Villans' },
            { id: 'pl_afcbournemouth', name: 'AFC Bournemouth', color: '#DA291C', emoji: '<:afcbournemouth:1548086571637407795>', desc: 'Kırmızı Siyah • Cherries' },
            { id: 'pl_brentford', name: 'Brentford', color: '#D20000', emoji: '<:brentford:1548086591099240548>', desc: 'Kırmızı Beyaz • Arılar' },
            { id: 'pl_brighton', name: 'Brighton & Hove Albion', color: '#0057B8', emoji: '<:brightonandhovealbion:1548086593435213864>', desc: 'Mavi Beyaz • Martılar' },
            { id: 'pl_chelsea', name: 'Chelsea', color: '#034694', emoji: '<:chelsea:1548086600762662912>', desc: 'Mavi Beyaz • Mavililer' },
            { id: 'pl_crystalpalace', name: 'Crystal Palace', color: '#1B458F', emoji: '<:crystalpalace:1548086605284118609>', desc: 'Kırmızı Mavi • Kartallar' },
            { id: 'pl_everton', name: 'Everton', color: '#003399', emoji: '<:everton:1548086614394142842>', desc: 'Mavi Beyaz • Toffees' },
            { id: 'pl_fulham', name: 'Fulham', color: '#000000', emoji: '<:fulham:1548086623412162610>', desc: 'Siyah Beyaz • Cottagers' },
            { id: 'pl_ipswichtown', name: 'Ipswich Town', color: '#0000FF', emoji: '<:ipswichtown:1548086641724231740>', desc: 'Mavi Beyaz • Traktör Çocukları' },
            { id: 'pl_leedsunited', name: 'Leeds United', color: '#FFCD00', emoji: '<:leedsunited:1548086651845349506>', desc: 'Beyaz Sarı Mavi • Peacocks' },
            { id: 'pl_liverpool', name: 'Liverpool', color: '#C8102E', emoji: '<:liverpoolfc:1548086654789746859>', desc: 'Kırmızı Beyaz • Kırmızılar' },
            { id: 'pl_mancity', name: 'Manchester City', color: '#6CABDD', emoji: '<:manchestercity:1548086660535812178>', desc: 'Gök Mavisi • Cityzens' },
            { id: 'pl_manunited', name: 'Manchester United', color: '#DA291C', emoji: '<:manchesterunited:1548086662481977374>', desc: 'Kırmızı Şeytanlar' },
            { id: 'pl_newcastle', name: 'Newcastle United', color: '#241F20', emoji: '<:newcastleunited:1548086666441396294>', desc: 'Siyah Beyaz • Saksağanlar' },
            { id: 'pl_nottingham', name: 'Nottingham Forest', color: '#DD0000', emoji: '<:nottinghamforest:1548086668286758973>', desc: 'Kırmızı Beyaz • Tricky Trees' },
            { id: 'pl_sunderland', name: 'Sunderland', color: '#EB172B', emoji: '<:sunderland:1548086702361411725>', desc: 'Kırmızı Beyaz • Kara Kediler' },
            { id: 'pl_tottenham', name: 'Tottenham Hotspur', color: '#132257', emoji: '<:tottenhamhotspur:1548086709055524986>', desc: 'Lacivert Beyaz • Spurs' },
            { id: 'pl_hullcity', name: 'Hull City', color: '#F59E0B', emoji: '<:hullcity:1548086633310457948>', desc: 'Turuncu Siyah • Kaplanlar' },
            { id: 'pl_coventry', name: 'Coventry City', color: '#00A3E0', emoji: '<:coventrycity:1548086603837345902>', desc: 'Gök Mavisi • Sky Blues' }
        ]
    },
    laliga: {
        id: 'laliga',
        name: 'La Liga',
        fullName: 'Spanish La Liga',
        emoji: emojis.laliga,
        feedCode: 'to_QeI1Oeyi_dWdJXP6U_1',
        teams: [
            { id: 'll_realmadrid', name: 'Real Madrid', color: '#FFFFFF', emoji: '<:realmadrid:1548086684456058910>', desc: 'Beyaz • Los Blancos' },
            { id: 'll_barcelona', name: 'FC Barcelona', color: '#004D98', emoji: '<:fcbarcelona:1548086617712107650>', desc: 'Bordo Mavi • Barça' },
            { id: 'll_atletico', name: 'Atletico Madrid', color: '#CB3524', emoji: '<:atleticomadrid:1548086580298645554>', desc: 'Kırmızı Beyaz • Colchoneros' },
            { id: 'll_athleticbilbao', name: 'Athletic Club Bilbao', color: '#EE2524', emoji: '<:athleticclubbilbao:1548086578939830333>', desc: 'Kırmızı Beyaz • Lions' },
            { id: 'll_realsociedad', name: 'Real Sociedad', color: '#0067B1', emoji: '<:realsociedad:1548086686217408532>', desc: 'Mavi Beyaz • Txuri-Urdin' },
            { id: 'll_realbetis', name: 'Real Betis', color: '#0BB364', emoji: '<:realbetisbalompie:1548086682912292884>', desc: 'Yeşil Beyaz • Béticos' },
            { id: 'll_sevilla', name: 'Sevilla FC', color: '#D4001F', emoji: '<:sevillafc:1548086700990013511>', desc: 'Kırmızı Beyaz • Sevillistas' },
            { id: 'll_valencia', name: 'Valencia CF', color: '#FF7F00', emoji: '<:valenciacf:1548086715846230046>', desc: 'Siyah Beyaz Turuncu • Yarasalar' },
            { id: 'll_villarreal', name: 'Villarreal CF', color: '#FFE600', emoji: '<:villarrealcf:1548086720141074473>', desc: 'Sarı Denizaltı' },
            { id: 'll_celtavigo', name: 'Celta Vigo', color: '#8AC3EE', emoji: '<:celtavigo:1548086598619369574>', desc: 'Gök Mavisi • Celestes' },
            { id: 'll_osasuna', name: 'Osasuna', color: '#D91A21', emoji: '<:osasuna:1548086669805224058>', desc: 'Kırmızı Lacivert • Rojillos' },
            { id: 'll_rayovallecano', name: 'Rayo Vallecano', color: '#E52322', emoji: '<:rayovallecano:1548086677011046410>', desc: 'Kırmızı Beyaz • Franjirrojos' },
            { id: 'll_getafe', name: 'Getafe CF', color: '#005999', emoji: '<:getafecf:1548086627476176926>', desc: 'Mavi • Azulones' },
            { id: 'll_deportivoalaves', name: 'Deportivo Alaves', color: '#004C99', emoji: '<:deportivoalaves:1548086606760648796>', desc: 'Mavi Beyaz • Babazorros' },
            { id: 'll_espanyol', name: 'RCD Espanyol', color: '#007FC8', emoji: '<:rcdespanyolbarcelona:1548086681394225292>', desc: 'Mavi Beyaz • Periquitos' },
            { id: 'll_elche', name: 'Elche CF', color: '#006837', emoji: '<:elchecf:1548086612347322438>', desc: 'Yeşil Beyaz • Franjiverdes' },
            { id: 'll_levante', name: 'Levante UD', color: '#003366', emoji: '<:levanteud:1548086653338517544>', desc: 'Kırmızı Mavi • Granotas' },
            { id: 'll_deportivolacoruna', name: 'Deportivo La Coruna', color: '#005CA9', emoji: '<:deportivolacoruna:1548086608140435497>', desc: 'Mavi Beyaz • Depor' },
            { id: 'll_malagacf', name: 'Malaga CF', color: '#0080C8', emoji: '<:malagacf:1548086658820349993>', desc: 'Mavi Beyaz • Boquerones' },
            { id: 'll_racingsantander', name: 'Racing Santander', color: '#008040', emoji: '<:racingsantander:1548086675169611777>', desc: 'Yeşil Beyaz Siyah' }
        ]
    },
    seriea: {
        id: 'seriea',
        name: 'Serie A',
        fullName: 'Italian Serie A',
        emoji: emojis.seriea,
        feedCode: 'to_WdNk9YwP_CfujcOgK_1',
        teams: [
            { id: 'sa_inter', name: 'Inter', color: '#0068A8', emoji: '<:inter:1548086638029312081>', desc: 'Mavi Siyah • Nerazzurri' },
            { id: 'sa_acmilan', name: 'AC Milan', color: '#FB090B', emoji: '<:acmilan:1548086437524676608>', desc: 'Kırmızı Siyah • Rossoneri' },
            { id: 'sa_juventus', name: 'Juventus', color: '#000000', emoji: '<:juventus:1548086643552952371>', desc: 'Siyah Beyaz • Bianconeri' },
            { id: 'sa_napoli', name: 'Napoli', color: '#12A0D7', emoji: '<:napoli:1548086664348311702>', desc: 'Gök Mavisi • Azzurri' },
            { id: 'sa_roma', name: 'Roma', color: '#8E1F2F', emoji: '<:romalogo:1548086690684604506>', desc: 'Sarı Kırmızı • Giallorossi' },
            { id: 'sa_lazio', name: 'Lazio', color: '#87D8F7', emoji: '<:lazio:1548086647520886866>', desc: 'Gök Mavisi Beyaz • Biancocelesti' },
            { id: 'sa_atalanta', name: 'Atalanta', color: '#1E71B8', emoji: '<:atalanta:1548086577538797678>', desc: 'Mavi Siyah • La Dea' },
            { id: 'sa_fiorentina', name: 'Fiorentina', color: '#4F2683', emoji: '<:fiorentina:1548086619678965780>', desc: 'Mor Menekşeler • Viola' },
            { id: 'sa_bologna', name: 'Bologna', color: '#1A2B4C', emoji: '<:bologna:1548086584962973816>', desc: 'Kırmızı Mavi • Rossoblù' },
            { id: 'sa_torino', name: 'Torino', color: '#8A1538', emoji: '<:torinologo:1548086707323408515>', desc: 'Bordo • Il Toro' },
            { id: 'sa_udinese', name: 'Udinese', color: '#000000', emoji: '<:udinese:1548086712352374874>', desc: 'Siyah Beyaz • Zebrette' },
            { id: 'sa_parma', name: 'Parma', color: '#FFED00', emoji: '<:parma:1548086671923478569>', desc: 'Sarı Mavi • Crociati' },
            { id: 'sa_cagliari', name: 'Cagliari', color: '#C8102E', emoji: '<:cagliari:1548086597302489198>', desc: 'Kırmızı Mavi • Isolani' },
            { id: 'sa_como1907', name: 'Como 1907', color: '#004587', emoji: '<:como1907:1548086602360684664>', desc: 'Mavi Beyaz • Lariani' },
            { id: 'sa_lecce', name: 'Lecce', color: '#FFD100', emoji: '<:lecce:1548086649370714193>', desc: 'Sarı Kırmızı • Salentini' },
            { id: 'sa_venezia', name: 'Venezia FC', color: '#FF6600', emoji: '<:veneziafc:1548086717108588576>', desc: 'Turuncu Siyah Yeşil • Lagunari' },
            { id: 'sa_acmonza', name: 'AC Monza', color: '#E30613', emoji: '<:acmonza:1548086438904467566>', desc: 'Kırmızı Beyaz • Brianzoli' },
            { id: 'sa_sassuolo', name: 'Sassuolo', color: '#00A850', emoji: '<:sassuolologo:1548086692722769921>', desc: 'Yeşil Siyah • Neroverdi' },
            { id: 'sa_frosinone', name: 'Frosinone Calcio', color: '#FFCC00', emoji: '<:frosinonecalcio:1548086621880975460>', desc: 'Sarı Mavi • Canarini' }
        ]
    },
    bundesliga: {
        id: 'bundesliga',
        name: 'Bundesliga',
        fullName: 'German Bundesliga',
        emoji: emojis.bundesliga,
        feedCode: 'to_KY7LrA6d_jg0MwVuC_1',
        teams: [
            { id: 'bl_bayern', name: 'Bayern Munich', color: '#DC052D', emoji: '<:bayernmunich:1548086583075274783>', desc: 'Kırmızı Beyaz • Die Bayern' },
            { id: 'bl_leverkusen', name: 'Bayer Leverkusen', color: '#E32221', emoji: '<:bayerleverkusen:1548086581775310858>', desc: 'Kırmızı Siyah • Werkself' },
            { id: 'bl_dortmund', name: 'Borussia Dortmund', color: '#FDE100', emoji: '<:borussiadortmund:1548086586837831761>', desc: 'Sarı Siyah • BVB' },
            { id: 'bl_leipzig', name: 'RB Leipzig', color: '#DA020E', emoji: '<:rbleipzig:1548086679007666186>', desc: 'Kırmızı Beyaz • Die Roten Bullen' },
            { id: 'bl_frankfurt', name: 'Eintracht Frankfurt', color: '#E1000F', emoji: '<:eintrachtfrankfurt:1548086610082529292>', desc: 'Kırmızı Siyah Beyaz • Kartallar' },
            { id: 'bl_stuttgart', name: 'VfB Stuttgart', color: '#E32219', emoji: '<:vfbstuttgart:1548086718777921607>', desc: 'Beyaz Kırmızı • Die Schwaben' },
            { id: 'bl_monchengladbach', name: 'Borussia Mönchengladbach', color: '#000000', emoji: '<:borussiamonchengladbach:1548086588523806802>', desc: 'Siyah Beyaz Yeşil • Die Fohlen' },
            { id: 'bl_freiburg', name: 'SC Freiburg', color: '#000000', emoji: '<:scfreiburg:1548086694354624572>', desc: 'Siyah Beyaz • Breisgau' },
            { id: 'bl_hoffenheim', name: 'TSG Hoffenheim', color: '#1C63B7', emoji: '<:tsghoffenheim:1548086710443843584>', desc: 'Mavi Beyaz • Kraichgauer' },
            { id: 'bl_werderbremen', name: 'Werder Bremen', color: '#1D8348', emoji: '<:werderbremen:1548086721890099220>', desc: 'Yeşil Beyaz • Werderaner' },
            { id: 'bl_unionberlin', name: 'Union Berlin', color: '#ED1C24', emoji: '<:unionberlin:1548086713992224919>', desc: 'Kırmızı Beyaz • Eisern' },
            { id: 'bl_mainz05', name: 'Mainz 05', color: '#C8102E', emoji: '<:mainz05:1548086656861479033>', desc: 'Kırmızı Beyaz • Nullfünfer' },
            { id: 'bl_augsburg', name: 'FC Augsburg', color: '#BA3733', emoji: '<:fcaugsburg:1548086616101232701>', desc: 'Kırmızı Yeşil Beyaz' },
            { id: 'bl_hamburger', name: 'Hamburger SV', color: '#0000FF', emoji: '<:hamburgersv:1548086629246173347>', desc: 'Mavi Beyaz Siyah • Rothosen' },
            { id: 'bl_schalke', name: 'Schalke 04', color: '#004D9D', emoji: '<:schalke04:1548086696112029696>', desc: 'Mavi Beyaz • Königsblauen' },
            { id: 'bl_paderborn', name: 'SC Paderborn 07', color: '#005CA9', emoji: '<:scpaderborn07:1548086698167242792>', desc: 'Mavi Siyah' },
            { id: 'bl_elversberg', name: 'SV Elversberg', color: '#000000', emoji: '<:svelversberg:1548086705507143791>', desc: 'Siyah Beyaz' }
        ]
    }
};

// Tüm turnuvalar (Puan Durumu için)
const TOURNAMENTS = {
    superlig: {
        id: 'superlig',
        name: 'Trendyol Süper Lig',
        shortName: 'Süper Lig',
        feedCode: 'to_ABdATjMP_2TRNmxYR_1',
        emoji: emojis.superlig,
        flag: '🇹🇷',
        topRankType: 'cl',
        url: 'https://www.flashscore.com/football/turkey/super-lig/standings/'
    },
    premierleague: {
        id: 'premierleague',
        name: 'Premier League',
        shortName: 'Premier League',
        feedCode: 'to_SY30SsKF_CfoA8Dmm_1',
        emoji: emojis.premierleague,
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        topRankType: 'cl',
        url: 'https://www.flashscore.com/football/england/premier-league/standings/'
    },
    laliga: {
        id: 'laliga',
        name: 'La Liga',
        shortName: 'La Liga',
        feedCode: 'to_QeI1Oeyi_dWdJXP6U_1',
        emoji: emojis.laliga,
        flag: '🇪🇸',
        topRankType: 'cl',
        url: 'https://www.flashscore.com/football/spain/laliga/standings/'
    },
    seriea: {
        id: 'seriea',
        name: 'Serie A',
        shortName: 'Serie A',
        feedCode: 'to_WdNk9YwP_CfujcOgK_1',
        emoji: emojis.seriea,
        flag: '🇮🇹',
        topRankType: 'cl',
        url: 'https://www.flashscore.com/football/italy/serie-a/standings/'
    },
    bundesliga: {
        id: 'bundesliga',
        name: 'Bundesliga',
        shortName: 'Bundesliga',
        feedCode: 'to_KY7LrA6d_jg0MwVuC_1',
        emoji: emojis.bundesliga,
        flag: '🇩🇪',
        topRankType: 'cl',
        url: 'https://www.flashscore.com/football/germany/bundesliga/standings/'
    },
    championsleague: {
        id: 'championsleague',
        name: 'UEFA Champions League',
        shortName: 'Şampiyonlar Ligi',
        feedCode: 'to_tfRdlhP9_vT1iNRGq_1',
        emoji: '⭐',
        flag: '🇪🇺',
        topRankType: 'euro',
        url: 'https://www.flashscore.com/football/europe/champions-league/standings/'
    },
    europaleague: {
        id: 'europaleague',
        name: 'UEFA Europa League',
        shortName: 'Avrupa Ligi',
        feedCode: 'to_nTFvUo9N_OjQOTQKa_1',
        emoji: '🏆',
        flag: '🇪🇺',
        topRankType: 'euro',
        url: 'https://www.flashscore.com/football/europe/europa-league/standings/'
    },
    conferenceleague: {
        id: 'conferenceleague',
        name: 'UEFA Conference League',
        shortName: 'Konferans Ligi',
        feedCode: 'to_zcdxsAHq_8WHkz50k_1',
        emoji: '🏅',
        flag: '🇪🇺',
        topRankType: 'euro',
        url: 'https://www.flashscore.com/football/europe/conference-league/standings/'
    }
};

// Bütün takımların düz listesi
const ALL_TEAMS = [];
for (const [leagueKey, league] of Object.entries(LEAGUES)) {
    for (const team of league.teams) {
        ALL_TEAMS.push({
            ...team,
            leagueId: leagueKey,
            leagueName: league.name,
            leagueEmoji: league.emoji
        });
    }
}

// Takım arama yardımcısı
function findTeam(val) {
    if (!val) return null;
    return ALL_TEAMS.find(t => 
        t.id === val || 
        t.name.toLowerCase() === val.toLowerCase() ||
        `sl_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` === val ||
        `pl_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` === val ||
        `ll_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` === val ||
        `sa_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` === val ||
        `bl_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` === val
    ) || null;
}

// Lig / Turnuva arama yardımcısı (puandurumu argümanı için)
function resolveTournament(query) {
    if (!query) return TOURNAMENTS.superlig;
    const q = query.toLowerCase().trim()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

    if (['superlig', 'super', 'tr', 'turkiye', 'turkey', 'sl'].includes(q)) return TOURNAMENTS.superlig;
    if (['premierleague', 'premier', 'pl', 'ingiltere', 'england', 'epl'].includes(q)) return TOURNAMENTS.premierleague;
    if (['laliga', 'ispanya', 'spain', 'll'].includes(q)) return TOURNAMENTS.laliga;
    if (['seriea', 'italya', 'italy', 'sa'].includes(q)) return TOURNAMENTS.seriea;
    if (['bundesliga', 'almanya', 'germany', 'bl'].includes(q)) return TOURNAMENTS.bundesliga;
    if (['championsleague', 'sampiyonlarligi', 'ucl', 'cl', 'sampiyonlar'].includes(q)) return TOURNAMENTS.championsleague;
    if (['europaleague', 'avrupaligi', 'uel', 'el', 'avrupa'].includes(q)) return TOURNAMENTS.europaleague;
    if (['conferenceleague', 'konferansligi', 'uecl', 'konferans'].includes(q)) return TOURNAMENTS.conferenceleague;

    return TOURNAMENTS.superlig;
}

module.exports = {
    LEAGUES,
    TOURNAMENTS,
    ALL_TEAMS,
    findTeam,
    resolveTournament
};
