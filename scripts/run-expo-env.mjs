import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const environment = process.argv[2];
const expoArguments = process.argv.slice(3);
const envFile = environment === "local" ? ".env.local" : environment === "production" ? ".env" : null;

if (!envFile || expoArguments.length === 0) {
  console.error("Usage: node scripts/run-expo-env.mjs <local|production> <expo command...>");
  process.exit(1);
}

function parseEnvFile(path) {
  const values = {};
  for (const sourceLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
  return values;
}

const envPath = resolve(process.cwd(), envFile);
let selectedEnvironment;
try {
  selectedEnvironment = parseEnvFile(envPath);
} catch (error) {
  console.error(`Could not read ${envFile}. Copy its example file and add the required Supabase values.`);
  process.exit(1);
}

for (const name of ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]) {
  if (!selectedEnvironment[name]) {
    console.error(`${envFile} is missing ${name}.`);
    process.exit(1);
  }
}

console.log(`Starting Expo with ${envFile} (${environment}).`);

const expoCli = require.resolve("expo/bin/cli");
const child = spawn(process.execPath, [expoCli, ...expoArguments], {
  env: {
    ...process.env,
    ...selectedEnvironment,
    EXPO_NO_DOTENV: "1",
  },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
