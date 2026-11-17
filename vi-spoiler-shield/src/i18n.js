// Interface strings in Turkish and English. The language follows the "lang" setting
// ('auto', 'tr' or 'en'); 'auto' follows the browser's language.
(function (g) {
  const S = {
    tr: {
      name: 'VI Spoiler Kalkanı',
      nameShort: 'Spoiler Kalkanı',
      nameTwoLine: 'VI Spoiler<br>Kalkanı',

      // Shared
      on: 'Koruma açık', off: 'Koruma kapalı', offHere: 'Bu sitede kapalı',
      sure: 'Emin misin? Tekrar tıkla',
      kText: 'Metin', kImage: 'Görsel', kVideo: 'Video', kPage: 'Sayfa',
      kTextLc: 'metin', kImageLc: 'görsel', kVideoLc: 'video', kPageLc: 'sayfa',
      today: 'bugün', week: 'son 7 gün', total: 'toplam',
      settings: 'Ayarlar',

      // Popup
      pHidden: 'bu sayfada gizlendi',
      pBrowserPage: 'Tarayıcının kendi sayfalarında eklentiler çalışamaz',
      pRecent: 'Son engeller', pAll: 'Tüm geçmiş',
      pEmpty: 'Henüz bir şey gizlenmedi.', pLogOff: 'Geçmiş kaydı kapalı.',
      pSite: 'Koruma:', pThisSite: 'bu site', pSiteTip: 'Kapatırsan eklenti bu sitede hiç çalışmaz',
      pSiteSure: 'emin misin? tekrar bas',
      strict: 'Katı mod', pStrictTip: 'Oyunun adını anmayan imaları da gizler',
      pOff: 'Korumayı kapat', pOn: 'Korumayı aç', pOffSure: 'Her yerde kapanacak. Tekrar tıkla',
      pListNone: 'Terim listesi henüz indirilmedi',
      pListOk: 'Terim listesi {date} tarihinde güncellendi', pListFail: ' · son deneme başarısız',
      pListUnreach: 'Terim listesine ulaşılamadı, yerleşik liste kullanılıyor',

      // Options
      oTitle: 'VI Spoiler Kalkanı Ayarları',
      tabProtection: 'Koruma', tabHistory: 'Geçmiş', tabLists: 'Listeler', tabSync: 'Tarayıcılar arası', tabLimits: 'Neyi kaçırabilir',
      version: 'Sürüm',
      oProtectionLead: 'Değişiklikler hemen kaydedilir. Açık sekmeler yenilenince geçerli olur.',
      oEverywhere: 'Her sitede çalışıyor.', oExcept: '{n} site dışında her yerde çalışıyor.', oNowhere: 'Hiçbir sitede içerik gizlenmiyor.',
      oTurnOff: 'Kapat', oTurnOn: 'Aç',
      oLanguage: 'Dil', oLanguageDesc: 'Eklentinin bütün ekranlarındaki dil.', langAuto: 'Otomatik (tarayıcı dili)',
      oStrictDesc: 'Oyunun adını anmayan imaları da gizler: oyun bağlamında stüdyo adı, şehir adı, numarasız seri adı. Rockstar\'ın eski oyunlarıyla ilgili bazı içerikler de gizlenebilir.',
      oVisual: 'Görselleri parmak iziyle kontrol et', oVisualDesc: 'Metni olmayan resmi oyun görsellerini yakalar. Görseller bir an geç açılır ve biraz fazla veri harcanır.',
      oPlaceholders: 'Akış kartlarının yerine uyarı göster', oPlaceholdersDesc: 'Kapalıyken YouTube, X, Reddit gibi akışlarda kart iz bırakmadan kaybolur.',
      oLogging: 'Engel geçmişini kaydet', oLoggingDesc: 'Saat, site ve gizlenen öğe sayısı saklanır. Gizli pencereler hiç kaydedilmez.',
      oHistoryLead: 'Gizlenen içeriğin kendisi saklanmaz. Sayfa adresinin yolu şifreli tutulur ve yalnızca sen isteyince açılır.',
      oLast14: 'Son 14 gün', oFilter: 'Siteye göre süz, örn. youtube', oClear: 'Geçmişi sil',
      thTime: 'Zaman', thSite: 'Site', thHidden: 'Gizlenen', thPath: 'Sayfa yolu',
      oShow: 'Göster', oNoLog: 'Kayıt yok.', oLogOffNote: 'Geçmiş kaydı kapalı. Koruma bölümünden açabilirsin.',
      oKeyNote: 'Şifreleme anahtarı tarayıcıda verinin yanında durur: kazara görmeyi engeller, bilgisayarına erişen birini değil.',
      oRevealConfirm: 'Adres yolu spoiler içerebilir (ör. haber başlığı). Göstermek istiyor musun?', oCantOpen: 'Açılamadı',
      oClearConfirm: 'Tüm engel geçmişi ve istatistikler silinsin mi? Geri alınamaz.', oCleared: 'Geçmiş silindi',
      oListsLead: 'Yerleşik terim listesi burada gösterilmez, çünkü listenin kendisi de spoiler sayılır.',
      oTerms: 'Kendi terimlerin', oTermsDesc: 'Çıkıştan sonra öğrendiğin yeni isimler. Her satıra bir terim.',
      oBlockSites: 'Her zaman engellenecek siteler', oBlockSitesDesc: 'Her satıra bir alan adı, örn. ornek.com',
      oAllowSites: 'Korumanın kapalı olduğu siteler', oAllowSitesDesc: 'Bu sitelerde eklenti hiç çalışmaz.',
      oSaveLists: 'Listeleri kaydet', oListsSaved: 'Listeler kaydedildi', saved: 'Kaydedildi',
      oRemote: 'Otomatik terim listesi', oRemoteDesc: 'Çıkıştan sonra ortaya çıkan yeni isimler bu adresten günde birkaç kez çekilir. Liste yalnızca ekleme yapabilir; yerleşik korumayı kapatamaz, site serbest bırakamaz.',
      oListUrl: 'Liste adresi', oRefresh: 'Şimdi güncelle', oHttps: 'Adres https:// ile başlamalı', oChecked: 'Liste kontrol edildi',
      oRemoteNone: 'Henüz indirilmedi.', oRemoteOk: 'Son başarılı güncelleme: {date} · {s} terim, {v} video, {d} site.', oRemoteNoOk: 'Henüz başarılı bir indirme yok.', oRemoteErr: ' Son deneme: {e}.',
      oSyncLead: 'Eklenti her tarayıcıda aynı klasörden çalışır. Ayarların o klasördeki ayarlar.json dosyasında tutulur: bir tarayıcıda terim eklersen diğeri onu bir iki dakika içinde alır.',
      sNone: 'Klasör bağlı değil', sNoneSub: 'Bu tarayıcıyı klasöre bir kez bağla.', sLink: 'Klasörü bağla',
      sPerm: 'Klasör bağlı, izin gerekiyor', sPermSub: 'Tarayıcı yeniden açılınca izin bir kez daha istenebilir.', sGrant: 'İzin ver',
      sReady: 'Klasör bağlı', sReadySub: 'Ayarlar klasörle eşitleniyor.', sLastWrite: 'Son yazma: {date}', sSyncNow: 'Şimdi eşitle',
      sUnsupported: 'Bu tarayıcı klasöre yazmayı desteklemiyor', sUnsupportedSub: 'Dışa/içe aktarma düğmelerini kullan.',
      sBrave: 'Brave klasöre yazamıyor, yalnızca okuyor', sBraveSub: 'Diğer tarayıcıdaki değişiklikler buraya gelir. Buradaki değişiklikleri göndermek için brave://flags/#file-system-access-api seçeneğini aç ya da "Ayarları dosyaya aktar" ile indirdiğin dosyayı vi-spoiler-shield klasörüne ayarlar.json adıyla kaydet.',
      sStep1: '"Klasörü bağla"ya bas ve eklentiyi yüklediğin vi-spoiler-shield klasörünü seç.',
      sStep2: 'Tarayıcı düzenleme izni sorarsa "Her ziyarette izin ver"i seç.',
      sStep3: 'Eklentiyi kullandığın her tarayıcıda bunu bir kez yap.',
      sExport: 'Ayarları dosyaya aktar', sImport: 'Dosyadan içe aktar',
      sLinked: 'Klasör bağlandı', sGranted: 'İzin verildi', sSynced: 'Eşitlendi', sImported: 'Ayarlar içe aktarıldı', sBadFile: 'Bu dosya bir VI Spoiler Kalkanı ayar dosyası değil',
      sWrongFolder: 'Bu klasör eklentinin klasörü değil. İçinde manifest.json olan vi-spoiler-shield klasörünü seç.',
      oProtectionOff: 'Koruma kapatıldı', oProtectionOn: 'Koruma açıldı',
      oLimitsLead: 'Hiçbir eklenti her şeyi yakalayamaz. Bilerek karar ver diye açıkça yazıyorum.',
      oReopen: 'Kurulum sihirbazını yeniden aç',
      lImg: 'Yazısız görseller', lImgDesc: 'Başlığı, açıklaması olmayan bir ekran görüntüsü resmi bir görselin kopyası değilse tanınmaz.',
      lVid: 'Videonun içi', lVidDesc: 'Kareler ve ses taranmaz. Başlık ve açıklama ipucu vermiyorsa video açılabilir.',
      lNews: 'Yeni sekme ve adres çubuğu', lNewsDesc: 'Edge ve Brave\'in yeni sekme haberleri ile adres çubuğu önerileri eklentilere kapalıdır. Tarayıcı ayarlarından kapat.',
      lInc: 'Gizli pencereler', lIncDesc: 'Eklentiler sayfasında "Gizli modda izin ver" açık değilse gizli pencereler korunmaz.',
      tabAbout: 'Hakkında', aLead: 'Oyunu kendisi oynamayı bekleyen herkes için ücretsiz ve açık kaynak bir eklenti.',
      aMadeBy: 'PC sürümünü bekleyen <b>Ali Furkan Şimşek</b> tarafından geliştirildi.',
      aGithub: 'GitHub\'daki kaynak kodu', aIssue: 'Kaçan bir spoiler bildir', aIssueNote: 'Bildirirken başlığı ve açıklamayı spoiler\'sız tut.',
      aDisclaimer: 'Rockstar Games ya da Take-Two Interactive ile bağlantılı değildir. Logo ve görseller projenin kendisine aittir.',
      uCard: 'Güncelleme', uAvail: 'Yeni sürüm hazır: {v}', uSub: 'Şu an {c} kullanıyorsun. Geçmişin ve ayarların korunur.',
      uDownload: 'İndir', uHow: 'Nasıl güncellenir?', uCheck: 'Şimdi kontrol et', uChecking: 'Kontrol ediliyor…',
      uLatest: 'En yeni sürümü kullanıyorsun ({c}).', uFail: 'Yeni sürüm kontrol edilemedi. Daha sonra tekrar denenecek.',
      upTitle: 'Nasıl güncellenir', upVersions: 'Senin sürümün: {c} · En yeni: {v}',
      upLead: 'Tarayıcılar, klasörden yüklenen eklentileri kendileri güncellemez. Dört adımda, iki dakikada güncellersin; geçmişin ve ayarların korunur.',
      upS1T: 'Zip\'i indir', upS1: 'Yeni sürümün zip dosyası tek tıkla iner.',
      upS2T: 'Zip\'i çıkar', upS2: 'İçinde vi-spoiler-shield adında bir klasör var.',
      upS3T: 'Dosyaları eski klasörün üzerine kopyala', upS3: 'Yeni vi-spoiler-shield klasörünün içindeki her şeyi, eklentiyi yüklediğin klasörün içine kopyala ve "Dosyaları değiştir"i seç. O klasörün yerini eklentiler sayfasında, eklentinin "Ayrıntılar" bölümündeki "Kaynak" satırında görebilirsin.',
      upS4T: 'Eklentiyi yenile', upS4: 'Eklentiler sayfasında VI Spoiler Kalkanı\'nın yenile simgesine bas, sonra açık sekmelerini yenile.',
      upOpenExt: 'Eklentiler sayfasını aç', upLatestNow: 'Zaten en yeni sürümü kullanıyorsun.',
      upWarn: 'Eski eklentiyi kaldırıp yeni klasörü ayrıca yükleme: tarayıcı bunu yeni bir eklenti sayar ve geçmişin sıfırlanır.',
      uOneClick: 'Tek tıkla güncelle', uoTitle: 'Tek tıkla güncelle', uoManual: 'Ya da elle güncelle',
      uoLead: 'Eklenti yeni sürümü GitHub\'dan indirir, kendi klasörüne yazar ve yeniden başlar. İlk seferde eklenti klasörünü seçmen istenir (vi-spoiler-shield); izin sorulursa "Her ziyarette izin ver"i seç.',
      uoBrave: 'Brave\'de klasöre yazma özelliği varsayılan olarak kapalı. brave://flags/#file-system-access-api seçeneğini açıp Brave\'i yeniden başlatırsan tek tıkla güncelleme de çalışır; yoksa aşağıdaki adımlarla elle güncelle.',
      uoLinking: 'Klasöre erişim isteniyor…', uoVerify: 'Klasör kontrol ediliyor…', uoDownload: 'Yeni sürüm indiriliyor…', uoCheck: 'İndirilen sürüm doğrulanıyor…',
      uoWrite: 'Dosyalar yazılıyor… ({n}/{t})', uoRestart: 'Bitti, eklenti yeniden başlıyor…',
      uoWrongFolder: 'Bağlı klasör, çalışan eklentinin klasörü değil. Eklentiyi yüklediğin vi-spoiler-shield klasörünü seç.',
      uoPermission: 'Klasöre yazma izni verilmedi. Tekrar deneyip "Her ziyarette izin ver"i seç.',
      uoBad: 'İndirilen dosya doğrulanamadı; hiçbir şey değiştirilmedi.', uoFail: 'Güncelleme tamamlanamadı ({e}). Aşağıdaki adımlarla elle güncelleyebilirsin.',
      uoDone: 'Güncellendi: {v}. Açık sekmelerini yenilemeyi unutma.',

      // Blocked page and in-page shield
      bTitle: 'Bu sayfa gizlendi',
      bNet: 'Bağlantı, henüz oynamadığın oyunla ilgili görünüyor. Sayfayı daha yüklenmeden durdurdum.',
      bPage: 'Sayfa, henüz oynamadığın oyunla ilgili görünüyor. Spoiler görmemen için içeriğini kapattım.',
      bBack: 'Geri dön', bShow: 'Yine de göster',
      mask: '🛡 Spoiler gizlendi · Göstermek için çift tıkla',
      revealConfirm: 'Bu içerik spoiler olabilir. Yine de göstermek istiyor musun?',
      notifHidden: 'Bir bildirim gizlendi.',

      // Context menus
      mImage: 'Bu görseli spoiler olarak engelle', mTerm: 'Seçili metni engelleme listesine ekle', mSite: 'Bu siteyi tamamen engelle',

      // Welcome
      wTitle: 'VI Spoiler Kalkanı Kurulumu',
      rStart: 'Başlangıç', rPin: 'Sabitle', rIncognito: 'Gizli pencere', rMode: 'Mod', rBrowsers: 'Tarayıcılar', rNewTab: 'Yeni sekme', rDone: 'Hazır',
      w0Title: 'Oyunu sen oynayana kadar<br>kimse anlatmasın.',
      w0Lead: 'VI Spoiler Kalkanı, oyunla ilgili haberleri, görselleri ve videoları sen görmeden önce kapatır. Kurulum iki dakika sürer.',
      w0F1: 'Metinler ekrana çizilmeden gizlenir.', w0F2: 'Resmi görsellerin kopyaları parmak iziyle tanınır.', w0F3: 'YouTube videoları başlığı kontrol edilmeden oynamaz.',
      w1Title: 'Araç çubuğuna sabitle', w1Lead: 'Kaç şeyin gizlendiğini görmek ve bir siteyi tek tıkla yönetmek için simge hep görünür kalsın.',
      w1S1: 'Adres çubuğunun sağındaki yapboz parçası simgesine bas.', w1S2: 'VI Spoiler Kalkanı\'nın yanındaki raptiyeye bas.',
      checking: 'Kontrol ediliyor...', pinned: 'Sabitlendi.', notPinned: 'Henüz sabitlenmedi.', pinUnknown: 'Bu tarayıcı durumu bildirmiyor; adımları izlemen yeterli.',
      w2Title: 'Gizli pencerelerde de koru', w2Lead: 'Tarayıcılar eklentileri gizli pencerelerde varsayılan olarak kapatır. Spoiler en çok oradan sızar.',
      w2S1: 'Aşağıdaki düğmeyle eklentinin ayar sayfasını aç.', w2S2: '"Gizli modda izin ver" seçeneğini aç.', w2Open: 'Eklenti ayarlarını aç',
      incOn: 'Gizli pencerelerde açık.', incOff: 'Gizli pencerelerde henüz kapalı.', incUnknown: 'Durum okunamadı.',
      w3Title: 'Ne kadar sıkı olsun?', w3Lead: 'İstediğin zaman eklenti simgesinden değiştirebilirsin.',
      w3Strict: 'Katı', w3StrictDesc: 'Adını anmayan imaları da gizler: oyun bağlamında stüdyo adı, şehir adı, numarasız seri adı. Rockstar\'ın eski oyunlarıyla ilgili bazı içerikler de gider.', w3Rec: 'Önerilen',
      w3Balanced: 'Dengeli', w3BalancedDesc: 'Yalnızca oyunun adı, numarası ve evrenine ait isimler. Eski oyunlarla ilgili içerik dokunulmadan kalır.',
      w4Title: 'Tüm tarayıcılarında aynı ayarlar', w4Lead: 'Eklenti her tarayıcıda aynı klasörden çalışır. Bu tarayıcıyı o klasöre bağlarsan eklediğin terimler ve ayarlar diğer tarayıcılara da geçer.',
      w4Hint: 'Açılan pencerede vi-spoiler-shield klasörünü seç, düzenleme izni sorulursa "Her ziyarette izin ver"i seç.', w4Linked: 'Klasör bağlandı.',
      w4Brave: 'Brave bu klasöre yazamıyor ama okuyabiliyor: başka bir tarayıcıda yaptığın değişiklikler buraya kendiliğinden gelir. Buradan göndermek istersen Ayarlar > Tarayıcılar arası bölümündeki adımları izle.',
      w4Unsupported: 'Bu tarayıcı klasöre yazmayı desteklemiyor. Ayarlar sayfasındaki dışa/içe aktarmayı kullanabilirsin.',
      w5Title: 'Yeni sekmedeki haberleri kapat', w5Lead: 'Tarayıcının kendi yeni sekme sayfası ve adres çubuğu önerileri eklentilere kapalıdır. Buradan sızmasın diye bir kez kapat.',
      w5Mine: '{b} (şu an kullandığın)',
      hBrave: ['Yeni bir sekme aç.', 'Sağ alttaki "Özelleştir"e bas.', '"Brave News" ve "Kartlar" seçeneklerini kapat.', 'Ayarlar > Arama motoru bölümünde "Arama önerilerini göster"i kapat.'],
      hEdge: ['Yeni bir sekme aç.', 'Sağ üstteki dişliye bas.', '"İçerik" ya da "Haber akışını göster" seçeneğini kapat.', 'Ayarlar > Gizlilik > Adres çubuğu ve arama bölümünde öneri seçeneklerini kapat.'],
      hChrome: ['Yeni bir sekme aç, sağ alttaki "Chrome\'u özelleştir"e bas.', '"Kartları göster" seçeneğini kapat.', 'Ayarlar > Google ve siz > Senkronizasyon ve Google hizmetleri bölümünde "Aramaları ve URL\'leri otomatik tamamla"yı kapat.'],
      hOpera: ['Ayarlar > Başlangıç sayfası bölümünde haber akışını kapat.', 'Eklentiler sayfasında VI Spoiler Kalkanı için "Arama sayfası sonuçlarına erişime izin ver"i aç.'],
      w6Title: 'Hazırsın.', w6Lead: 'Aşağıya bir başlık yaz, kalkanın onu gizleyip gizlemeyeceğini gör. Bu bir örnek; gerçek sitelerde aynı kurallar çalışır.',
      w6Placeholder: 'Örneğin: Haftanın en çok satan oyunları',
      wouldHide: 'Gizlenirdi', visible: 'Görünür',
      demo: ['Hafta sonu hava durumu: İstanbul\'a yağmur geliyor', 'GTA 6 için ön sipariş rekoru kırıldı', 'Derbi maçının özeti ve tüm goller', 'Grand Theft Auto VI ilk 10 dakika incelemesi', 'Rockstar\'ın yeni oyunu hakkında bilinen her şey'],
      back: 'Geri', next: 'Devam', start: 'Başlayalım', finish: 'Bitir'
    },
    en: {
      name: 'VI Spoiler Shield',
      nameShort: 'Spoiler Shield',
      nameTwoLine: 'VI Spoiler<br>Shield',

      on: 'Protection on', off: 'Protection off', offHere: 'Off on this site',
      sure: 'Sure? Click again',
      kText: 'Text', kImage: 'Image', kVideo: 'Video', kPage: 'Page',
      kTextLc: 'text', kImageLc: 'image', kVideoLc: 'video', kPageLc: 'page',
      today: 'today', week: 'last 7 days', total: 'total',
      settings: 'Settings',

      pHidden: 'hidden on this page',
      pBrowserPage: 'Extensions cannot run on the browser\'s own pages',
      pRecent: 'Recently blocked', pAll: 'Full history',
      pEmpty: 'Nothing hidden yet.', pLogOff: 'History is turned off.',
      pSite: 'Protection:', pThisSite: 'this site', pSiteTip: 'Turned off, the extension does nothing on this site',
      pSiteSure: 'sure? click again',
      strict: 'Strict mode', pStrictTip: 'Also hides hints that never name the game',
      pOff: 'Turn protection off', pOn: 'Turn protection on', pOffSure: 'Off everywhere. Click again',
      pListNone: 'Term list not downloaded yet',
      pListOk: 'Term list updated on {date}', pListFail: ' · last attempt failed',
      pListUnreach: 'Term list unreachable, using the built-in list',

      oTitle: 'VI Spoiler Shield Settings',
      tabProtection: 'Protection', tabHistory: 'History', tabLists: 'Lists', tabSync: 'Across browsers', tabLimits: 'What it can miss',
      version: 'Version',
      oProtectionLead: 'Changes are saved at once. Open tabs pick them up when reloaded.',
      oEverywhere: 'Active on every site.', oExcept: 'Active everywhere except {n} sites.', oNowhere: 'Nothing is being hidden anywhere.',
      oTurnOff: 'Turn off', oTurnOn: 'Turn on',
      oLanguage: 'Language', oLanguageDesc: 'The language of every screen in the extension.', langAuto: 'Automatic (browser language)',
      oStrictDesc: 'Also hides hints that never name the game: the studio\'s name in a gaming context, the city\'s name, the series name without a number. Some content about older Rockstar games may be hidden too.',
      oVisual: 'Check images by fingerprint', oVisualDesc: 'Catches official game images that carry no text. Images appear a moment later and use a little more data.',
      oPlaceholders: 'Show a notice in place of feed cards', oPlaceholdersDesc: 'When off, cards on feeds like YouTube, X and Reddit disappear without a trace.',
      oLogging: 'Keep a block history', oLoggingDesc: 'Stores the time, the site and how many items were hidden. Private windows are never recorded.',
      oHistoryLead: 'What was hidden is never stored. The page path is kept encrypted and opened only when you ask.',
      oLast14: 'Last 14 days', oFilter: 'Filter by site, e.g. youtube', oClear: 'Clear history',
      thTime: 'Time', thSite: 'Site', thHidden: 'Hidden', thPath: 'Page path',
      oShow: 'Show', oNoLog: 'No entries.', oLogOffNote: 'History is turned off. You can turn it on under Protection.',
      oKeyNote: 'The encryption key sits next to the data in the browser: it stops accidental reading, not someone with access to your computer.',
      oRevealConfirm: 'The page path may contain a spoiler (a headline, for example). Show it?', oCantOpen: 'Could not open',
      oClearConfirm: 'Delete the whole block history and the statistics? This cannot be undone.', oCleared: 'History cleared',
      oListsLead: 'The built-in term list is not shown here, because the list itself is a spoiler.',
      oTerms: 'Your own terms', oTermsDesc: 'New names you learn after release. One term per line.',
      oBlockSites: 'Always block these sites', oBlockSitesDesc: 'One domain per line, e.g. example.com',
      oAllowSites: 'Protection off on these sites', oAllowSitesDesc: 'The extension does nothing on these sites.',
      oSaveLists: 'Save lists', oListsSaved: 'Lists saved', saved: 'Saved',
      oRemote: 'Automatic term list', oRemoteDesc: 'New names that surface after release are fetched from this address a few times a day. The list can only add; it cannot turn the built-in protection off or allow a site.',
      oListUrl: 'List address', oRefresh: 'Update now', oHttps: 'The address must start with https://', oChecked: 'List checked',
      oRemoteNone: 'Not downloaded yet.', oRemoteOk: 'Last successful update: {date} · {s} terms, {v} videos, {d} sites.', oRemoteNoOk: 'No successful download yet.', oRemoteErr: ' Last attempt: {e}.',
      oSyncLead: 'The extension runs from the same folder in every browser. Your settings live in the ayarlar.json file in that folder: add a term in one browser and the other picks it up within a minute or two.',
      sNone: 'Folder not linked', sNoneSub: 'Link this browser to the folder once.', sLink: 'Link the folder',
      sPerm: 'Folder linked, permission needed', sPermSub: 'The browser may ask again after it restarts.', sGrant: 'Allow',
      sReady: 'Folder linked', sReadySub: 'Settings are kept in sync with the folder.', sLastWrite: 'Last written: {date}', sSyncNow: 'Sync now',
      sUnsupported: 'This browser cannot write to the folder', sUnsupportedSub: 'Use the export and import buttons.',
      sBrave: 'Brave can read the folder but not write to it', sBraveSub: 'Changes made in another browser arrive here. To send changes from here, turn on brave://flags/#file-system-access-api, or save the file from "Export settings" into the vi-spoiler-shield folder as ayarlar.json.',
      sStep1: 'Click "Link the folder" and choose the vi-spoiler-shield folder you loaded the extension from.',
      sStep2: 'If the browser asks for edit permission, choose "Allow on every visit".',
      sStep3: 'Do this once in every browser you use the extension in.',
      sExport: 'Export settings', sImport: 'Import from file',
      sLinked: 'Folder linked', sGranted: 'Permission granted', sSynced: 'Synced', sImported: 'Settings imported', sBadFile: 'This is not a VI Spoiler Shield settings file',
      sWrongFolder: 'This is not the extension\'s folder. Choose the vi-spoiler-shield folder that contains manifest.json.',
      oProtectionOff: 'Protection turned off', oProtectionOn: 'Protection turned on',
      oLimitsLead: 'No extension catches everything. Here is exactly what this one can miss, so you can decide with your eyes open.',
      oReopen: 'Open the setup wizard again',
      lImg: 'Images without text', lImgDesc: 'A screenshot with no title or caption is not recognised unless it copies an official image.',
      lVid: 'Inside videos', lVidDesc: 'Frames and audio are not scanned. A video can play if its title and description give nothing away.',
      lNews: 'New tab and address bar', lNewsDesc: 'Edge and Brave new-tab news and address bar suggestions are closed to extensions. Turn them off in the browser settings.',
      lInc: 'Private windows', lIncDesc: 'Private windows are not protected unless "Allow in Incognito" is on for the extension.',
      tabAbout: 'About', aLead: 'A free, open-source extension for everyone waiting to play the game themselves.',
      aMadeBy: 'Made by <b>Ali Furkan Şimşek</b>, who is waiting for the PC version too.',
      aGithub: 'Source code on GitHub', aIssue: 'Report a missed spoiler', aIssueNote: 'When reporting, keep the title and description spoiler-free.',
      aDisclaimer: 'Not affiliated with Rockstar Games or Take-Two Interactive. The logo and artwork are the project\'s own.',
      uCard: 'Updates', uAvail: 'New version ready: {v}', uSub: 'You are on {c}. Your history and settings stay.',
      uDownload: 'Download', uHow: 'How to update', uCheck: 'Check now', uChecking: 'Checking…',
      uLatest: 'You are on the latest version ({c}).', uFail: 'Could not check for a new version. It will try again later.',
      upTitle: 'How to update', upVersions: 'Your version: {c} · Latest: {v}',
      upLead: 'Browsers do not update extensions loaded from a folder on their own. It takes four steps and two minutes, and your history and settings stay.',
      upS1T: 'Download the zip', upS1: 'The new version\'s zip downloads in one click.',
      upS2T: 'Extract the zip', upS2: 'Inside is a folder called vi-spoiler-shield.',
      upS3T: 'Copy the files over the old folder', upS3: 'Copy everything inside the new vi-spoiler-shield folder into the folder you loaded the extension from, and choose "Replace the files". The extensions page shows where that folder is: open the extension\'s "Details" and look at "Source".',
      upS4T: 'Reload the extension', upS4: 'On the extensions page press the reload icon of VI Spoiler Shield, then reload your open tabs.',
      upOpenExt: 'Open the extensions page', upLatestNow: 'You are already on the latest version.',
      upWarn: 'Don\'t remove the extension and load the new folder separately: the browser treats that as a new extension and your history starts over.',
      uOneClick: 'Update in one click', uoTitle: 'Update in one click', uoManual: 'Or update by hand',
      uoLead: 'The extension downloads the new version from GitHub, writes it into its own folder and restarts. The first time, you are asked to pick the extension folder (vi-spoiler-shield); if asked for permission, choose "Allow on every visit".',
      uoBrave: 'Writing to folders is off by default in Brave. Turn on brave://flags/#file-system-access-api and restart Brave and one-click updates work there too; otherwise update by hand with the steps below.',
      uoLinking: 'Asking for access to the folder…', uoVerify: 'Checking the folder…', uoDownload: 'Downloading the new version…', uoCheck: 'Checking the download…',
      uoWrite: 'Writing files… ({n}/{t})', uoRestart: 'Done, the extension is restarting…',
      uoWrongFolder: 'The linked folder is not the one this extension runs from. Pick the vi-spoiler-shield folder you loaded the extension from.',
      uoPermission: 'Permission to write to the folder was not given. Try again and choose "Allow on every visit".',
      uoBad: 'The download could not be verified; nothing was changed.', uoFail: 'The update could not finish ({e}). You can update by hand with the steps below.',
      uoDone: 'Updated to {v}. Remember to reload your open tabs.',

      bTitle: 'Page hidden',
      bNet: 'This link looks like it is about a game you have not played yet. I stopped the page before it loaded.',
      bPage: 'This page looks like it is about a game you have not played yet. I covered it so you do not get spoiled.',
      bBack: 'Go back', bShow: 'Show anyway',
      mask: '🛡 Spoiler hidden · Double-click to show',
      revealConfirm: 'This may be a spoiler. Show it anyway?',
      notifHidden: 'A notification was hidden.',

      mImage: 'Block this image as a spoiler', mTerm: 'Add the selected text to the block list', mSite: 'Block this whole site',

      wTitle: 'VI Spoiler Shield Setup',
      rStart: 'Start', rPin: 'Pin', rIncognito: 'Private', rMode: 'Mode', rBrowsers: 'Browsers', rNewTab: 'New tab', rDone: 'Ready',
      w0Title: 'Nobody tells you<br>until you\'ve played it.',
      w0Lead: 'VI Spoiler Shield hides news, images and videos about the game before you see them. Setup takes two minutes.',
      w0F1: 'Text is hidden before it reaches the screen.', w0F2: 'Copies of official images are recognised by fingerprint.', w0F3: 'YouTube videos do not play until their title is checked.',
      w1Title: 'Pin it to the toolbar', w1Lead: 'Keep the icon in view to see how much was hidden and to manage a site in one click.',
      w1S1: 'Click the puzzle-piece icon to the right of the address bar.', w1S2: 'Click the pin next to VI Spoiler Shield.',
      checking: 'Checking...', pinned: 'Pinned.', notPinned: 'Not pinned yet.', pinUnknown: 'This browser does not report it; following the steps is enough.',
      w2Title: 'Protect private windows too', w2Lead: 'Browsers turn extensions off in private windows by default, and that is where spoilers leak most.',
      w2S1: 'Open the extension\'s settings page with the button below.', w2S2: 'Turn on "Allow in Incognito".', w2Open: 'Open extension settings',
      incOn: 'On in private windows.', incOff: 'Still off in private windows.', incUnknown: 'Could not read the state.',
      w3Title: 'How strict?', w3Lead: 'You can change this any time from the extension icon.',
      w3Strict: 'Strict', w3StrictDesc: 'Also hides hints that never name the game: the studio\'s name in a gaming context, the city\'s name, the series name without a number. Some content about older Rockstar games goes too.', w3Rec: 'Recommended',
      w3Balanced: 'Balanced', w3BalancedDesc: 'Only the game\'s name, its number and names from its world. Content about older games stays untouched.',
      w4Title: 'Same settings in every browser', w4Lead: 'The extension runs from the same folder in every browser. Link this browser to that folder and the terms and settings you add reach your other browsers too.',
      w4Hint: 'In the window that opens, choose the vi-spoiler-shield folder. If asked for edit permission, choose "Allow on every visit".', w4Linked: 'Folder linked.',
      w4Brave: 'Brave can read this folder but not write to it: changes made in another browser arrive here by themselves. To send changes from here, follow the steps under Settings > Across browsers.',
      w4Unsupported: 'This browser cannot write to the folder. Use export and import on the settings page.',
      w5Title: 'Turn off new-tab news', w5Lead: 'The browser\'s own new-tab page and address bar suggestions are closed to extensions. Turn them off once so nothing leaks from there.',
      w5Mine: '{b} (the one you are using)',
      hBrave: ['Open a new tab.', 'Click "Customize" at the bottom right.', 'Turn off "Brave News" and "Cards".', 'Under Settings > Search engine, turn off "Show search suggestions".'],
      hEdge: ['Open a new tab.', 'Click the gear at the top right.', 'Turn off "Content" or "Show news feed".', 'Under Settings > Privacy > Address bar and search, turn off the suggestion options.'],
      hChrome: ['Open a new tab and click "Customize Chrome" at the bottom right.', 'Turn off "Show cards".', 'Under Settings > You and Google > Sync and Google services, turn off "Autocomplete searches and URLs".'],
      hOpera: ['Under Settings > Start page, turn off the news feed.', 'On the extensions page, turn on "Allow access to search page results" for VI Spoiler Shield.'],
      w6Title: 'You\'re ready.', w6Lead: 'Type a headline below to see whether the shield would hide it. This is a sample; the same rules run on real sites.',
      w6Placeholder: 'For example: This week\'s best-selling games',
      wouldHide: 'Would hide', visible: 'Visible',
      demo: ['Weekend weather: rain heading for the coast', 'GTA 6 breaks the pre-order record', 'Derby highlights and all the goals', 'Grand Theft Auto VI: the first 10 minutes reviewed', 'Everything we know about Rockstar\'s new game'],
      back: 'Back', next: 'Next', start: 'Let\'s go', finish: 'Finish'
    }
  };

  const browserLang = () => (((g.navigator && navigator.language) || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en');
  let lang = browserLang();

  function setLang(v) {
    lang = v === 'tr' || v === 'en' ? v : browserLang();
    if (g.document && document.documentElement) document.documentElement.lang = lang;
    return lang;
  }
  function t(key, vars) {
    let s = (S[lang] && S[lang][key]) !== undefined ? S[lang][key] : (S.en[key] !== undefined ? S.en[key] : key);
    if (vars && typeof s === 'string') for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  }
  // Fills elements marked with data-i18n (text), data-i18n-html (trusted markup from this file)
  // and data-i18n-attr ("placeholder:key;title:key").
  function apply(root) {
    root = root || document;
    for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
    for (const el of root.querySelectorAll('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr.split(';')) {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      }
    }
    if (root === document && document.documentElement.dataset.i18nTitle) document.title = t(document.documentElement.dataset.i18nTitle);
  }
  async function init() {
    try { const s = await chrome.storage.local.get('lang'); setLang(s.lang); } catch { setLang('auto'); }
    if (g.document) apply();
    return lang;
  }

  g.G6S_I18N = { t, setLang, apply, init, get lang() { return lang; } };
})(typeof self !== 'undefined' ? self : globalThis);
