import React from "react";

export function JsonLd() {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://evokahomecare.com/#organization",
    "name": "EVOKA",
    "legalName": "EVOKA Home & Personal Care",
    "url": "https://evokahomecare.com",
    "logo": "https://evokahomecare.com/images/evoka-logo-square.png",
    "image": "https://evokahomecare.com/images/evoka-og-banner.png",
    "description": "Everyday Clean, Elevated. High-performance laundry detergents, dishwash liquids, floor cleaners, and personal care products crafted in Trivandrum, Kerala.",
    "telephone": "+91-9143374741",
    "email": "evokacleanings@gmail.com",
    "sameAs": [
      "https://www.instagram.com/evokahomecare",
      "https://wa.me/919143374741"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Pallichal Junction & Poovar Uchakkada",
      "addressLocality": "Thiruvananthapuram",
      "addressRegion": "Kerala",
      "postalCode": "695020",
      "addressCountry": "IN"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+91-9143374741",
        "contactType": "Customer Service",
        "areaServed": "IN",
        "availableLanguage": ["English", "Malayalam"]
      }
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://evokahomecare.com/#website",
    "name": "EVOKA Home & Personal Care",
    "alternateName": ["EVOKA", "EVOKA Kerala", "EVOKA Detergents Trivandrum"],
    "url": "https://evokahomecare.com",
    "publisher": {
      "@id": "https://evokahomecare.com/#organization"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://evokahomecare.com/shop?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://evokahomecare.com/#localbusiness",
    "name": "EVOKA Home & Personal Care - Trivandrum",
    "image": "https://evokahomecare.com/images/evoka-og-banner.png",
    "url": "https://evokahomecare.com",
    "telephone": "+91-9143374741",
    "priceRange": "₹",
    "currenciesAccepted": "INR",
    "paymentAccepted": "Cash, UPI, Google Pay, PhonePe, Paytm",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Pallichal Junction & Poovar Uchakkada",
      "addressLocality": "Thiruvananthapuram",
      "addressRegion": "Kerala",
      "postalCode": "695020",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 8.4419,
      "longitude": 77.0152
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:30",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Sunday"],
        "opens": "10:00",
        "closes": "14:00"
      }
    ],
    "department": [
      {
        "@type": "Store",
        "name": "EVOKA Depot - Poovar Uchakkada",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Poovar Uchakkada",
          "addressLocality": "Thiruvananthapuram",
          "addressRegion": "Kerala",
          "addressCountry": "IN"
        },
        "telephone": "+91-9143374741"
      },
      {
        "@type": "Store",
        "name": "EVOKA Depot - Pallichal Junction",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Pallichal Junction",
          "addressLocality": "Thiruvananthapuram",
          "addressRegion": "Kerala",
          "addressCountry": "IN"
        },
        "telephone": "+91-9143374741"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
