import Link from "next/link";
import { ArrowRight, MapPin, Phone, Truck, ShieldCheck, PackageCheck, Sparkles, Clock } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { getProducts } from "@/lib/store-db";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { ProductCard } from "@/components/ProductCard";
import { HomeCategoryShelf } from "@/components/HomeCategoryShelf";
import { CategoryIcon } from "@/components/CategoryIcon";
import { SafeImage } from "@/components/SafeImage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();
  const bestSellers = products.filter((p) => p.badge || p.isFeatured).slice(0, 8);
  const featuredProducts = bestSellers.length > 0 ? bestSellers : products.slice(0, 8);

  return (
    <div className="bg-white">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Trust Features Bar */}
      <section className="border-b border-[#E5E8E3] bg-[#F6F7F4]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E5E8E3]">
            <div className="flex items-center gap-3.5 py-4 sm:py-5 lg:pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E8E3] text-[#154734]">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#141A16]">Free Home Delivery</p>
                <p className="text-[11px] sm:text-xs text-[#6B756D]">Across Trivandrum orders</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 py-4 sm:py-5 pl-3 lg:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E8E3] text-[#154734]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#141A16]">Cash on Delivery</p>
                <p className="text-[11px] sm:text-xs text-[#6B756D]">Pay at your doorstep</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 py-4 sm:py-5 lg:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E8E3] text-[#154734]">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#141A16]">400ml – 5L Packs</p>
                <p className="text-[11px] sm:text-xs text-[#6B756D]">Home &amp; bulk containers</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 py-4 sm:py-5 pl-3 lg:pl-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E8E3] text-[#154734]">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#141A16]">2 Trivandrum Outlets</p>
                <p className="text-[11px] sm:text-xs text-[#6B756D]">Pallichal &amp; Poovar Uchakkada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1E6B4B]">
              Product Range
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#141A16] sm:text-3xl">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#154734] hover:text-[#1E6B4B]"
          >
            View all {products.length} products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
          {BRAND.categories.map((cat) => {
            const catCount = products.filter((p) => p.category === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E8E3] bg-white transition-all hover:border-[#154734]/40 hover:shadow-md"
              >
                <div className="relative flex aspect-square items-center justify-center bg-[#F6F7F4] p-4">
                  <SafeImage
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#154734] border border-[#E5E8E3]">
                    <CategoryIcon slug={cat.slug} className="h-4 w-4" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <h3 className="text-sm font-bold text-[#141A16] group-hover:text-[#154734]">
                      {cat.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#6B756D]">
                      {cat.shortDesc}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#1E6B4B]">
                    {catCount} Products &rarr;
                  </p>
                </div>
              </Link>
            );
          })}

          {/* 6th Tile: Combos & Value Packs */}
          <Link
            href="/bundles"
            className="group flex flex-col overflow-hidden rounded-xl border border-[#154734]/20 bg-[#EBF5EE] transition-all hover:border-[#154734]/50 hover:shadow-md"
          >
            <div className="relative flex aspect-square items-center justify-center bg-white/70 p-4">
              <SafeImage
                src="/images/detergent-matic-perfect-5l.jpg"
                alt="Combos and Value Packs"
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-[#E5A91A] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#141A16]">
                Save 20%
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-between p-3.5">
              <div>
                <h3 className="text-sm font-bold text-[#154734]">Combos &amp; Value Packs</h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-[#1E6B4B]">
                  Build a 4+ item box &amp; save 20%
                </p>
              </div>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#154734]">
                Build Box &rarr;
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Our Best Sellers */}
      <section className="border-t border-[#E5E8E3] bg-[#FBFBF9]">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1E6B4B]">
                Popular Picks
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#141A16] sm:text-3xl">
                Our Best Sellers
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#154734] px-4 py-2 text-xs font-bold text-[#154734] transition-colors hover:bg-[#154734] hover:text-white"
            >
              Browse Full Catalog
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Category Aisle Shelf */}
      <HomeCategoryShelf products={products} />

      {/* Build Your Own Box Banner */}
      <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="overflow-hidden rounded-3xl bg-[#154734] text-white">
          <div className="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-12 lg:px-14">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5A91A] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#141A16]">
                <Sparkles className="h-3.5 w-3.5" />
                Save 20% on Combos
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Build Your Own Home Care Box
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                Pick any 4 or more EVOKA bottles across laundry detergents, dish wash, hand wash, and floor cleaners to get an automatic 20% combo discount with free delivery.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/bundles"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#154734] transition-colors hover:bg-[#F6F7F4]"
                >
                  Start Building Your Box
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Shop Single Packs
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:col-span-6">
              {[
                {
                  src: "/images/detergent-matic-perfect-1l.jpg",
                  label: "Matic Detergent",
                },
                {
                  src: "/images/dishwash-green-apple-1l.jpg",
                  label: "Dish Wash 1L",
                },
                {
                  src: "/images/handwash-jasmine-500ml-pump.jpg",
                  label: "Hand Wash Pump",
                },
              ].map((item) => (
                <div
                  key={item.src}
                  className="flex flex-col items-center rounded-2xl bg-[#F6F7F4] p-3 sm:p-4 text-center"
                >
                  <div className="flex aspect-square w-full items-center justify-center">
                    <SafeImage
                      src={item.src}
                      alt={item.label}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="mt-2 text-[11px] sm:text-xs font-bold text-[#141A16]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Strip */}
      <MarqueeStrip />

      {/* Trivandrum Outlets */}
      <section className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1E6B4B]">
              Store Locations
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#141A16] sm:text-3xl">
              Visit Our Trivandrum Outlets
            </h2>
          </div>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#154734] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1E6B4B]"
          >
            <Phone className="h-3.5 w-3.5" />
            WhatsApp {BRAND.phone}
          </a>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {BRAND.outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="flex flex-col justify-between rounded-2xl border border-[#E5E8E3] bg-[#F6F7F4] p-6 sm:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#154734] border border-[#E5E8E3]">
                    <MapPin className="h-3.5 w-3.5" />
                    Trivandrum
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B756D]">
                    <Clock className="h-3.5 w-3.5" />
                    {outlet.hours}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-[#141A16]">{outlet.name}</h3>
                <p className="mt-1.5 text-sm text-[#6B756D]">{outlet.address}</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 pt-4 border-t border-[#E5E8E3]">
                <a
                  href={outlet.mapQuery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#141A16] border border-[#E5E8E3] hover:border-[#154734]"
                >
                  Open in Maps
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href={BRAND.phoneHref}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#154734] hover:underline"
                >
                  Call {BRAND.phone}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
