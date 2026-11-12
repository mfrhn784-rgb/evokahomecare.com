export const BRAND = {
  name: "EVOKA",
  tagline: "Home & Personal Care",
  heroHeadline: "Everyday Clean, Elevated.",
  heroSubheadline:
    "Detergents, dish wash, floor cleaners, bathroom care, and personal care — crafted in Pallichal, Trivandrum.",
  origin: "Pallichal, Trivandrum, Kerala",
  phone: "+91 96333 43432",
  phoneHref: "tel:+919633343432",
  whatsappNumber: "919633343432",
  whatsappUrl: "https://wa.me/919633343432",
  instagramUrl: "https://www.instagram.com/evokahomecare",
  instagramHandle: "@evokahomecare",
  email: "evokacleanings@gmail.com",
  emailHref: "mailto:evokacleanings@gmail.com",
  freeShippingThreshold: 0,
  flatShippingFee: 0,
  enableOnlinePay: process.env.NEXT_PUBLIC_ENABLE_ONLINE_PAY === "true",
  outlets: [
    {
      id: "poovar",
      name: "Poovar Uchakkada Outlet",
      address: "Poovar Uchakkada, Thiruvananthapuram, Kerala",
      hours: "Mon – Sat: 9:30 AM – 8:00 PM | Sun: 10:00 AM – 2:00 PM",
      mapQuery: "https://www.google.com/maps/search/?api=1&query=Poovar+Uchakkada+Trivandrum+Kerala",
    },
    {
      id: "pallichal",
      name: "Pallichal Junction Outlet",
      address: "Pallichal Jn, Thiruvananthapuram, Kerala",
      hours: "Mon – Sat: 9:30 AM – 8:00 PM | Sun: 10:00 AM – 2:00 PM",
      mapQuery: "https://www.google.com/maps/search/?api=1&query=Pallichal+Junction+Trivandrum+Kerala",
    },
  ],
  categories: [
    {
      slug: "laundry-care",
      name: "Laundry Care",
      shortDesc: "Matic liquids, washing powder, bleach & fabric care",
      image: "/images/detergent-matic-royal-rose-1l.jpg",
      subcategories: [
        "Matic Liquid Detergents",
        "Washing Powder & Stain Care",
        "Fabric Care",
      ],
    },
    {
      slug: "kitchen-care",
      name: "Kitchen Care",
      shortDesc: "Lemon, orange & green apple dish wash liquids",
      image: "/images/dishwash-lemon-500ml.jpg",
      subcategories: ["Dish Wash Liquids"],
    },
    {
      slug: "floor-surface-care",
      name: "Floor & Surface Care",
      shortDesc: "Floor cleaners, Mzol, phynoil, car, glass & air care",
      image: "/images/floorcleaner-rose-1l.jpg",
      subcategories: [
        "Floral Floor Cleaners",
        "Mzol Floor Cleaners",
        "Phynoil Cleaners",
        "Car & Glass Care",
        "Air Fresheners",
      ],
    },
    {
      slug: "bathroom-care",
      name: "Bathroom Care",
      shortDesc: "Perfumed toilet cleaner & 3-in-1 bathroom tile cleaner",
      image: "/images/toiletcleaner-perfumed-5l.jpg",
      subcategories: ["Toilet & Tile Cleaners"],
    },
    {
      slug: "personal-care",
      name: "Hand & Personal Care",
      shortDesc: "Liquid hand washes, face washes & Kerala bath soaps",
      image: "/images/handwash-orange-500ml-pump.jpg",
      subcategories: ["Liquid Hand Wash", "Face Wash", "Bath Soaps"],
    },
  ],
} as const;

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "laundry-detergents": "laundry-care",
  "fabric-care": "laundry-care",
  "dish-wash": "kitchen-care",
  "floor-cleaners": "floor-surface-care",
  "car-glass-care": "floor-surface-care",
  "air-fresheners": "floor-surface-care",
  "toilet-bathroom-care": "bathroom-care",
  "hand-wash": "personal-care",
};

export function normalizeCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_MAP[slug] || slug;
}

export const COUPONS: Record<string, { discountPercent: number; minOrder: number; label: string }> = {
  EVOKA10: { discountPercent: 10, minOrder: 399, label: "10% off on orders above ₹399" },
  REFILL15: { discountPercent: 15, minOrder: 899, label: "15% off on orders above ₹899" },
  KERALA5: { discountPercent: 5, minOrder: 0, label: "5% Welcome Discount" },
};
