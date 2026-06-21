import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true" && repoName.length > 0;

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? `/${repoName}/` : "/",
});
