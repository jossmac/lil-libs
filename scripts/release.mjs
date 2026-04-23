#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const ALLOWED_RELEASE_TYPES = new Set(["patch", "minor", "major"]);

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("-")));
const releaseType = args.find((arg) => !arg.startsWith("-"));

if (flags.has("-h") || flags.has("--help") || !releaseType) {
  printUsage(0);
}

if (!ALLOWED_RELEASE_TYPES.has(releaseType)) {
  console.error(
    `Invalid release type: ${JSON.stringify(releaseType)}. Expected one of patch, minor, or major.`,
  );
  printUsage(1);
}

const shouldPush = !flags.has("--no-push");

try {
  ensureCleanGitTree();

  run("npm", ["version", releaseType]);

  const version = getPackageVersion();

  if (shouldPush) {
    run("git", ["push", "--follow-tags"]);
    console.log(`\nRelease complete: v${version} (pushed with tags).`);
  } else {
    console.log(`\nRelease complete: v${version} (local only).`);
    console.log("Push later with: git push --follow-tags");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nRelease failed: ${message}`);
  process.exit(1);
}

function printUsage(exitCode) {
  console.log(`
Usage:
  pnpm release <patch|minor|major> [--no-push]

Examples:
  pnpm release patch
  pnpm release minor
  pnpm release major -- --no-push

Notes:
  - Uses npm version under the hood, so it creates a release commit and git tag.
  - By default it pushes commit + tags via git push --follow-tags.
`);

  process.exit(exitCode);
}

function ensureCleanGitTree() {
  const output = execFileSync("git", ["status", "--porcelain"], {
    encoding: "utf8",
  }).trim();

  if (output) {
    throw new Error(
      "Git working tree is not clean. Commit or stash changes first.",
    );
  }
}

function run(command, commandArgs) {
  execFileSync(command, commandArgs, { stdio: "inherit" });
}

function getPackageVersion() {
  const raw = execFileSync("npm", ["pkg", "get", "version"], {
    encoding: "utf8",
  }).trim();

  return raw.replaceAll('"', "");
}
