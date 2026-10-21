import type { Metadata } from "next";
import { TaxAdminView } from "./_components/TaxAdminView";

export const metadata: Metadata = {
  title: "Tax & Units",
  description:
    "Tax classes, HSN/SAC codes, units of measure and commerce pricing settings.",
};

/** Server component — interactivity lives in _components/TaxAdminView. */
export default function TaxPage() {
  return <TaxAdminView />;
}
