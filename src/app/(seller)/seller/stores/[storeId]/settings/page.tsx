import type { Metadata } from "next";
import { StoreSettingsView } from "./_components/StoreSettingsView";

export const metadata: Metadata = {
  title: "Store settings — Aurora Seller",
  description: "Edit the store profile, contact, and locale.",
};

/** Server component — interactivity lives in _components/StoreSettingsView. */
export default function StoreSettingsPage() {
  return <StoreSettingsView />;
}
