import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/images/", "/icon*", "/favicon*"],
      },
    ],
    sitemap: "https://evokahomecare.com/sitemap.xml",
  };
}
