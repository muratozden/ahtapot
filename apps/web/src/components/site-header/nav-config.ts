import {
  ArrowLeftRight,
  BellRing,
  BookOpen,
  ChartLine,
  Code,
  FileChartColumn,
  History,
  FolderTree,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Package,
  Send,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  /** Path prefix that marks the trigger as active. */
  basePath: string;
  items: NavLink[];
  /** Plain "→" links shown in a second column; makes the dropdown wide. */
  sideLinks?: { title: string; href: string }[];
  footer?: { title: string; href: string };
};

export const navGroups: NavGroup[] = [
  {
    id: "takip",
    label: "Takip",
    basePath: "/takip",
    items: [
      {
        title: "Ürünlerim",
        description: "Takip ettiğin tüm ürünler ve son fiyatlar",
        href: "/takip/urunler",
        icon: Package,
      },
      {
        title: "URL Ekle",
        description: "Tek tek ya da toplu ürün linki ekle",
        href: "/takip/yeni",
        icon: Link2,
      },
      {
        title: "Gruplar ve Etiketler",
        description: "Ürünlerini kategorilere ayır",
        href: "/takip/gruplar",
        icon: Tags,
      },
    ],
    sideLinks: [
      { title: "CSV ile içe aktar", href: "/takip/ice-aktar" },
      { title: "Desteklenen siteler", href: "/kaynaklar/siteler" },
    ],
    footer: { title: "Fiyat takibi nasıl çalışır?", href: "/kaynaklar/yardim" },
  },
  {
    id: "analiz",
    label: "Analiz",
    basePath: "/analiz",
    items: [
      {
        title: "Fiyat Geçmişi",
        description: "Ürün bazında zaman içindeki fiyat hareketleri",
        href: "/analiz/gecmis",
        icon: ChartLine,
      },
      {
        title: "Rakip Karşılaştırma",
        description: "Aynı ürünü satan mağazaları yan yana gör",
        href: "/analiz/rakipler",
        icon: ArrowLeftRight,
      },
      {
        title: "Raporlar",
        description: "Haftalık ve aylık özet raporlar",
        href: "/analiz/raporlar",
        icon: FileChartColumn,
      },
    ],
    sideLinks: [{ title: "Raporu dışa aktar", href: "/analiz/disa-aktar" }],
    footer: { title: "Raporlar nasıl okunur?", href: "/kaynaklar/yardim" },
  },
  {
    id: "uyarilar",
    label: "Uyarılar",
    basePath: "/uyarilar",
    items: [
      {
        title: "Fiyat Alarmları",
        description: "Hedef fiyat ve değişim kuralları oluştur",
        href: "/uyarilar/alarmlar",
        icon: BellRing,
      },
      {
        title: "Bildirim Kanalları",
        description: "E-posta, Telegram ve WhatsApp bağlantıları",
        href: "/uyarilar/kanallar",
        icon: Send,
      },
      {
        title: "Uyarı Geçmişi",
        description: "Gönderilen tüm bildirimler",
        href: "/uyarilar/gecmis",
        icon: History,
      },
    ],
  },
  {
    id: "kaynaklar",
    label: "Kaynaklar",
    basePath: "/kaynaklar",
    items: [
      {
        title: "Yardım Merkezi",
        description: "Sık sorulan sorular ve rehberler",
        href: "/kaynaklar/yardim",
        icon: LifeBuoy,
      },
      {
        title: "Yenilikler",
        description: "Ahtapot'a eklenen yeni özellikler",
        href: "/kaynaklar/yenilikler",
        icon: Sparkles,
      },
      {
        title: "API",
        description: "Fiyat verilerini kendi sistemine aktar",
        href: "/kaynaklar/api",
        icon: Code,
      },
      {
        title: "Blog",
        description: "E-ticarette fiyatlandırma üzerine yazılar",
        href: "/kaynaklar/blog",
        icon: BookOpen,
      },
    ],
  },
];

/** Shown only to admins; add screens here as they are built. */
export const adminNavGroup: NavGroup = {
  id: "yonetim",
  label: "Yönetim",
  basePath: "/admin",
  items: [
    {
      title: "Genel bakış",
      description: "Satıcılar, veri toplama ve sistem sağlığı",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Satıcılar",
      description: "Ahtapot satıcı hesaplarını ekle ve düzenle",
      href: "/admin/saticilar",
      icon: Store,
    },
    {
      title: "Pazaryeri satıcıları",
      description: "Pazaryeri mağaza profilleri ve iletişim bilgileri",
      href: "/admin/pazaryeri-saticilar",
      icon: ShoppingBag,
    },
    {
      title: "Kategoriler",
      description: "Pazaryeri kategori ağaçları",
      href: "/admin/kategoriler",
      icon: FolderTree,
    },
  ],
};

export function navGroupsFor(isAdmin: boolean) {
  return isAdmin ? [...navGroups, adminNavGroup] : navGroups;
}
