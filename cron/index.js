import { CronJob } from "cron";
import { loadEnvFile } from "node:process";
if (process.env.NODE_ENV !== "production") {
  loadEnvFile();
  process.env.SECONDS = "*"
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let checkNum = 0;

const when = (() => {
  const hour = parseInt(process.env.TIME);
  return (hour >= 0 && hour <= 23) ? hour : 9;
})();

console.log("Waiting 10 seconds for Next.js to load ... ")

await delay(10000)

console.log(`Checking for updates at ${when}.`);

try {
  const job = new CronJob(
    `0 0 ${when} * * *`,
    async function () {
      try {
        checkNum += 1;
        console.log(`Running check #${checkNum}...`);
        await fetch("http://localhost:80/api/update", {
          method: "POST"
        });
      } catch (err) {
        console.error(err)
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
