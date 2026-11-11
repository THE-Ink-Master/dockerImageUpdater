import { CronJob } from "cron";
import { run } from "./check.js"
import { loadEnvFile } from "node:process";
if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
}

let checkNum = 0;

const when = (() => {
  const hour = parseInt(process.env.TIME);
  return hour >= 0 && hour <= 23 ? hour : 9;
})();

console.log(`Checking for updates at ${when}.`);

try {
  const job = new CronJob(
    // '* * * * * *',
    // "0 * * * * *",
    `0 0 ${when} * * *`,
    async function () {
      try {
        checkNum += 1;
        console.log(`Running check #${checkNum}...`);
        const data = await run(true);
        console.log(data);
      } catch (err) {
        console.error(err);
      }
    },
    null,
    true,
    process.env.TZ,
  );
} catch (err) {
  console.error("An unexpected error has occurred: ", err);
  throw err;
}

process.on("SIGTERM", function(code_signal_error){
    process.exit(0)
})
