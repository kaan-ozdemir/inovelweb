# Site kontrolleri

Node.js bağımlılıklarını `npm install` ile kurun. Yerel site sunucusu
`http://127.0.0.1:5500/static-site/` adresinde çalışıyor olmalıdır.

- `npm test`: sayfaların HTML referanslarını, sayfa içi hedeflerini, benzersiz
  kimliklerini, CSS dosyalarını, JavaScript sözdizimini, JSON belgelerini ve
  yerel HTTP kaynaklarını denetler. Sayfa betiklerini jsdom ile çalıştırır ve
  iletişim formlarının doğrulamasını ve e-posta taslağını kontrol eder.
- `npm run test:syntax`: test kodunun ve ortak sayfa betiğinin sözdizimini denetler.
- `npm run test:external`: kullanılan dış kaynakların HTTP erişimini denetler.
- `npm run test:navigation`: ana sayfa, galeri, etkinlikler ve hakkımızda
  sayfalarında mobil menüyü, açılır menüleri, Escape tuşunu ve klavye odağını denetler.
  Ayrıca bütün ortak başlıkları ve eski kaynaklardan sayfa üretildiğinde menü
  sırasının korunmasını denetler. Sayfa üretim betikleri `navigation-shared.cjs`
  içindeki ortak menü düzenini kullanır.
- `npm run test:about`: ekip bilgilerinin korunmasını, departman filtresini,
  Türkçe karakterlerle aramayı, boş sonucu ve JavaScript olmadan içeriğe erişimi denetler.
- `npm run test:faq`: özgün soru ve cevapları, aç/kapat düğmesini, Türkçe
  karakterlerle soru/cevap aramasını, boş sonucu ve kategori geçişlerini denetler.
- `npm run test:events`: on yerel etkinlik kaydını, afişleri, kategori
  içeriklerini, tarih etiketlerini, aramayı ve yıl filtresini denetler.
- `npm run test:content`: dergi sayıları ve yerel PDF dosyalarını, Spotify
  bağlantılarını, blog metnini ve içerik türü/yıl/arama filtrelerini denetler.
- `npm run test:gallery`: on iki fotoğrafın korunmasını, HEIC için JPEG kopyasını,
  kategori filtrelerini, görüntüleyici gezinmesini, klavye ve odağı denetler.
  Native dialog API'si jsdom testinde taklit edilir; gerçek tarayıcı yerleşimi ve
  yerel dialog odak kısıtlaması bu testle doğrulanmaz.
- `npm run test:join`: departman seçimini, gerekli alanları, e-posta
  doğrulamasını ve mesaj göndermeden taslak hazırlamayı denetler.
- `npm run test:platform`: özgün çekiliş kayıt, katılımcı görünümü, tombala ve
  Vampir Köylü ekranlarının dosya bağımlılıklarını ve seçim bağlantılarını denetler.
  Firebase modülleri sözdizimi açısından kontrol edilir; canlı kayıt, oda oluşturma,
  oyun veya veritabanına yazma işlemleri test edilmez.

Sonuçlar `site-test-report.json` ve `external-resource-audit.json` dosyalarına
yazılır. Kontroller salt okunurdur; formları üçüncü taraflara göndermez.

jsdom gerçek bir tarayıcı değildir. Görsel düzen, mobil görünüm, PDF çizimi,
animasyonlar ve tarayıcıya özgü davranışlar bu testlerle doğrulanmaz. Tema
kitaplığının tarayıcı önek algılaması için test ortamında WebKit CSS özelliği
taklit edilir; üretim kitaplığı değiştirilmez. Dış kaynak kontrolü HTTP
erişimini doğrular; tarayıcıdaki CORS davranışını doğrulamaz.

2024 yaz dergisinin özgün PDF adresi 404 döndüğü için ilgili sayfa erişim
açıklaması gösterir. PDF içeriği geri yüklenmiş değildir. Etkinlik seçim ekranı
`etkinlikler/index.html`, afiş arşivi `etkinlikler/arsiv/index.html` adresindedir.
Kayıt ve oyun sayfaları özgün istemci kodlarıyla geri getirildi; canlı işlemleri
mevcut Firebase hizmetinin ve etkinlik oturumunun durumuna bağlıdır. İletişim
formları sunucu üzerinden mesaj göndermez; kullanıcının kendi e-posta
uygulamasında gönderebileceği bir taslak hazırlar.

Fotoğraf önizlemelerini yeniden üretmek için `npm run optimize:photos` çalıştırılır.
Bu işlem 60 ekip portresi ve 15 galeri fotoğrafından küçültülmüş JPEG kopyaları
oluşturur; orijinalleri değiştirmez. Galeri büyük görüntüleyicisi orijinalleri açar.
Ekip içe aktarma betikleri çalıştırıldıktan sonra bu komut yeniden çalıştırılmalıdır.
