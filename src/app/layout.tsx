import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RESOLVED_KEY, THEME_PRESETS } from "@/lib/themePresets";

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aurora Admin",
  description: "Secure e-commerce administration console",
};

/**
 * Blocking first-paint script: restores the saved theme's CSS vars before
 * the browser paints, so reloads (including the boot loader) never flash
 * the default palette. Runs before hydration; React never re-renders it.
 */
function themeBootScript(): string {
  const bootMap: Record<string, Record<string, string>> = {};
  for (const p of THEME_PRESETS) {
    bootMap[p.id] = {
      bg: p.colors.bg,
      surface: p.colors.surface,
      surface2: p.colors.surface2,
      line: p.colors.line,
      text: p.colors.text,
      muted: p.colors.muted,
      brand: p.colors.brand,
      brandStrong: p.colors.brandStrong,
      brandSoft: p.colors.brandSoft,
    };
  }
  const mapJson = JSON.stringify(bootMap).replace(/</g, "\\u003c");
  const resolvedKey = JSON.stringify(RESOLVED_KEY);
  return `(function(){try{var VAR={bg:"--background",surface:"--surface",surface2:"--surface-2",line:"--line",text:"--foreground",muted:"--muted",brand:"--brand",brandStrong:"--brand-strong",brandSoft:"--brand-soft"};var PRESETS=${mapJson};function hx(h){h=h.replace("#","");if(h.length===3){h=h.split("").map(function(c){return c+c}).join("")}var n=parseInt(h,16);return [(n>>16)&255,(n>>8)&255,n&255]}function toHx(r,g,b){function c(v){return Math.round(Math.min(255,Math.max(0,v))).toString(16).padStart(2,"0")}return "#"+c(r)+c(g)+c(b)}function mix(a,b,w){var A=hx(a),B=hx(b);return toHx(A[0]*w+B[0]*(1-w),A[1]*w+B[1]*(1-w),A[2]*w+B[2]*(1-w))}function apply(v){if(!v||typeof v!=="object")return;var d=document.documentElement;for(var k in VAR){if(typeof v[k]==="string"&&v[k]){try{d.style.setProperty(VAR[k],v[k])}catch(e){}}}try{d.style.setProperty("color-scheme","light")}catch(e){}}var raw=null;try{raw=localStorage.getItem(${resolvedKey})}catch(e){}if(raw){try{apply(JSON.parse(raw));return}catch(e){}}var pid=null;try{pid=localStorage.getItem("aurora-theme-preset")}catch(e){}var base=PRESETS[pid]||PRESETS["aurora"];var v={};for(var k in base){v[k]=base[k]}var custom=null;try{var c=localStorage.getItem("aurora-theme-custom");custom=c?JSON.parse(c):null}catch(e){custom=null}var HEX=/^#[0-9a-fA-F]{6}$/;if(custom&&typeof custom==="object"){for(var k in custom){if(typeof custom[k]==="string"&&HEX.test(custom[k])){v[k]=custom[k]}}if(typeof custom.brand==="string"&&HEX.test(custom.brand)){if(typeof custom.brandSoft!=="string"){v.brandSoft=mix(custom.brand,"#ffffff",0.12)}if(typeof custom.brandStrong!=="string"){v.brandStrong=mix(custom.brand,"#000000",0.78)}}}apply(v)}catch(e){}})();`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
