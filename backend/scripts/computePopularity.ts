import { computePopularitySnapshots } from "../src/jobs/popularity.js";

computePopularitySnapshots()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
