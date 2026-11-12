import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: "EVOKA | Home & Personal Care — Trivandrum, Kerala",
  description:
    "Laundry detergents, dish wash liquids, hand washes, floor cleaners, and personal care products from EVOKA in Pallichal & Poovar Uchakkada, Trivandrum. Free home delivery and Cash on Delivery.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFloat />
        </CartProvider>
      </body>
    </html>
  );
}
