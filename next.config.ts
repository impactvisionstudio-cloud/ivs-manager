import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config) => {
    // A pasta /data guarda o banco de dados em Excel. Sem isso, gravar o
    // arquivo (ao criar/editar/excluir algo) faz o servidor de dev recarregar
    // a página no meio da operação.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/.git/**", "**/data/**"],
    };
    return config;
  },
};

export default nextConfig;
