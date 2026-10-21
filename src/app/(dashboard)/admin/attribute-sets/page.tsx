import type { Metadata } from "next";
import { AttributeSetsView } from "./_components/AttributeSetsView";

export const metadata: Metadata = {
  title: "Attribute Sets",
  description:
    "Attribute sets: grouped attribute bundles assigned to categories.",
};

/** Server component — interactivity lives in _components/AttributeSetsView. */
export default function AttributeSetsPage() {
  return <AttributeSetsView />;
}
