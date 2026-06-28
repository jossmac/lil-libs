#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB_PACKAGE_DIR = join(REPO_ROOT, "packages", "lil-libs");
const LIB_PACKAGE_PREFIX = "packages/lil-libs";

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

  bumpPackageVersion(releaseType);

  const version = getPackageVersion();
  const tag = `v${version}`;

  run("git", ["add", `${LIB_PACKAGE_PREFIX}/package.json`], { cwd: REPO_ROOT });
  run("git", ["commit", "-m", tag], { cwd: REPO_ROOT });
  run("git", ["tag", tag], { cwd: REPO_ROOT });

  if (shouldPush) {
    run("git", ["push", "--follow-tags"], { cwd: REPO_ROOT });
    console.log(`\nRelease complete: ${tag} (pushed with tags).`);
  } else {
    console.log(`\nRelease complete: ${tag} (local only).`);
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
  - Bumps version in packages/lil-libs, then creates a release commit and git tag from the repo root.
  - By default it pushes commit + tags via git push --follow-tags.
`);

  process.exit(exitCode);
}

function ensureCleanGitTree() {
  const output = execFileSync("git", ["status", "--porcelain"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();

  if (output) {
    throw new Error(
      "Git working tree is not clean. Commit or stash changes first.",
    );
  }
}

function bumpPackageVersion(releaseType) {
  run(
    "npm",
    ["version", releaseType, "--no-git-tag-version", "--prefix", LIB_PACKAGE_PREFIX],
    { cwd: REPO_ROOT },
  );
}

function run(command, commandArgs, options = {}) {
  execFileSync(command, commandArgs, { stdio: "inherit", ...options });
}

function getPackageVersion() {
  const packageJsonPath = join(LIB_PACKAGE_DIR, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string") {
    throw new Error(
      "Could not read version from packages/lil-libs/package.json",
    );
  }

  return packageJson.version;
}
