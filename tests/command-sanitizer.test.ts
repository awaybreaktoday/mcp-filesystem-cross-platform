import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ensureSafeExecutable, sanitizeCommand } from "../src/index.js";

describe("ensureSafeExecutable", () => {
  it("allows Windows executables with spaces and re-quotes them", () => {
    const result = ensureSafeExecutable(String.raw`"C:\Program Files\My App\tool.exe"`, "win32");
    assert.equal(result, String.raw`"C:\Program Files\My App\tool.exe"`);
  });

  it("allows Windows environment variables in the executable path", () => {
    const result = ensureSafeExecutable(String.raw`%ProgramFiles%\My App\tool.exe`, "win32");
    assert.equal(result, String.raw`"%ProgramFiles%\My App\tool.exe"`);
  });

  it("allows POSIX executables with spaces", () => {
    const result = ensureSafeExecutable("'/usr/local/My Tool/bin/tool'", "linux");
    assert.equal(result, "'/usr/local/My Tool/bin/tool'");
  });

  it("rejects executables with shell metacharacters", () => {
    assert.throws(() => ensureSafeExecutable("/bin/ls;rm", "linux"));
  });
});

describe("sanitizeCommand", () => {
  it("re-escapes Windows executables with spaces", () => {
    const result = sanitizeCommand('"C:\\Program Files\\My App\\tool.exe" --flag', "win32");
    assert.equal(result, '"C:\\Program Files\\My App\\tool.exe" --flag');
  });

  it("re-escapes POSIX executables with spaces", () => {
    const result = sanitizeCommand("'/usr/local/My Tool/bin/tool' --version", "linux");
    assert.equal(result, "'/usr/local/My Tool/bin/tool' --version");
  });

  it("strips unsafe metacharacters", () => {
    assert.throws(() => sanitizeCommand("/bin/ls && whoami", "linux"));
  });
});
