import { BRAND } from "./brand";
import { Product } from "./types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCategoryMeta(rawCategory: string): { slug: string; name: string; fallbackImg: string } {
  const clean = rawCategory.trim().toLowerCase();
  const matched = BRAND.categories.find(
    (c) => c.slug === clean || c.name.toLowerCase() === clean
  );
  if (matched) {
    return { slug: matched.slug, name: matched.name, fallbackImg: matched.image };
  }
  if (clean.includes("laundry") || clean.includes("detergent")) {
    return { slug: "laundry-detergents", name: "Laundry Detergents", fallbackImg: "/images/detergent-matic-royal-rose-1l.jpg" };
  }
  if (clean.includes("fabric")) {
    return { slug: "fabric-care", name: "Fabric Care", fallbackImg: "/images/fabric-conditioner-1l.jpg" };
  }
  if (clean.includes("dish") || clean.includes("kitchen")) {
    return { slug: "dish-wash", name: "Dish Wash", fallbackImg: "/images/dishwash-lemon-500ml.jpg" };
  }
  if (clean.includes("hand")) {
    return { slug: "hand-wash", name: "Hand Wash", fallbackImg: "/images/handwash-orange-500ml-pump.jpg" };
  }
  if (clean.includes("floor")) {
    return { slug: "floor-cleaners", name: "Floor Cleaners", fallbackImg: "/images/floorcleaner-rose-1l.jpg" };
  }
  if (clean.includes("toilet") || clean.includes("bath")) {
    return { slug: "toilet-bathroom-care", name: "Toilet & Bathroom Care", fallbackImg: "/images/toiletcleaner-perfumed-5l.jpg" };
  }
  if (clean.includes("car") || clean.includes("glass")) {
    return { slug: "car-glass-care", name: "Car & Glass Care", fallbackImg: "/images/carshampoo-500ml.jpg" };
  }
  if (clean.includes("air") || clean.includes("freshener")) {
    return { slug: "air-fresheners", name: "Air Fresheners", fallbackImg: "/images/airfreshener-lavender-500ml.jpg" };
  }
  return {
    slug: slugify(rawCategory) || "personal-care",
    name: rawCategory.trim() || "Personal Care",
    fallbackImg: "/images/facewash-sandal-200ml.jpg",
  };
}

function estimateStarterPrice(categorySlug: string, packSize: string): { price: number; mrp: number } {
  const pack = packSize.toLowerCase();
  if (categorySlug === "perfumes") return { price: 499, mrp: 699 };
  if (categorySlug === "crockery-gift-sets") {
    if (pack.includes("8")) return { price: 899, mrp: 1199 };
    if (pack.includes("7") || pack.includes("6")) return { price: 749, mrp: 999 };
    return { price: 549, mrp: 749 };
  }
  if (pack.includes("5l") || pack.includes("5 l")) return { price: 799, mrp: 999 };
  if (pack.includes("4kg") || pack.includes("4 kg")) return { price: 649, mrp: 799 };
  if (pack.includes("2l") || pack.includes("2 l") || pack.includes("2kg")) return { price: 379, mrp: 459 };
  if (pack.includes("1l") || pack.includes("1 l")) return { price: 219, mrp: 269 };
  if (pack.includes("500ml") || pack.includes("500 ml")) return { price: 149, mrp: 189 };
  if (pack.includes("400ml")) return { price: 129, mrp: 159 };
  if (pack.includes("200ml")) return { price: 179, mrp: 219 };
  if (pack.includes("bar") || pack.includes("100g")) return { price: 85, mrp: 110 };
  if (pack.includes("gel")) return { price: 99, mrp: 129 };
  return { price: 199, mrp: 249 };
}

function normalizeImagePath(rawImg: string | undefined, fallbackImg: string): string {
  const clean = (rawImg || "").trim();
  if (!clean) return fallbackImg;
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("/")) {
    return clean;
  }
  if (clean.startsWith("images/")) {
    return `/${clean}`;
  }
  return `/images/${clean}`;
}

/**
 * Parses CSV text supporting multiline quoted fields and flexible header names.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (ch === '"') {
      if (inQuotes && csvText[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && csvText[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }
  return rows;
}

export function importProductsFromCsv(
  rawCsvText: string,
  existingProducts: Product[],
  mode: "merge" | "replace" = "merge"
): { products: Product[]; importedRows: number } {
  const csvText = rawCsvText.replace(/^\uFEFF/, "");
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one product row.");
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const col = (...candidates: string[]) => {
    for (const c of candidates) {
      const i = headers.indexOf(c.toLowerCase());
      if (i >= 0) return i;
    }
    return -1;
  };

  const iCategory = col("category", "category_name");
  const iName = col("product name", "name", "product_name", "title");
  const iPack = col("pack size", "variant_label", "size", "variant");
  const iDesc = col("description", "tagline", "short_description");
  const iTagline = col("tagline", "short_tagline");
  const iImage = col("image", "image_url", "photo");
  const iPrice = col("price", "selling_price", "sale_price");
  const iMrp = col("mrp", "regular_price");
  const iStock = col("stock", "qty", "quantity");
  const iSku = col("sku");
  const iScent = col("scent", "fragrance");
  const iIngredients = col("ingredients", "key_ingredients");
  const iBadge = col("badge");

  if (iName < 0) {
    throw new Error('Could not find a "Product Name" or "name" column in your CSV.');
  }

  const bySlug = new Map<string, Product>(
    mode === "replace" ? [] : existingProducts.map((p) => [p.slug, p])
  );

  let importedRows = 0;

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const name = (cols[iName] || "").trim();
    if (!name) continue;

    const rawCat = iCategory >= 0 ? cols[iCategory] : "Laundry Detergents";
    const catMeta = getCategoryMeta(rawCat);
    const slug = slugify(name);

    const packLabel = (iPack >= 0 ? cols[iPack] : "") || "Standard Pack";
    const desc = (iDesc >= 0 ? cols[iDesc] : "") || `${name} by EVOKA Home & Personal Care.`;
    const tagline = (iTagline >= 0 ? cols[iTagline] : "") || desc;
    const rawImage = iImage >= 0 ? cols[iImage] : "";
    const imagePath = normalizeImagePath(rawImage, catMeta.fallbackImg);

    const est = estimateStarterPrice(catMeta.slug, packLabel);
    const parsedPrice = iPrice >= 0 ? Number(cols[iPrice]) : NaN;
    const price = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : est.price;
    const parsedMrp = iMrp >= 0 ? Number(cols[iMrp]) : NaN;
    const mrp = Number.isFinite(parsedMrp) && parsedMrp >= price ? parsedMrp : Math.round(price * 1.2);
    const parsedStock = iStock >= 0 ? Number(cols[iStock]) : NaN;
    const stock = Number.isFinite(parsedStock) && parsedStock >= 0 ? parsedStock : 50;
    const sku =
      (iSku >= 0 && cols[iSku]) ||
      `EVK-${slug.slice(0, 8).toUpperCase()}-${slugify(packLabel).toUpperCase() || r}`;
    const scent = (iScent >= 0 && cols[iScent]) || (name.includes(" - ") ? name.split(" - ").slice(1).join(" - ") : "Signature Fresh");
    const badge = iBadge >= 0 && cols[iBadge] ? cols[iBadge] : undefined;
    const ingredientsRaw = iIngredients >= 0 ? cols[iIngredients] : "";

    const variantObj = {
      id: `v-${slugify(sku)}-${r}`,
      label: packLabel,
      price,
      mrp,
      stock,
      sku,
      image: imagePath,
    };

    const existing = bySlug.get(slug);
    if (existing) {
      const vIdx = existing.variants.findIndex(
        (v) => v.label.toLowerCase() === packLabel.toLowerCase()
      );
      if (vIdx >= 0) {
        existing.variants[vIdx] = variantObj;
      } else {
        existing.variants.push(variantObj);
      }
      if (!existing.image || existing.image === catMeta.fallbackImg) {
        existing.image = imagePath;
      }
    } else {
      bySlug.set(slug, {
        id: `evk-${slug}`,
        slug,
        name,
        category: catMeta.slug,
        categoryName: catMeta.name,
        shortTagline: tagline,
        description: desc,
        scent,
        keyIngredients: ingredientsRaw
          ? ingredientsRaw.split(";").map((s) => s.trim()).filter(Boolean)
          : ["Active Surfactants", "Fragrance Boosters", "Purified Water"],
        freeFrom: ["Heavy Fillers", "Excessive Dilution"],
        howToUse: "Use as directed on the EVOKA pack label.",
        image: imagePath,
        badge,
        rating: 4.8,
        reviewCount: 24 + (r % 45),
        isFeatured: r <= 12,
        variants: [variantObj],
      });
    }
    importedRows++;
  }

  return { products: Array.from(bySlug.values()), importedRows };
}
