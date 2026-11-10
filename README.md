# İnovel web sitesi

Kütahya Dumlupınar Üniversitesi İnovasyon ve Liderlik Topluluğu web sitesi.

## Yerelde açma

`static-site/index.html` dosyasını tarayıcıda açabilir veya VS Code Live Server ile çalıştırabilirsin. Tüm sayfaları kontrol etmek için Live Server kullanılması önerilir.

## Geliştirme

```sh
npm ci
```

Ana sayfa `static-site/index.html` dosyasındadır. Diğer sayfaların çoğu kök dizindeki `update-*.cjs` betikleriyle üretilir. Kalıcı düzenlemeler ilgili üretici betiğe de uygulanmalıdır. `backups/` klasörü bazı üreticilerin okuduğu kaynak sayfaları içerir.

Ekip bilgileri `static-site/assets/team/`, etkinlik bilgileri `static-site/assets/events/catalog.json` içindedir. Fotoğraf içe aktarma betikleri yerel kaynak klasörlerine ihtiyaç duyabilir.

## Kontroller

```sh
npm run test:navigation
npm run test:about
npm run test:gallery
npm run test:events
```

Diğer kontroller için [TESTING.md](TESTING.md) dosyasına bak. `npm test`, sitenin `http://127.0.0.1:5500/static-site/` adresinde çalışmasını bekler.

## Yayınlama

Statik site kökü `static-site/` klasörüdür. Depoyu GitHub’a yüklemek, siteyi otomatik olarak yayımlamaz.
