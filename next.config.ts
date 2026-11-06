import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // O serializador Protobuf do Firestore identifica Long pelo nome da classe.
  // Carregue o SDK nativamente para que o bundle não renomeie esses tipos.
  serverExternalPackages: ["@google-cloud/firestore", "google-auth-library", "nodemailer"],
};

export default nextConfig;
