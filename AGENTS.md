# Ahtapot — proje hafızası

Bu dosya projede çalışan her asistan için kalıcı bağlamdır. Yeni bir karar alındığında veya bir şey öğrenildiğinde güncelle.

## Proje

Ahtapot, e-ticaret satıcıları için fiyat takip SaaS'ı.

- Satıcı dashboard'a yalnızca fiyatını takip etmek istediği ürün URL'lerini ekler (kendi ürünleri ve rakip linkleri).
- Veriyi Murat'ın **kendi cihazlarında** çalışan Chrome eklentileri (MV3, WXT) çeker. Eklentiler API'den iş (job) alır; HTML'i ayrıştıran parser'lar sunucu tarafındadır.
- Yoğun zaman serisi veri yazılır ve gösterilir; bu yüzden PostgreSQL + TimescaleDB kullanılır.
- Pazaryerleri: Trendyol, Hepsiburada, Amazon TR, n11 (`marketplaces` tablosunda seed'li).

### Roller

- **Seller (Satıcı):** `/kayit` sayfasından kendisi kayıt olur veya admin ekler.
- **Admin:** Kayıt formundan olunamaz (`role` alanı `input: false`). Yalnızca script ile oluşturulur:
  `npm run create-admin -w @ahtapot/web -- --email ... --name "..." --password "..."`. Var olan bir e-posta verilirse o hesap admin yapılır.

### Durum

- **Yapıldı:**
  - Dribbble `.site-nav` tarzı header (dropdown menüler, arama, bildirimler, kullanıcı menüsü).
  - Üyelik sistemi: giriş, kayıt, çıkış.
  - Admin paneli: satıcı listeleme, ekleme ve düzenleme (`/admin/saticilar`). Silme yok.
- **Henüz yok:**
  - URL ekleme ve takip ekranları. Header menüsündeki sayfaların çoğu henüz yok (404).
  - Eklentiler, parser'lar, scrape job akışı, gerçek bildirimler. `notifications` hâlâ `lib/mock-data.ts` içinde sahte veri.

### Yol haritası

- **Ürün:** Önce tek pazaryeriyle (Trendyol) uçtan uca ince dilim: URL ekleme → takip listesi → eklenti token'ları → iş kuyruğu API'si → parser → Chrome eklentisi. Ardından ürün detayı ve fiyat grafiği, diğer pazaryerleri, uyarılar ve ticari kısım.
- **Veri boyutu kararı (önerildi, onay bekliyor):** Eklenti sayfanın tamamını değil, sunucunun iş ile birlikte istediği parçaları (JSON-LD, ilgili script blokları) gönderir. Tam sayfa yalnızca ayrıştırma başarısız olduğunda saklanır.
- **Açık riskler:** Canlı veritabanının yedeği yok. Sunucu firewall kontrolü yapılmadı.

### Admin ekranları planı

Kararlar: Admin gezinmesi ana header'daki **"Yönetim"** dropdown'ı ile yapılır (yalnızca admin görür). Satıcılar silinmez, **pasife alınır**. "Satıcı olarak görüntüle" şimdilik yok.

| Sıra | Ekran | Adres | Durum |
|---|---|---|---|
| 1 | Yönetim menüsü ve Genel bakış | `/admin` | Tamam |
| 2 | Satıcı detayı ve pasife alma | `/admin/saticilar/[id]` | Bekliyor (liste, ekleme, düzenleme var) |
| 3 | Pazaryerleri ayarları | `/admin/pazaryerleri` | Bekliyor |
| 4 | Eklentiler (token yönetimi) | `/admin/eklentiler` | Bekliyor |
| 5 | İş kuyruğu ve hatalar | `/admin/kuyruk` | Veri toplama ile birlikte |
| 6 | Ürünler (tüm listing'ler) | `/admin/urunler` | URL ekleme ile birlikte |

Yönetim menüsüne yalnızca yapılmış ekranlar eklenir.

## Çalışma tarzı (Murat'ın tercihleri)

- **Adım adım git.** Yalnızca istenen şeyi yap. İstenmeyen sayfa, özellik veya "bonus" ekleme. (Header istendiğinde tüm dashboard'u yapmak geri çevrildi.)
- Öneri yapabilirsin ama uygulamadan önce sor.
- Arayüz metinleri **Türkçe**. Kod, isimlendirme ve yorumlar İngilizce.
- Renk ve tasarım değişikliklerinde Murat'ın beğenisi belirleyici. Önerilen palet beğenilmedi ve geri alındı; mevcut renklere sadık kal.

## Komutlar

Tüm komutlar repo kökünden çalıştırılır.

### İlk kurulum

```bash
npm install
cp .env.example .env                       # docker portları ve DATABASE_URL (migration için)
cp apps/web/.env.example apps/web/.env.local
# apps/web/.env.local içindeki BETTER_AUTH_SECRET'ı doldur: openssl rand -base64 32
npm run infra:up                           # TimescaleDB (5442) ve Redis (6380) container'ları
npm run db:migrate
npm run create-admin -w @ahtapot/web -- --email admin@ahtapot.com --name "Admin" --password "********"
```

### Günlük kullanım

```bash
npm run infra:up      # container'lar kapalıysa
npm run dev:web       # http://localhost:3000
```

### Diğer komutlar

| Komut | Ne yapar |
|---|---|
| `npm run infra:down` | Docker container'larını durdurur (veri volume'da kalır) |
| `npm run db:generate` | Şema değişikliğinden yeni migration üretir |
| `npm run db:migrate` | Bekleyen migration'ları uygular |
| `npm run db:import-categories` | `_temp/category.sql` + varsa `_temp/pttavm-categories.sql` kategori ağaçlarını yükler |
| `npm run studio -w @ahtapot/db` | Drizzle Studio (veritabanı arayüzü) |
| `npm run build:web` | Production build (dev sunucusu açıkken çalıştırma) |
| `npm run lint -w @ahtapot/web` | ESLint |
| `npx tsc --noEmit -p apps/web` | Tip kontrolü |
| `npm run deploy` | Commit'lenmiş `main`'i canlıya alır (aşağıda "Repo ve deploy") |

## Teknoloji

- npm workspaces monorepo (pnpm yok). Node 25 yerelde, Node 24 sunucuda.
- `apps/web`: Next.js 16.4, React 19.3, Tailwind v4 (`@tailwindcss/postcss`), Radix UI (`radix-ui` paketi), lucide-react, clsx (`lib/cn.ts`).
- `packages/db` (`@ahtapot/db`): Drizzle ORM 0.45 + drizzle-kit, postgres.js. Kaynak `.ts` olarak tüketilir (`transpilePackages`).
- Auth: Better Auth 1.7 (Drizzle adapter, e-posta + şifre, `nextCookies` eklentisi).
- Yerel altyapı: `docker-compose.yml` içinde TimescaleDB (pg17, port **5442**) ve Redis (port **6380**). Bu makinede 5432 dolu. Redis henüz kullanılmıyor.

## Next.js 16 kuralları ve öğrenilenler

Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberi oku (bkz. `apps/web/AGENTS.md`). Bu sürüm eğitim verindeki Next.js'ten farklı.

- `cacheComponents: true` ve `partialPrefetching: true` açık.
  - `cookies()`, `headers()`, `usePathname()`, dinamik `params` ve veritabanı okumaları `<Suspense>` içinde olmalı.
  - Veriyi sayfanın en üstünde bekleme; sayfa içinde kendi `<Suspense>` sınırına sahip bir alt bileşene taşı. Aksi halde sayfa geçişleri anında olmaz.
  - Veritabanı okumaları istek anı verisi olarak algılanmaz; sorgudan önce `await connection()` çağır (bkz. `lib/sellers.ts`).
  - Session'ı layout'un en üstünde `await` etme.
- Middleware'in yeni adı `proxy.ts` (`src/proxy.ts`). Bu dosya yalnızca cookie var mı diye kontrol edip yönlendirir; asıl doğrulama sayfalarda yapılır.
- `next/image` için `priority` yerine `preload` kullan.
- **Next, gizlenen sayfaların durumunu saklar** (`<Activity>`). Şifre gibi hassas alan içeren formları başarılı gönderimden sonra temizle (`form.reset()` veya `revalidatePath`).
- Tarayıcı test aracı `data-cursor-ref` niteliği eklediği için hydration uyarısı çıkar; bu bir kod hatası değil.
- `next dev` çalışırken aynı klasörde `next build` çalıştırma. Deploy zaten geçici bir kopyada derliyor.
- Dev sunucusu: `npm run dev:web`, adres `http://localhost:3000`.

## Auth deseni

- `lib/auth.ts`: Better Auth yapılandırması. Ek kullanıcı alanları: `role` (`admin` | `seller`, varsayılan `seller`, `input: false`) ve `companyName`.
- `lib/session.ts`:
  - `getCurrentUser()`: `'use cache: private'` kullanır, oturum yoksa `/giris` sayfasına yönlendirir.
  - `requireRole(role)`: Rol tutmazsa `/` sayfasına yönlendirir.
  - `verifyAdmin()`: Server Action'lar için. Önbellek ve cookie cache kullanmadan doğrular; yetki yoksa `null` döner.
- Veri erişim fonksiyonları (`lib/sellers.ts` gibi) okumalarda rolü kendileri de kontrol eder. Yazma işlemlerinde kontrol çağıran Server Action'dadır.
- Admin bölümü: `app/(app)/admin/layout.tsx` içinde `<Suspense>` + `requireRole("admin")`.
- Route grupları: header'lı sayfalar `(app)` altında, header'sız giriş ve kayıt sayfaları `(auth)` altında.
- Hata mesajları Türkçe (`components/auth/auth-errors.ts`).

## Veritabanı

- Şema `packages/db/src/schema.ts` içinde. Sütun adları snake_case. Auth tabloları (`users`, `sessions`, `accounts`, `verifications`) Better Auth çekirdek şemasını izler; id'leri `text`.
- `tracked_listings.seller_id` alanı `users.id` tablosuna bağlı. Tenant yapısı yok; her satıcı kendi kaydıdır.
- `price_snapshots` bir TimescaleDB hypertable'ı: 7 günlük parçalar, 30 günden eski veri sıkıştırılır. `price_daily` günlük özet tablosu (continuous aggregate).
- Migration'lar `packages/db/migrations` içinde. `0001_timescale.sql` elle yazılmış bir migration; ifadeler `--> statement-breakpoint` ile ayrılıyor.
  - Şema değişikliği: `npm run db:generate`, ardından `npm run db:migrate`.
  - TimescaleDB'ye özel SQL için: `npx drizzle-kit generate --custom --name <ad>` (`packages/db` içinde).

### Kategori ve komisyon (taslak, onay bekliyor)

- Referans: `marketplace_categories` (pazaryeri başına harici `external_id`, iç `id`, `parent_id`, `path`, `is_leaf`, `tree_version`).
- Komisyon ve oranlar: `category_commission_rates` (komisyon, KDV, pazarlama bedeli, pazaryeri hizmet bedeli — hepsi % olarak; admin `/admin/kategoriler`).
- Listing: `listings.marketplace_category_id` + yedek `category_external_id`, `category_path` (çekim anı).
- Satıcı giderleri: `tracked_listing_economics` (ürün maliyeti, kargo, diğer, isteğe bağlı komisyon override).
- Import: `npm run db:import-categories` — n11 / Trendyol / Hepsiburada `_temp/category.sql` (COPY); **PTT AVM** `_temp/pttavm-categories.sql` (INSERT, dosya varsa otomatik). PTT dump’ta bazı `id` değerleri tekrar ettiği için `external_id` biçimi `{parentId}:{id}` (kök için `0:{id}`); ürün parser’ı eşleştirirken parent id veya `category_path` kullanılmalı.
- Pazaryerleri seed: Trendyol, n11, Hepsiburada, Amazon TR (`0001`); PTT AVM (`0005`, `pttavm.com.tr`).
- Çapraz platform eşleştirme (`product_groups`) buybox sonrası ayrı adım.

## Tasarım

- Font: Google Sans (`next/font/google`). Body yazı boyutu 13px. Arama kutusu ve nav butonları da 13px.
- Renkler `apps/web/src/app/globals.css` içindeki `@theme` bloğunda.
  - Marka / birincil aksiyon: `--color-brand` siyah `#000000`, hover `#262626`.
  - Zemin: canvas `#f5f7f9`, kartlar beyaz, yüzey/input `#edf2f7`, border `#e5e7eb` (gölge ağırlıklı kartlar).
  - Metin: ink `#0a0a0b`, muted `#6b7280`.
  - Durum: drop mint (`#065f46` / `#d1fae5`), rise kırmızı; `brand-soft` lavanta `#f3e8ff` (rozet vb.).
- Logo: `public/logo-ahtapot.svg` (1069×266, siyah).
- Kartlar: `rounded-2xl border border-line bg-white shadow-card`. Ana buton: `bg-brand text-white` (header'da `rounded-full`, formlarda `rounded-xl`).
- Ortak form parçaları: `components/auth/form-parts.tsx` (`Field`, `FormError`, `SubmitButton`).

## Repo ve deploy

- GitHub: `git@github.com:muratozden/ahtapot.git` (SSH), branch `main`.
- Deploy: `npm run deploy` (`scripts/deploy.sh`). Script şunları yapar:
  1. Commit'lenmemiş değişiklik varsa veya branch `main` değilse durur.
  2. GitHub'a push eder.
  3. Commit'lenmiş kodu yerelde geçici bir kopyada derler (`output: "standalone"`).
  4. Çıktıyı sunucuda `releases/<commit>` klasörüne rsync ile yükler.
  5. Migration'ları SSH tüneli üzerinden yerelden çalıştırır.
  6. `current` bağlantısını yeni sürüme çevirir, pm2 ile yeniden yükler ve siteyi kontrol eder. Son 3 sürüm saklanır.
- Neden yerelde derleniyor: Sunucuda swap yok ve RAM az. Next build orada OOM'a yol açıp diğer projeleri öldürebilir.

### Sunucu (`root@178.104.131.90`, paylaşımlı)

- Canlı adres: https://ahtapot.n11.works (Cloudflare → Caddy → `127.0.0.1:4335`).
- Konum `/opt/ahtapot-n11`:
  - `.env`: gizli bilgiler. Yalnızca sunucuda durur, repoya girmez.
  - `current` → `releases/<commit>`.
  - Ayrıca `docker-compose.yml` ve `ecosystem.config.cjs`.
- pm2 uygulaması: `ahtapot-n11-web`. Veritabanı container'ı: `ahtapot-n11-postgres-1`, port `127.0.0.1:55441`.
- **Docker compose'u sunucuda her zaman `-p ahtapot-n11` ile çalıştır.** `/opt/ahtapot` klasöründe, compose adı yine `ahtapot` olan **başka ve eski bir proje** var (Astro, `ahtapot.datascraper.net`). Ona dokunma.
- Aynı sunucuda başka projeler de var: telesatis, product-n11, intranet, activeseller, agora, tedavimerkezi, content-creator. Değişiklik yapmadan önce yalnızca okuyarak incele; Caddyfile'ı değiştirmeden önce `Caddyfile.bak.<ad>-<tarih>` adıyla yedek al ve `caddy validate` çalıştır.
- Kodigen (crawler platformu) Ekim 2026'da kaldırıldı. Sunucuya kurulu PostgreSQL 18, Redis ve RabbitMQ yerinde bırakıldı; şu an hiçbir proje kullanmıyor gibi görünüyor.
- Canlıda admin hesabı: `admin@ahtapot.com`.
