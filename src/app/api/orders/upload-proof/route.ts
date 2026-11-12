import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getEvokaBlobStore, isBlobsRuntime } from "@/lib/netlify-blobs-helper";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const UPLOAD_BLOB_STORE = "evoka-images";
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No screenshot file provided." }, { status: 400 });
    }

    const extMatch = file.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
    if (!extMatch) {
      return NextResponse.json(
        { error: "Only JPG, PNG, or WebP payment screenshots are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROOF_BYTES) {
      return NextResponse.json(
        { error: "Screenshot must be under 5 MB." },
        { status: 400 }
      );
    }

    const ext = extMatch[1];
    const uniqueName = `upi-proof-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const arrayBuf = await file.arrayBuffer();

    if (isBlobsRuntime()) {
      const blobStore = getEvokaBlobStore(UPLOAD_BLOB_STORE, true);
      await blobStore.set(uniqueName, arrayBuf, {
        metadata: { contentType: file.type || "image/jpeg" },
      });
      return NextResponse.json({ url: `/api/images/${encodeURIComponent(uniqueName)}` });
    }

    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(IMAGES_DIR, uniqueName), Buffer.from(arrayBuf));
    return NextResponse.json({ url: `/api/images/${encodeURIComponent(uniqueName)}` });
  } catch {
    return NextResponse.json(
      { error: "Could not upload payment screenshot." },
      { status: 500 }
    );
  }
}
