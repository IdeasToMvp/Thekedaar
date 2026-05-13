import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: when Vercel "Root Directory" is `FE`, trace from repo root
  // so the server bundle includes all dependencies (avoids empty/broken deploys).
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
