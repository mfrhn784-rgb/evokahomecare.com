import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getEvokaBlobStore, isBlobsRuntime } from "@/lib/netlify-blobs-helper";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const UPLOAD_BLOB_STORE = "evoka-images";

function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params;
  const safeName = path.basename(decodeURIComponent(name)).replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safeName) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (isBlobsRuntime()) {
    try {
      const store = getEvokaBlobStore(UPLOAD_BLOB_STORE, false);
      const entry = await store.getWithMetadata(safeName, { type: "arrayBuffer" });
      if (entry && entry.data) {
        const contentType =
          typeof entry.metadata?.contentType === "string"
            ? entry.metadata.contentType
            : getMimeType(safeName);
        return new NextResponse(entry.data as ArrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {
      // Fallback to public/images
    }
  }

  const localPath = path.join(IMAGES_DIR, safeName);
  if (fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(safeName),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  return new NextResponse("Image not found", { status: 404 });
}
