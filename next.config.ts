import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: {
    appIsrStatus: false, // Desativa o indicador de ISR / prerender
    buildActivity: false, // Desativa o indicador de compilação
  },
};

export default nextConfig;
