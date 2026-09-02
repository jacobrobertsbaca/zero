import { $ } from "bun";
import dotenv from "dotenv";
import { join } from "path";
import yoctoSpinner from "yocto-spinner";

const root = join(import.meta.dir, "..");
const envLocalPath = join(root, ".env.local");
const spinner = yoctoSpinner({ handleSignals: false });

async function loadEnv(path: string): Promise<Record<string, string>> {
  const file = Bun.file(path);
  return (await file.exists()) ? dotenv.parse(await file.text()) : {};
}

function isRemoteSupabaseUrl(url?: string): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

async function ensureDocker() {
  try {
    await $`docker info`.quiet();
  } catch {
    spinner.error("Docker is required for local Supabase");
    console.error("Install Docker Desktop: https://docs.docker.com/desktop/");
    process.exit(1);
  }
}

async function getLocalSupabaseEnv(): Promise<Record<string, string>> {
  spinner.start("Starting local Supabase");
  try {
    await $`npm exec -- supabase start`.cwd(root);
    const output =
      await $`npm exec -- supabase status -o env --override-name api.url=NEXT_PUBLIC_SUPABASE_URL --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY --override-name auth.service_role_key=SUPABASE_SERVER_KEY`
        .cwd(root)
        .quiet()
        .text();
    spinner.success("Supabase running");
    return dotenv.parse(output.replace(/^export /gm, ""));
  } catch (error) {
    spinner.error("Supabase couldn't start");
    throw error;
  }
}

async function startDevServer(extraEnv: Record<string, string> = {}) {
  spinner.info("Starting dev server");
  const proc = Bun.spawn(["npm", "exec", "--", "next", "dev"], {
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  await proc.exited;
}

const envLocal = await loadEnv(envLocalPath);
const useRemote = isRemoteSupabaseUrl(envLocal.NEXT_PUBLIC_SUPABASE_URL);

if (useRemote) {
  await startDevServer();
} else {
  await ensureDocker();
  const localEnv = await getLocalSupabaseEnv();
  await startDevServer({ ...envLocal, ...localEnv });
}
