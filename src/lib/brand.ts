export const BRAND = {
  name: "EVOKA",
  tagline: "Home & Personal Care",
  heroHeadline: "Everyday Clean, Elevated.",
  heroSubheadline:
    "Detergents, dish wash, hand wash, floor cleaners, air fresheners, soaps & car care — made in Pallichal, Trivandrum.",
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
      slug: "laundry-detergents",
      name: "Laundry Detergents",
      shortDesc: "Matic liquids, washing powder & stain bleach",
      image: "/images/detergent-matic-royal-rose-1l.jpg",
    },
    {
      slug: "fabric-care",
      name: "Fabric Care",
      shortDesc: "Fabric conditioner & after-wash stiffener",
      image: "/images/fabric-conditioner-1l.jpg",
    },
    {
      slug: "dish-wash",
      name: "Dish Wash",
      shortDesc: "Lemon, orange & green apple utensil liquids",
      image: "/images/dishwash-lemon-500ml.jpg",
    },
    {
      slug: "hand-wash",
      name: "Hand Wash",
      shortDesc: "Jasmine, lavender, orange, pears & strawberry",
      image: "/images/handwash-orange-500ml-pump.jpg",
    },
    {
      slug: "floor-cleaners",
      name: "Floor Cleaners",
      shortDesc: "Floral cleaners, Mzol & phynoil liquids",
      image: "/images/floorcleaner-rose-1l.jpg",
    },
    {
      slug: "toilet-bathroom-care",
      name: "Toilet & Bathroom",
      shortDesc: "Toilet cleaner & 3-in-1 tile cleaner",
      image: "/images/toiletcleaner-perfumed-5l.jpg",
    },
    {
      slug: "car-glass-care",
      name: "Car & Glass Care",
      shortDesc: "pH-balanced car shampoo & 4X glass cleaner",
      image: "/images/carshampoo-500ml.jpg",
    },
    {
      slug: "air-fresheners",
      name: "Air Fresheners",
      shortDesc: "Daisy & lavender room sprays (500ml)",
      image: "/images/airfreshener-lavender-500ml.jpg",
    },
    {
      slug: "personal-care",
      name: "Personal Care",
      shortDesc: "Face washes & traditional Kerala bath soaps",
      image: "/images/facewash-sandal-200ml.jpg",
    },
  ],
} as const;

export const COUPONS: Record<string, { discountPercent: number; minOrder: number; label: string }> = {
  EVOKA10: { discountPercent: 10, minOrder: 399, label: "10% off on orders above ₹399" },
  REFILL15: { discountPercent: 15, minOrder: 899, label: "15% off on orders above ₹899" },
  KERALA5: { discountPercent: 5, minOrder: 0, label: "5% Welcome Discount" },
};
