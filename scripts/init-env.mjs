import { copyFileSync, existsSync } from "node:fs";

const environment = process.argv[2];
const files =
  environment === "local"
    ? [
        [".env.local.example", ".env.local"],
        ["supabase/functions/.env.example", "supabase/functions/.env"],
      ]
    : environment === "production"
      ? [[".env.example", ".env"]]
      : null;

if (!files) {
  console.error("Usage: node scripts/init-env.mjs <local|production>");
  process.exit(1);
}

for (const [source, destination] of files) {
  if (existsSync(destination)) {
    console.log(`Keeping existing ${destination}.`);
    continue;
  }

  copyFileSync(source, destination);
  console.log(`Created ${destination} from ${source}.`);
}

console.log("Replace every placeholder before running the related environment.");
