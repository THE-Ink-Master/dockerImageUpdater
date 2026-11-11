import { run } from "./check.js"

try {
  const data = await run(false);
  console.log(data);
  process.exit(0);
} catch (err) {
  console.log(err);
  process.exit(1);
}