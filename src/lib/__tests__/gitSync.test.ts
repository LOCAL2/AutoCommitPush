// Unit test for GitHub Remote Sync & Behind status logic

import type { RemoteSyncStatus } from "@/types";

export function formatSyncBannerMessage(sync: RemoteSyncStatus): string {
  if (sync.is_behind) {
    return `GitHub Has New Changes (${sync.behind} commit${sync.behind > 1 ? "s" : ""} behind)`;
  }
  return "Local branch is up to date";
}

// Test runner function
export function runSyncUnitTests() {
  const test1: RemoteSyncStatus = { ahead: 0, behind: 2, is_behind: true };
  const msg1 = formatSyncBannerMessage(test1);
  if (msg1 !== "GitHub Has New Changes (2 commits behind)") {
    throw new Error(`Test 1 Failed: Got "${msg1}"`);
  }

  const test2: RemoteSyncStatus = { ahead: 1, behind: 0, is_behind: false };
  const msg2 = formatSyncBannerMessage(test2);
  if (msg2 !== "Local branch is up to date") {
    throw new Error(`Test 2 Failed: Got "${msg2}"`);
  }

  console.log("✅ All GitHub Remote Sync unit tests passed successfully!");
}
