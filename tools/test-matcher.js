// Text-engine unit tests. Universe names are ROT13 so results stay spoiler-free.
const path = require('path');
const ext = process.argv[2];
require(path.join(ext, 'src/dictionary.js'));
require(path.join(ext, 'src/matcher.js'));
const G6S = globalThis.G6S; const { hasMatch, hasMatchUrl, rot13 } = G6S;

const pos = [
  'GTA 6', 'gta6', 'GTA VI', 'gtavi', 'GTA-6', 'GTA_VI', 'G.T.A. 6', 'G T A 6', 'G-T-A VI', '#GTA6', '#GTAVI', 'GTA: VI', 'GTA (6)',
  "GTA 6'nın çıkış tarihi", "GTA VI'yı bekliyorum", "gta6'ya", 'GTA 6 hakkında', 'gta vı inceleme', 'GTA Vİ inceleme', 'GTA altı',
  'Grand Theft Auto 6', 'Grand Theft Auto VI', 'GRAND THEFT AUTO VI', 'Grand-Theft-Auto: VI', 'Grand Theft Auto Six',
  'GТА 6', 'ГТА 6', 'гта6', 'Ｇ Ｔ Ａ ６', '𝐆𝐓𝐀 𝟔', 'G​T​A​ 6', 'GTA Ⅵ', 'GTA ⑥', 'G T A 6️⃣', '🇬🇹🇦 6', 'G7A 6',
  'グランド・セフト・オートVI', 'グラセフ6', '侠盗猎车手6', '俠盜獵車手VI', '그랜드 테프트 오토 6', 'جي تي ايه 6', 'гранд тефт авто 6',
  'yeni GTA ne zaman', 'next GTA game', 'upcoming GTA', "Rockstar's next game", 'GTA 5 and 6 compared', 'GTA V vs VI',
  rot13('Yrbavqnqn lnfnznx'), '#' + rot13('YrbavqnXrlf'), rot13('#WnfbaQhiny'), rot13('Cbeg Tryyubeaqn'), rot13('Wnfba Qhiny'), rot13('YHPVN PNZVABF'), rot13('Yrbavqn'), rot13('Cbeg Tryyubea'), rot13("Yhpvn Pnzvabf'va")
];
const posWeak = [
  rot13('Wnfba naq Yhpvn ner ba gur eha'),
  rot13('Yhpvn') + ' Rockstar trailer',
  rot13('Wnfba') + ' in the new GTA trailer',
  rot13('Ivpr Pvgl') + ' 2026 trailer from Rockstar',
  '19th November 2026 #grandtheftauto #rockstargames #gaming',
  "Rockstar Said 'Trailer 3'... Then Kept Going",
  "Rockstar oyunu 19 Kasım'da çıkıyor",
  "Rockstar gerçek Miami'yi oyuna taşımış",
  "Rockstar Games'in gizlediği o tarih tesadüfü",
  'A Night in Vice City',
  'GTA fanları 19.11.2026 için izin aldı',
  'Rockstar üçüncü fragman ne zaman',
  rot13("Ra vlv cresbeznaf xngrtbevfvaqr Yhpvn'lı nqnl töfgrezvşyre b mnzna Yhpvn'aıa uvxnlrfv qrevayvğv blanaışı Wnfba'n töer çbx qnun vlv tnyvon. Mngra sentznayneqna vmyrqvğvzvm xnqneılyn Yhpvn qnun ov pnan lnxıa ove xnenxgreqv"), rot13("Yhpvn vf jnl zber vagrerfgvat guna Wnfba va gur genvyref, V ubcr gur fgbel zbqr yrgf hf fjvgpu"),
];
const neg = [
  'GTA 5', 'GTA V', 'GTA IV', 'GTA San Andreas', 'GTA Online', 'GTA Vice City', 'GTA: Vice City Stories 2006', 'GTA Vice City Definitive Edition',
  'Grand Theft Auto V', 'Grand Theft Auto IV', 'GTA 5 6 saat oynadım'.replace('6 saat', '12 saat'), 'Best of GTA 6 hours ago', 'GTA 6 saat önce', 'GTA 60 fps', 'GTA 5.6 update', 'GTA 6.5 km',
  'vegetarian 6', 'magenta 6', 'Regatta 6', 'agta6x', 'Gita 6', 'Toyota 6', 'Porsche GT4 6 speed', 'GT 6', 'Gran Turismo 6', 'FIFA 6', 'Windows VI', 'Rocky VI', 'Henry VI', 'Star Wars VI',
  'Jason Statham new movie', 'Jason Momoa', 'Lucia Di Lammermoor at the opera', 'Santa Lucia', 'Ambrosia salad recipe', 'Miami Vice', 'New GTA Online update', 'New GTA 5 mods', 'Rockstar energy drink', 'a rock star', 'new game from Nintendo', 'Roxy Music', 'Post Malone - rockstar ft. 21 Savage', 'Rockstar energy drink new flavor', 'He lived like a rockstar on tour', 'Jason Schreier wrote about a game trailer', 'his twins Leonidas (b. 1927) and Alexandros', 'Jason Voorhees gameplay trailer', 'Lucia trailer PS5 gameplay', 'Red Dead Redemption 2: Official Trailer #3 Rockstar Games', '19 Kasım Dünya Tuvalet Günü', 'GTA 5 PS3 version 19 November 2013 patch', 'Trailer 3 of the new Marvel movie', 'Grand Theft Auto IV: a third trailer was released on 6 December 2007', '674 6', '67 6', '6 7 a 6 b',
  rot13("Wnfba jbexf ng gur onax qbjagbja. Yhpvn grnpurf Fcnavfu va Znqevq."), rot13("Wnfba vyr gnaışgız, Yhpvn qr tryqv, lrzrğr tvggvx"), rot13("Bhe fba Wnfba naq bhe qnhtugre Yhpvn tenqhngrq guvf fcevat")
];
const posUrl = ['https://x.com/gta-6-trailer', 'https://x.com/a/gta_vi.jpg', 'https://x.com/GTA%206/', 'https://x.com/q?s=gta+6', 'https://x.com/grand-theft-auto-vi/', 'https://i.ytimg.com/vi/QdBZY2fkU-0/hq.jpg', 'https://x.com/' + rot13('wnfba-qhiny') + '.png'];
const negUrl = ['https://x.com/gta-5-trailer', 'https://x.com/gta-v/', 'https://x.com/img/photo6.jpg', 'https://x.com/vi/hello', 'data:text/plain,gta 6'];

let fail = 0;
const check = (fn, list, want, label) => { for (const t of list) if (fn(t) !== want) { fail++; console.log(`FAIL ${label}: ${JSON.stringify(rot13(t))} (rot13)`); } };
check(hasMatch, pos, true, 'should match');
check(hasMatch, posWeak, true, 'weak should match');
// General negatives must hold with strict mode off. With it on, older Rockstar titles are hidden by design.
G6S.setStrict(false);
check(hasMatch, neg, false, 'should NOT match (strict off)');
G6S.setStrict(true);
const strictOnlyHits = ['GTA Vice City', 'Red Dead Redemption 2: Official Trailer #3 Rockstar Games', 'Best of GTA 6 hours ago', 'GTA 6 saat önce', 'GTA 60 fps', 'GTA 6.5 km'];
const strictBare = ['GTA Week', "What's the best GTA?", 'Biggest game releases of the year #gaming #gta #zelda', 'Some of the best Grand Theft Auto pieces'];
const strictBareKeep = ['GTA 5 hileleri', 'Grand Theft Auto V 2013', 'GTA San Andreas incelemesi', 'GTA Online yeni güncelleme', 'GTA IV', 'Grand Theft Auto: San Andreas is GTA 5 without the finesse'];
check(hasMatch, strictBare, true, 'strict bare series should match');
check(hasMatch, [['Trending','Futbol','Dolar','Hava durumu','Secim','Deprem','Borsa','GTA','Konser','Mac'].join(String.fromCharCode(10))], true, 'strict bare name in a one-word list should match');
check(hasMatch, strictBareKeep, false, 'strict explicit older entry should NOT match');
check(hasMatch, strictOnlyHits, true, 'strict on should match');
check(hasMatch, neg.filter(t => !strictOnlyHits.includes(t)), false, 'should NOT match (strict on)');
check(hasMatchUrl, posUrl, true, 'url should match');
check(hasMatchUrl, negUrl, false, 'url should NOT match');
G6S.setStrict(false);
check(hasMatch, ["Rockstar Games'in gizlediği o tarih tesadüfü", 'A Night in Vice City', 'Rockstar Games RDR2 trailer'], false, 'strict off should NOT match');
check(hasMatch, ['GTA 6', '19th November 2026 #grandtheftauto'], true, 'strict off should still match');
G6S.setStrict(true);
const total = 7 + neg.length - 2 + pos.length + posWeak.length + neg.length + posUrl.length + negUrl.length;
console.log(`${total - fail}/${total} passed`);

// Speed on a big document
const big = ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Türkçe metin ve şöyle böyle. '.repeat(12000));
const t0 = performance.now(); hasMatch(big); console.log('1MB scan ms', (performance.now() - t0).toFixed(1), 'chars', big.length);
process.exit(fail ? 1 : 0);
