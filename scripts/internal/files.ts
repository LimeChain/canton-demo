import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

import { ROOT_DIR } from './config.js';

export function rootPath(path: string): string {
  return join(ROOT_DIR, path);
}

export function ensureDir(path: string): void {
  mkdirSync(rootPath(path), { recursive: true });
}

export function readText(path: string): string {
  return readFileSync(rootPath(path), 'utf8');
}

export function writeText(path: string, value: string): void {
  mkdirSync(dirname(rootPath(path)), { recursive: true });
  writeFileSync(rootPath(path), value);
}

export function fileExists(path: string): boolean {
  return existsSync(rootPath(path));
}

export function removePath(path: string): void {
  rmSync(rootPath(path), { recursive: true, force: true });
}

export function readStamp(path: string): string {
  return fileExists(path) ? readText(path).trim() : '';
}

export function writeStamp(path: string, value: string): void {
  writeText(path, `${value}\n`);
}

export async function listFiles(paths: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const path of paths) {
    const absolute = rootPath(path);
    if (!existsSync(absolute)) continue;

    if (statSync(absolute).isFile()) {
      files.push(path);
      continue;
    }

    const directoryFiles = await collectFiles(absolute);
    files.push(...directoryFiles.map((file) => relative(ROOT_DIR, file)));
  }

  return files.sort();
}

export async function hashPaths(paths: string[]): Promise<string> {
  const files = await listFiles(paths);
  const hash = createHash('sha256');

  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(rootPath(file)));
    hash.update('\0');
  }

  return hash.digest('hex');
}

export async function hashSelectedFiles(files: string[]): Promise<string> {
  const hash = createHash('sha256');

  for (const file of files.sort()) {
    if (!fileExists(file)) continue;
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(rootPath(file)));
    hash.update('\0');
  }

  return hash.digest('hex');
}

async function collectFiles(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(child)));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }

  return files;
}
