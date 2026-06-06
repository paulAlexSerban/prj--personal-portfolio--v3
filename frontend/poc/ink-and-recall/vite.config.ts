import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv, type PluginOption } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const nitroPreset = process.env.NITRO_PRESET ?? "cloudflare-module";

export default defineConfig(({ command, mode }) => {
  const envDefine: Record<string, string> = {};
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");

  for (const [key, value] of Object.entries(loadedEnv)) {
    envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
  }

  const plugins: PluginOption[] = [
    tailwindcss(),
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
  ];

  plugins.push(
    ...tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: {
        entry: "server",
      },
    }),
  );

  if (command === "build") {
    plugins.push(
      ...nitro({
        preset: nitroPreset,
        output: {
          dir: "dist",
          serverDir: "dist/server",
          publicDir: "dist/client",
        },
        ...(nitroPreset === "cloudflare-module"
          ? {
              cloudflare: {
                nodeCompat: true,
                deployConfig: true,
              },
            }
          : {}),
      }),
    );
  }

  plugins.push(viteReact());

  return {
    define: envDefine,
    resolve: {
      alias: {
        "@": `${process.cwd()}/src`,
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
  };
});
