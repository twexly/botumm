const { createCanvas } = require('canvas');
const fs = require('fs');
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

const width = 1000;
const height = 560;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 1. Dış Arka Plan (Discord Koyu Tema)
drawRoundRect(ctx, 0, 0, width, height, 24);
ctx.clip();
ctx.fillStyle = '#1e1f22';
ctx.fillRect(0, 0, width, height);

// Arka Plan İnce Çerçeve
ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
ctx.lineWidth = 2;
drawRoundRect(ctx, 1, 1, width - 2, height - 2, 23);
ctx.stroke();

// Üst Bilgi Başlığı
ctx.font = 'bold 24px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#f2f3f5';
ctx.fillText('DISCORD PANEL GÖRSEL ALANLARI REHBERİ', 40, 48);

ctx.font = '14px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#949ba4';
ctx.fillText('Aşağıdaki örnek panelde Thumbnail (Küçük Resim) ve Büyük Resim (Banner) alanları gösterilmiştir:', 40, 75);

// 2. Simüle Edilmiş Embed Kutusu
const embX = 40;
const embY = 100;
const embW = 540;
const embH = 425;

// Embed Gövdesi
drawRoundRect(ctx, embX, embY, embW, embH, 12);
ctx.fillStyle = '#2b2d31';
ctx.fill();

// Embed Sol Renk Çizgisi (Accent Bar)
drawRoundRect(ctx, embX, embY, 8, embH, 4);
ctx.fillStyle = '#5865f2';
ctx.fill();

// Embed İçeriği
ctx.font = 'bold 20px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('Destek Talebi Sistemi', embX + 28, embY + 42);

ctx.font = '13px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#dbdee1';
ctx.fillText('Bir sorun veya soru için yetkili ekibimizle', embX + 28, embY + 70);
ctx.fillText('iletişime geçmek için aşağıdaki butona basın.', embX + 28, embY + 90);

ctx.fillStyle = '#949ba4';
ctx.fillText('• Lütfen gereksiz yere talep açmayınız.', embX + 28, embY + 120);

// Simüle Edilmiş Buton
drawRoundRect(ctx, embX + 28, embY + 145, 170, 36, 8);
ctx.fillStyle = '#5865f2';
ctx.fill();
ctx.font = 'bold 14px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#ffffff';
ctx.fillText('Destek Talebi Aç', embX + 54, embY + 168);

// 3. THUMBNAIL KUTUSU (Embed içi sağ üst)
const thumbX = embX + embW - 125;
const thumbY = embY + 22;
const thumbSize = 98;

drawRoundRect(ctx, thumbX, thumbY, thumbSize, thumbSize, 10);
ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
ctx.fill();
ctx.strokeStyle = '#f43f5e';
ctx.lineWidth = 3;
ctx.setLineDash([6, 6]);
ctx.stroke();
ctx.setLineDash([]);

ctx.font = 'bold 13px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#fda4af';
ctx.textAlign = 'center';
ctx.fillText('THUMBNAIL', thumbX + thumbSize / 2, thumbY + thumbSize / 2 - 8);
ctx.font = '11px "Segoe UI", "Poppins", sans-serif';
ctx.fillText('(Küçük Resim)', thumbX + thumbSize / 2, thumbY + thumbSize / 2 + 10);
ctx.textAlign = 'left';

// 4. BÜYÜK RESİM (BANNER / IMAGE) KUTUSU (Embed içi alt geniş alan)
const bannerX = embX + 28;
const bannerY = embY + 200;
const bannerW = embW - 56;
const bannerH = 195;

drawRoundRect(ctx, bannerX, bannerY, bannerW, bannerH, 10);
ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
ctx.fill();
ctx.strokeStyle = '#38bdf8';
ctx.lineWidth = 3;
ctx.setLineDash([6, 6]);
ctx.stroke();
ctx.setLineDash([]);

ctx.font = 'bold 16px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#7dd3fc';
ctx.textAlign = 'center';
ctx.fillText('BÜYÜK RESİM (BANNER / AFİŞ)', bannerX + bannerW / 2, bannerY + bannerH / 2 - 10);
ctx.font = '12px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#bae6fd';
ctx.fillText('Embed mesajının en altında boydan boya duran geniş görseldir', bannerX + bannerW / 2, bannerY + bannerH / 2 + 14);
ctx.textAlign = 'left';

// 5. SAĞ TARAF: AÇIKLAMA KARTLARI
const infoX = 610;
const infoY = 100;
const infoW = 350;
const infoH = 425;

drawRoundRect(ctx, infoX, infoY, infoW, infoH, 16);
ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
ctx.fill();
ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
ctx.lineWidth = 1.5;
ctx.stroke();

// 1. Kutu: Thumbnail Açıklaması
drawRoundRect(ctx, infoX + 16, infoY + 16, infoW - 32, 175, 12);
ctx.fillStyle = 'rgba(244, 63, 94, 0.08)';
ctx.fill();
ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
ctx.lineWidth = 1.5;
ctx.stroke();

ctx.font = 'bold 16px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#f43f5e';
ctx.fillText('1. THUMBNAIL (Küçük Resim)', infoX + 30, infoY + 45);

ctx.font = '13px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#cbd5e1';
ctx.fillText('• Mesajın sağ üst köşesindeki küçük', infoX + 30, infoY + 74);
ctx.fillText('  kare logodur.', infoX + 30, infoY + 94);
ctx.fillText('• İstemiyorsanız "geç" yazabilirsiniz.', infoX + 30, infoY + 118);
ctx.fillText('• Resim linki atabilir veya yükleyebilirsiniz.', infoX + 30, infoY + 142);

// 2. Kutu: Büyük Resim Açıklaması
drawRoundRect(ctx, infoX + 16, infoY + 215, infoW - 32, 190, 12);
ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
ctx.fill();
ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
ctx.lineWidth = 1.5;
ctx.stroke();

ctx.font = 'bold 16px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#38bdf8';
ctx.fillText('2. BÜYÜK RESİM (Banner / Afiş)', infoX + 30, infoY + 245);

ctx.font = '13px "Segoe UI", "Poppins", sans-serif';
ctx.fillStyle = '#cbd5e1';
ctx.fillText('• Embed mesajının en altındaki geniş', infoX + 30, infoY + 274);
ctx.fillText('  afiş/banner görselidir.', infoX + 30, infoY + 294);
ctx.fillText('• Panelinizi çok daha şık gösterir.', infoX + 30, infoY + 318);
ctx.fillText('• İstemiyorsanız "geç" yazabilirsiniz.', infoX + 30, infoY + 342);
ctx.fillText('• Resim linki atabilir veya yükleyebilirsiniz.', infoX + 30, infoY + 366);

// 6. NEON OKLAR
// Ok 1 (Pembe ok -> Thumbnail)
ctx.save();
ctx.strokeStyle = '#f43f5e';
ctx.fillStyle = '#f43f5e';
ctx.lineWidth = 3.5;
ctx.shadowColor = 'rgba(244, 63, 94, 0.6)';
ctx.shadowBlur = 10;

ctx.beginPath();
ctx.moveTo(infoX + 16, infoY + 90);
ctx.quadraticCurveTo(thumbX + thumbSize + 40, thumbY + 10, thumbX + thumbSize + 8, thumbY + 45);
ctx.stroke();

const tip1X = thumbX + thumbSize + 8;
const tip1Y = thumbY + 45;
ctx.beginPath();
ctx.moveTo(tip1X, tip1Y);
ctx.lineTo(tip1X + 14, tip1Y - 10);
ctx.lineTo(tip1X + 16, tip1Y + 10);
ctx.closePath();
ctx.fill();
ctx.restore();

// Ok 2 (Mavi ok -> Büyük Resim)
ctx.save();
ctx.strokeStyle = '#38bdf8';
ctx.fillStyle = '#38bdf8';
ctx.lineWidth = 3.5;
ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
ctx.shadowBlur = 10;

ctx.beginPath();
ctx.moveTo(infoX + 16, infoY + 300);
ctx.quadraticCurveTo(bannerX + bannerW + 30, bannerY + 40, bannerX + bannerW + 8, bannerY + 70);
ctx.stroke();

const tip2X = bannerX + bannerW + 8;
const tip2Y = bannerY + 70;
ctx.beginPath();
ctx.moveTo(tip2X, tip2Y);
ctx.lineTo(tip2X + 14, tip2Y - 10);
ctx.lineTo(tip2X + 16, tip2Y + 10);
ctx.closePath();
ctx.fill();
ctx.restore();

const targetPath = path.join(__dirname, '..', 'assets', 'ticket_thumbnail_guide.png');
fs.writeFileSync(targetPath, canvas.toBuffer('image/png'));
console.log('Updated guide at:', targetPath);
