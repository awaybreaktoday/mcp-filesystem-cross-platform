import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { CrossPlatformFilesystemMCP } from "../src/index.js";

async function testFileCopy() {
  const instance = new CrossPlatformFilesystemMCP();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-copy-file-"));
  const sourceFile = path.join(tempDir, "source.txt");
  const destinationFile = path.join(tempDir, "destination.txt");

  await fs.writeFile(sourceFile, "hello world", "utf8");

  const result = await (instance as any).copyItem(sourceFile, destinationFile);

  const copiedContent = await fs.readFile(destinationFile, "utf8");
  assert.equal(copiedContent, "hello world", "file contents should match after copy");
  assert.ok(result.content[0].text.includes("Copied"), "response should include success message");

  await fs.rm(tempDir, { recursive: true, force: true });
}

async function testDirectoryCopy() {
  if (process.platform === "win32") {
    console.warn("Skipping directory copy integration test on Windows");
    return;
  }

  const instance = new CrossPlatformFilesystemMCP();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-copy-dir-"));
  const sourceDir = path.join(tempDir, "source dir");
  const nestedDir = path.join(sourceDir, "nested");
  const nestedFile = path.join(nestedDir, "example.txt");
  const destinationDir = path.join(tempDir, "destination dir");

  await fs.mkdir(nestedDir, { recursive: true });
  await fs.writeFile(nestedFile, "nested content", "utf8");

  const result = await (instance as any).copyItem(sourceDir, destinationDir);
  assert.ok(result.content[0].text.includes("Copied"), "response should include success message");

  const copiedFile = path.join(destinationDir, "nested", "example.txt");
  const copiedContent = await fs.readFile(copiedFile, "utf8");
  assert.equal(copiedContent, "nested content", "directory copy should include nested files");

  await fs.rm(tempDir, { recursive: true, force: true });
}

async function testCopyCommands() {
  const instance = new CrossPlatformFilesystemMCP();

  (instance as any).platform = "linux";
  let command = await (instance as any).getCopyCommand("/tmp/source dir", "/tmp/destination dir", true);
  assert.equal(command, 'cp -R "/tmp/source dir" "/tmp/destination dir"', "posix directory copy should use cp -R");

  command = await (instance as any).getCopyCommand("/tmp/source.txt", "/tmp/destination.txt", false);
  assert.equal(command, 'cp "/tmp/source.txt" "/tmp/destination.txt"', "posix file copy should use cp");

  (instance as any).platform = "win32";
  command = await (instance as any).getCopyCommand("C:\\source dir", "C:\\destination dir", true);
  assert.equal(command, 'xcopy "C:\\source dir" "C:\\destination dir" /E /I /Y', "windows directory copy should use xcopy with recursion");

  command = await (instance as any).getCopyCommand("C:\\source.txt", "C:\\destination.txt", false);
  assert.equal(command, 'copy "C:\\source.txt" "C:\\destination.txt"', "windows file copy should use copy");
}

async function main() {
  await testFileCopy();
  await testDirectoryCopy();
  await testCopyCommands();
  console.log("All copy tests passed");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
