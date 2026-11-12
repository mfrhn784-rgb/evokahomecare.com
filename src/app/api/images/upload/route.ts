import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getProducts, saveProducts } from "@/lib/store-db";
import { getEvokaBlobStore, isBlobsRuntime } from "@/lib/netlify-blobs-helper";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const UPLOAD_BLOB_STORE = "evoka-images";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to Admin." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const productId = formData.get("productId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No image files selected." }, { status: 400 });
    }

    const savedPaths: string[] = [];

    for (const file of files) {
      const safeName = path
        .basename(file.name)
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();
      if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(safeName)) {
        continue;
      }
      const arrayBuf = await file.arrayBuffer();

      if (isBlobsRuntime()) {
        const blobStore = getEvokaBlobStore(UPLOAD_BLOB_STORE, true);
        await blobStore.set(safeName, arrayBuf, {
          metadata: { contentType: file.type || "image/jpeg" },
        });
        savedPaths.push(`/api/images/${encodeURIComponent(safeName)}`);
      } else {
        if (!fs.existsSync(IMAGES_DIR)) {
          fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(IMAGES_DIR, safeName), Buffer.from(arrayBuf));
        savedPaths.push(`/images/${safeName}`);
      }
    }

    if (savedPaths.length === 0) {
      return NextResponse.json(
        { error: "Please upload valid JPG, PNG, or WebP images." },
        { status: 400 }
      );
    }

    let updatedProducts = await getProducts();
    if (productId) {
      updatedProducts = updatedProducts.map((p) =>
        p.id === productId ? { ...p, image: savedPaths[0] } : p
      );
      await saveProducts(updatedProducts);
    }

    return NextResponse.json({
      uploadedCount: savedPaths.length,
      savedPaths,
      products: updatedProducts,
    });
  } catch {
    return NextResponse.json({ error: "Image upload failed." }, { status: 500 });
  }
}
