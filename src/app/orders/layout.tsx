import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order & Invoice — EVOKA",
  description:
    "Track your EVOKA order status live, view official tax invoices, or edit delivery details using your Order ID and phone number.",
  alternates: {
    canonical: "https://evokahomecare.com/orders",
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
