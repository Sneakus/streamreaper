import { config } from "dotenv";
import { resolve } from "path";

import { sendTestEmail } from "../services/emailNotifier";

config({ path: resolve(process.cwd(), ".env.local") });

const TO = "aljthegreat@yahoo.com";

async function main(): Promise<void> {
  console.log("=== StreamReaper — Resend test email ===\n");
  console.log(`Sending test email to ${TO}…\n`);

  const id = await sendTestEmail(TO);
  console.log("✅ Sent. Resend email id:", id);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
