// Placeholder data until the header is wired to the API.

export const notifications = [
  {
    id: 1,
    kind: "drop" as const,
    title: "Philips Airfryer XL",
    message: "Hepsiburada'da %8 düştü.",
    time: "12 dk önce",
    href: "/analiz/gecmis",
    unread: true,
  },
  {
    id: 2,
    kind: "rise" as const,
    title: "Logitech MX Master 3S",
    message: "Trendyol'da %4 arttı.",
    time: "48 dk önce",
    href: "/analiz/gecmis",
    unread: true,
  },
  {
    id: 3,
    kind: "stock" as const,
    title: "Dyson V15 Detect",
    message: "Amazon TR'de stokta kalmadı.",
    time: "2 sa önce",
    href: "/analiz/gecmis",
    unread: true,
  },
  {
    id: 4,
    kind: "drop" as const,
    title: "Xiaomi Redmi Note 14",
    message: "n11'de hedef fiyatın altına indi.",
    time: "Dün",
    href: "/analiz/gecmis",
    unread: false,
  },
];
