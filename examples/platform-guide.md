# Cross-Platform Filesystem MCP - Platform Guide

## Platform Detection

The MCP automatically detects your platform and configures appropriate paths and commands.

### Supported Platforms
- **Linux** - Full support with Unix-style operations
- **macOS** - Full support with Unix-style operations + Homebrew paths
- **Windows** - Full support with Windows-specific adaptations
- **FreeBSD/OpenBSD** - Basic support with Unix-style operations

## Platform-Specific Features

### Linux

#### Allowed Paths
```
/home/          # User directories
/tmp/           # Temporary files
/var/tmp/       # System temporary
/opt/           # Optional software
/usr/local/     # Local installations
/etc/           # Configuration files (read-only)
```

#### Commands
- Search: `find` with Unix wildcards
- Shell: `/bin/bash`
- Copy: `cp` for files and directories

#### Usage Examples
```
"List files in my home directory"
"Search for *.py files in /home/user/projects"
"Read the contents of /etc/hostname"
"Create a directory in /tmp/myproject"
```

### macOS

#### Allowed Paths
```
/Users/         # User directories
/tmp/           # Temporary files
/var/tmp/       # System temporary
/opt/homebrew/  # Homebrew (Apple Silicon)
/usr/local/     # Homebrew (Intel) + local installations
```

#### Commands
- Search: `find` with Unix wildcards
- Shell: `/bin/bash`
- Copy: `cp` for files and directories

#### Usage Examples
```
"List my Desktop files"
"Search for config files in /opt/homebrew"
"Create a backup in /tmp"
"Read my .bashrc file"
```

#### Homebrew Support
- **Apple Silicon Macs**: `/opt/homebrew/` access
- **Intel Macs**: `/usr/local/` access
- Both directories supported for maximum compatibility

### Windows

#### Allowed Paths
```
C:\Users\       # User directories
C:\temp\        # Temporary files
C:\tmp\         # Alternative temp directory
D:\             # Additional drives (configurable)
```

#### Commands
- Search: `dir` with Windows wildcards and recursion
- Shell: `cmd.exe`
- Copy: `copy` for files, `xcopy` for directories

#### Usage Examples
```
"List files in my Documents folder"
"Search for *.js files in C:\Users\Username\Projects"
"Create a directory in C:\temp\myproject"
"Read the contents of C:\Users\Username\config.txt"
```

#### Windows-Specific Notes
- **Drive Letters**: Supports multiple drives (C:, D:, etc.)
- **Path Separators**: Handles both `\` and `/` (Node.js normalizes)
- **Hidden Files**: Filters both `.` and `$` prefixed files
- **Long Paths**: Supports Windows long path names

## Usage Examples by Platform

### File Operations

#### Linux/macOS
```
"Create a new directory called 'projects' in my home folder"
"Copy ~/.bashrc to /tmp/bashrc-backup"
"Search for all JavaScript files in ~/projects"
"Read the contents of /etc/os-release"
```

#### Windows
```
"Create a new directory called 'projects' in my Documents"
"Copy my config file to C:\temp\config-backup.txt"
"Search for all JavaScript files in C:\Users\Username\projects"
"List all files in my Downloads folder"
```

### Command Execution

#### Linux
```
"Run 'ls -la' in my home directory"
"Execute 'grep -r \"TODO\" .' in my projects folder"
"Run 'df -h' to check disk usage"
"Execute 'ps aux | grep node'"
```

#### macOS
```
"Run 'ls -la' in my Documents folder"
"Execute 'brew list' to see installed packages"
"Run 'system_profiler SPHardwareDataType'"
"Execute 'find . -name \"*.log\" -mtime +7'"
```

#### Windows
```
"Run 'dir' in my Documents folder"
"Execute 'systeminfo' to see system information"
"Run 'tasklist' to see running processes"
"Execute 'ipconfig /all' to see network configuration"
```

## Platform-Aware Best Practices

### Path Handling
- **Use forward slashes** - Node.js handles conversion automatically
- **Relative paths** - Start from home directory when possible
- **Path validation** - MCP validates all paths for security

### Command Usage
- **Platform detection** - Check platform with "What platform am I on?"
- **Appropriate commands** - Use `ls` on Unix, `dir` on Windows
- **Working directory** - Specify working directory for commands

### File Operations
- **Text encoding** - UTF-8 by default, specify encoding if needed
- **File sizes** - Be careful with large files
- **Permissions** - Respect platform file permissions

## Security Considerations

### Path Security
- Access restricted to safe directories only
- No access to system-critical areas
- Path traversal protection

### Command Security
- Commands executed in validated directories
- Shell injection protection
- Platform-appropriate shell selection

### Platform-Specific Security

#### Linux
- Respects file permissions and ownership
- Works with SELinux and AppArmor
- Safe for containerized environments

#### macOS
- Respects System Integrity Protection (SIP)
- Compatible with Gatekeeper policies
- Works within app sandboxes

#### Windows
- Respects User Account Control (UAC)
- Compatible with Windows Defender
- Follows NTFS permission model

## Troubleshooting

### Common Issues

#### Path Not Found
```
Error: Access denied: Path outside allowed directories
Solution: Use "get platform info" to see allowed paths
```

#### Command Not Found
```
Error: Command not found
Solution: Use platform-appropriate commands (ls vs dir)
```

#### Permission Denied
```
Error: Permission denied
Solution: Check file permissions and path access
```

### Platform-Specific Issues

#### Linux
- **SELinux**: Check SELinux policies if operations fail
- **Permissions**: Ensure user has appropriate file permissions
- **Paths**: Verify paths exist and are accessible

#### macOS
- **SIP**: Some system areas protected by System Integrity Protection
- **Permissions**: May need to grant Terminal or Claude permission
- **Homebrew**: Check if Homebrew is installed in expected location

#### Windows
- **UAC**: Some operations may require administrator privileges
- **Paths**: Use full drive paths (C:\) not relative
- **Long paths**: Windows has path length limitations

## Migration Guide

### From macOS-only to Cross-Platform
If migrating from a macOS-specific filesystem MCP:

1. **Update configuration** to use cross-platform version
2. **Test platform detection** with "What platform am I on?"
3. **Verify paths** are accessible on your platform
4. **Update commands** to use platform-appropriate syntax

### Benefits of Cross-Platform Version
- **Future-proof** for different environments
- **Better error handling** with platform awareness
- **Consistent behavior** across all platforms
- **Enhanced security** with platform-specific restrictions

This cross-platform approach ensures your filesystem operations work seamlessly regardless of your operating system!
