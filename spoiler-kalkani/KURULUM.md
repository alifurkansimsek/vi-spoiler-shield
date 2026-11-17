# Spoiler Kalkanı: kurulum

Görsel ve adım adım rehber için üst klasördeki **Kurulum.html** dosyasını tarayıcıda aç. Eklenti yüklenince bir karşılama sihirbazı da açılır.

Bu dosyada spoiler yok. Terim listesi `src/dictionary.js` içinde şifreli durur, resmi görsellerin yalnızca parmak izi saklanır.

## Kısa kurulum

1. Tarayıcının eklentiler sayfasını aç: `brave://extensions`, `chrome://extensions`, `edge://extensions`, `opera://extensions` ya da `vivaldi://extensions`.
2. **Geliştirici modunu** aç.
3. **Paketlenmemiş öğe yükle** ile bu `spoiler-kalkani` klasörünü seç. Klasörü taşıma ya da silme.
4. Açılan karşılama sihirbazını izle: araç çubuğuna sabitleme, gizli pencere izni, koruma düzeyi, tarayıcılar arası ayar paylaşımı.

## Ne zaman öğe, ne zaman sayfa gizlenir

- **Öğe gizlenir:** akış kartı, haber kartı, paragraf, yorum, görsel. Video durdurulur ve sessize alınır.
- **Sayfa kapanır:** yalnızca sayfanın kendisi oyunla ilgiliyse. Örneğin adresi, sekme başlığı ya da ana başlığı oyunu açıkça anıyorsa, sayfadaki metnin büyük kısmı oyunla ilgiliyse, ya da site oyuna ayrılmışsa. YouTube'da izlediğin videonun başlığı ya da altyazısı oyunla ilgiliyse video açılmaz.
- **Katı mod** yalnızca öğe gizler, sayfayı kapatmaz. Tek istisna YouTube'daki videonun kendisidir: başlığı, altyazısı ya da Shorts başlık alanı (kanal adı dahil) katı moda takılırsa video açılmaz.

## Tarayıcılar arası ayarlar

Ayarlar ve kendi terimlerin bu klasördeki `ayarlar.json` dosyasında tutulur. Her tarayıcıyı bir kez klasöre bağla (sihirbazda ya da Ayarlar > Tarayıcılar arası). Bir tarayıcıda yaptığın değişiklik diğerine bir iki dakika içinde geçer. Engel geçmişi paylaşılmaz, her tarayıcıda ayrı kalır.

## Engel geçmişi

Saat, site ve gizlenen öğe sayısı saklanır. Gizlenen içeriğin kendisi saklanmaz. Sayfa adresinin yolu şifreli tutulur ve yalnızca sen isteyince açılır. Anahtar tarayıcıda verinin yanında durur: kazara görmeyi engeller, bilgisayarına erişen birini değil. Gizli pencereler hiç kaydedilmez. Kaydı ayarlardan kapatabilir ya da silebilirsin.

## Eklentinin göremediği yerler

- **Yeni sekme akışı:** Edge'in MSN haberleri ve Brave News. Sihirbaz nasıl kapatılacağını gösterir.
- **Adres çubuğu önerileri:** tarayıcı ayarlarından kapat.
- **Telefon ve masaüstü uygulamaları:** YouTube, X, Discord uygulamaları ve sistem bildirimleri tarayıcının dışındadır.
- **Tarayıcının kendi sayfaları:** `chrome://` adresleri ve eklenti mağazası taranamaz.

## Yakalanması zor içerik

- **Metni olmayan yeni görseller:** oyuncu ekran görüntüsü, meme ya da video karesi, başlığı ya da açıklaması yoksa ve resmi bir görselin kopyası değilse tanınmaz.
- **Videonun içi:** kareler ve ses taranmaz.
- **Oyunun adını anmayan spoiler:** yeni isimleri ayarlardan, sağ tıkla ya da otomatik terim listesiyle ekle.

## Katı mod

Varsayılan olarak açıktır. Oyun bağlamında geçen stüdyo adını, tek başına şehir adını ve numarasız seri adını da gizler. "GTA 5", "San Andreas", "GTA Online" gibi açıkça eski bir oyunu belirten ifadeler görünür kalır. Bedeli, Rockstar'ın diğer oyunlarıyla ilgili bazı içeriklerin de gizlenmesidir. Ayarlardan ya da eklenti simgesinden kapatılabilir.
