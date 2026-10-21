import type { Metadata } from "next";
import { CatalogAttributesView } from "./_components/CatalogAttributesView";

export const metadata: Metadata = {
  title: "Attributes",
  description:
    "The product-attribute catalog: definitions, options, and seller suggestions.",
};

/** Server component — interactivity lives in _components/CatalogAttributesView. */
export default function CatalogAttributesPage() {
  return <CatalogAttributesView />;
}
