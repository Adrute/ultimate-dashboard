import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f5f1e9",
    description: "Suite personal y colaborativa para organizar lo importante.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "maskable",
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    lang: "es",
    name: "UltimateDashboard",
    orientation: "any",
    scope: "/",
    short_name: "Ultimate",
    start_url: "/dashboard",
    theme_color: "#9c5539",
  };
}
