import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DEFAULT_MODE, STORAGE_KEYS, THEME_PRESETS } from "@/lib/themePresets";
import type { ThemeColors } from "@/lib/theme";
import { config } from "@/lib/config";

// Inter for everything: compact neutral sans matching the console reference
// UI. Display var kept for future use; headings inherit the same family.
const display = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Absolute canonical/OG base — single source in src/lib/config.ts.
  metadataBase: new URL(config.siteUrl),
  title: {
    default: config.appName,
    // Panel pages pass a short title; the suffix keeps the existing tab text.
    template: "%s — Aurora Admin",
  },
  description: "Secure e-commerce administration console",
};

// API + media are same-origin by design (BFF proxy + /uploads rewrite), so
// there are no cross-origin origins worth a preconnect hint today. If a
// dedicated image CDN is introduced, add `<link rel="preconnect">` here.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17171a",
};

/**
 * Blocking first-paint script: restores the saved theme's CSS vars AND mode
 * (`dark` class + color-scheme) before the browser paints, so reloads
 * (including the boot loader) never flash the wrong palette or mode.
 * Runs before hydration; React never re-renders it.
 */
function themeBootScript(): string {
  const bootMap: Record<string, { l: Record<string, string>; d: Record<string, string> }> = {};
  type ColorKeys =
    | "bg"
    | "surface"
    | "surface2"
    | "line"
    | "lineStrong"
    | "text"
    | "muted"
    | "faint"
    | "brand"
    | "brandStrong"
    | "brandSoft";
  const pick = (c: Pick<ThemeColors, ColorKeys>) => ({
    bg: c.bg,
    surface: c.surface,
    surface2: c.surface2,
    line: c.line,
    lineStrong: c.lineStrong,
    text: c.text,
    muted: c.muted,
    faint: c.faint,
    brand: c.brand,
    brandStrong: c.brandStrong,
    brandSoft: c.brandSoft,
  });
  for (const p of THEME_PRESETS) {
    bootMap[p.id] = { l: pick(p.colors.light), d: pick(p.colors.dark) };
  }
  const mapJson = JSON.stringify(bootMap).replace(/</g, "\\u003c");
  return `(function(){try{var VAR={bg:"--background",surface:"--surface",surface2:"--surface-2",line:"--line",lineStrong:"--line-strong",text:"--foreground",muted:"--muted",faint:"--faint",brand:"--brand",brandStrong:"--brand-strong",brandSoft:"--brand-soft"};var PRESETS=${mapJson};function hx(h){h=h.replace("#","");if(h.length===3){h=h.split("").map(function(c){return c+c}).join("")}var n=parseInt(h,16);return [(n>>16)&255,(n>>8)&255,n&255]}function toHx(r,g,b){function c(v){return Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,"0")}return "#"+c(r)+c(g)+c(b)}function mix(a,b,w){var A=hx(a),B=hx(b);return toHx(A[0]*w+B[0]*(1-w),A[1]*w+B[1]*(1-w),A[2]*w+B[2]*(1-w))}function get(k){try{return localStorage.getItem(k)}catch(e){return null}}function apply(v,m){if(!v||typeof v!=="object")return;var d=document.documentElement;for(var k in VAR){if(typeof v[k]==="string"&&v[k]){try{d.style.setProperty(VAR[k],v[k])}catch(e){}}}try{d.style.setProperty("color-scheme",m)}catch(e){}d.classList.toggle("dark",m==="dark")}var raw=get(${JSON.stringify(STORAGE_KEYS.resolved)});if(raw){try{var r=JSON.parse(raw);apply(r.v,r.m==="dark"?"dark":"light");return}catch(e){}}var pid=get(${JSON.stringify(STORAGE_KEYS.preset)})||"onyx";if(!PRESETS[pid])pid="onyx";var rm=get(${JSON.stringify(STORAGE_KEYS.mode)});var m=rm==="light"?"light":rm==="dark"?"dark":${JSON.stringify(DEFAULT_MODE)};var v={};var base=PRESETS[pid][m];for(var k in base){v[k]=base[k]}var cs=get(${JSON.stringify(STORAGE_KEYS.custom)});if(cs){try{var cu=JSON.parse(cs);var HEX=/^#[0-9a-fA-F]{6}$/;for(var k in cu){if(typeof cu[k]==="string"&&HEX.test(cu[k])){v[k]=cu[k]}}if(typeof cu.brand==="string"&&HEX.test(cu.brand)){if(typeof cu.brandSoft!=="string"){v.brandSoft=m==="dark"?mix(cu.brand,"#0b0c10",0.8):mix(cu.brand,"#ffffff",0.12)}if(typeof cu.brandStrong!=="string"){v.brandStrong=m==="dark"?mix(cu.brand,"#ffffff",0.55):mix(cu.brand,"#000000",0.78)}}}catch(e){}}apply(v,m)}catch(e){}})();`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the blocking theme script above sets CSS vars
    // and the `dark` class on <html> before paint, and browser extensions may
    // add <body> attrs — neither is known to React's SSR snapshot. Mismatches
    // deeper in the tree still warn as usual.
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
