# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Features

### Filesystem Access Control
- **Path validation**: Strict validation prevents directory traversal attacks
- **Platform-aware restrictions**: Access limited to safe directories based on OS
- **Sandboxed operations**: No access to system-critical directories
- **Path normalization**: Resolves and validates all paths before operations

### Platform-Specific Security

#### Linux
- **Safe directories**: `/home/`, `/tmp/`, `/var/tmp/`, `/opt/`, `/usr/local/`, `/etc/` (read-only)
- **Permission validation**: Respects Unix file permissions
- **Shell security**: Commands executed through `/bin/bash` with proper escaping

#### macOS  
- **Safe directories**: `/Users/`, `/tmp/`, `/var/tmp/`, `/opt/homebrew/`, `/usr/local/`
- **System protection**: No access to system directories or sensitive areas
- **Homebrew support**: Supports both Intel and Apple Silicon Homebrew paths

#### Windows
- **Safe directories**: `C:\Users\`, `C:\temp\`, `C:\tmp\`, additional drives
- **Drive restrictions**: Limited to specified drive letters
- **Command security**: Commands executed through `cmd.exe` with proper escaping

### Command Execution Security
- **Platform-aware shells**: Uses appropriate shell for each platform
- **Working directory validation**: Validates CWD before command execution  
- **Command sanitization**: Proper escaping and validation of shell commands
- **Error handling**: Secure error messages that don't leak sensitive paths

## Security Configuration

### Default Allowed Paths

#### Linux
```javascript
[
  '/home/',          // User directories
  '/tmp/',           // Temporary files
  '/var/tmp/',       // System temporary
  '/opt/',           // Optional software
  '/usr/local/',     // Local installations
  '/etc/'            // Configuration files (read access)
]
```

#### macOS
```javascript
[
  '/Users/',         // User directories  
  '/tmp/',           // Temporary files
  '/var/tmp/',       // System temporary
  '/opt/homebrew/',  // Homebrew (Apple Silicon)
  '/usr/local/'      // Homebrew (Intel) + local
]
```

#### Windows
```javascript
[
  'C:\\Users\\',     // User directories
  'C:\\temp\\',      // Temporary files
  'C:\\tmp\\',       // Alternative temp
  'D:\\'             // Additional drives
]
```

## Best Practices

### Path Security
- **Always use relative paths** when possible
- **Validate file operations** before execution
- **Check permissions** before file operations
- **Use path validation tools** to ensure safe access

### Command Execution
- **Validate commands** before execution
- **Use working directory validation** 
- **Avoid shell injection** through proper escaping
- **Monitor command output** for sensitive information

### File Operations
- **Check file sizes** before reading large files
- **Validate file types** for operations
- **Use appropriate encodings** for text files
- **Handle binary files** with care

## Security Restrictions

### Blocked Operations
- **No access to system directories**: `/etc/passwd`, `/sys/`, `/proc/`, etc.
- **No privilege escalation**: Cannot execute sudo or admin commands
- **No network operations**: Filesystem-only operations
- **No symlink traversal**: Symlinks resolved and validated

### Blocked Paths
- System root directories outside allowed paths
- Hidden system directories (`.git`, `.ssh`, etc. outside user areas)
- Executable directories that could contain malware
- Network shares and remote filesystem mounts

## Platform-Specific Considerations

### Linux Security
- **SELinux compatibility**: Respects SELinux policies
- **AppArmor support**: Works within AppArmor profiles
- **Container security**: Safe to use in containerized environments

### macOS Security
- **SIP compliance**: Respects System Integrity Protection
- **Gatekeeper compatibility**: Unsigned code execution limitations
- **Sandbox compatibility**: Works within macOS app sandboxes

### Windows Security
- **UAC compliance**: Respects User Account Control policies
- **Windows Defender**: Compatible with real-time protection
- **NTFS permissions**: Respects Windows file permissions

## Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do not** create a public GitHub issue
2. **Email** security concerns to: [Your Email]
3. **Include** platform information and steps to reproduce
4. **Provide** any relevant error messages or logs

Response timeline:
- Acknowledgment: 48 hours
- Initial assessment: 5 business days
- Security patch: 10 business days (for confirmed vulnerabilities)

## Security Testing

### Regular Testing
- Path traversal attack testing
- Command injection testing  
- Permission escalation testing
- Cross-platform compatibility testing

### Recommended Testing
Users should test in a sandboxed environment:
```bash
# Test in isolated directory
mkdir test-environment
cd test-environment
# Run MCP operations here
```

## Compliance

This MCP server follows:
- OWASP secure coding practices
- Platform-specific security guidelines
- Cross-platform compatibility standards
- Filesystem security best practices

## Audit Information

Last security review: 2025-06-26
Next scheduled review: 2025-12-26
Platform testing: Linux, macOS, Windows

For security questions, please open a GitHub issue with the "security" label.
