# Cross-Platform Filesystem MCP Server

A comprehensive filesystem MCP server that works across Linux, macOS, and Windows platforms with intelligent platform-specific adaptations.

## 🌍 Platform Support

### ✅ Supported Platforms
- **Linux** - Full support with Unix-style commands
- **macOS** - Full support with Unix-style commands  
- **Windows** - Full support with Windows-specific commands
- **FreeBSD/OpenBSD** - Basic support

## 🔧 Platform-Specific Features

### **Linux** (`/home/`, `/tmp/`, `/opt/`, `/usr/local/`, `/etc/`)
- Uses `find` for file search
- Unix-style permissions and ownership
- Standard shell commands via `/bin/bash`
- Package manager paths included

### **macOS** (`/Users/`, `/tmp/`, `/opt/homebrew/`, `/usr/local/`)
- Uses `find` for file search
- Unix-style permissions and ownership
- Homebrew paths for both Intel and Apple Silicon
- Standard shell commands via `/bin/bash`

### **Windows** (`C:\Users\`, `C:\temp\`, `C:\tmp\`, `D:\`)
- Uses `dir` for file search with recursion
- Windows-style paths and permissions
- Commands via `cmd.exe`
- Multiple drive support

## 🛠️ Available Tools

### Core Filesystem Operations
- `get_platform_info` - Show current platform and allowed paths
- `list_directory` - List directory contents with platform-aware hidden file filtering
- `read_file` / `write_file` - File content operations
- `create_directory` / `delete_directory` - Directory management
- `delete_file` - File removal
- `move_item` / `copy_item` - File/directory manipulation
- `get_file_info` - Detailed file metadata (platform-specific)

### Search & Navigation
- `search_files` - Platform-aware file search (find/dir)
- `get_current_directory` - Current working directory info
- `execute_command` - Platform-aware shell command execution

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd mcp-filesystem-cross-platform
npm install
```

### 2. Build (Optional)
```bash
npm run build
```

### 3. Run Development Mode
```bash
npm run dev
```

### 4. Install to a Runtime Directory (Optional)
```bash
./scripts/install-runtime.sh
```

By default the script installs the server into `/opt/mcp-servers/mcp-filesystem-cross-platform`. Use `--prefix` to change the parent directory or `--name` to customize the folder name.

## 📋 Platform-Specific Allowed Paths

The MCP automatically detects the platform and restricts access to safe directories:

### Linux
```
/home/          # User directories
/tmp/           # Temporary files  
/var/tmp/       # System temporary
/opt/           # Optional software
/usr/local/     # Local installations
/etc/           # Configuration files (read access)
```

### macOS  
```
/Users/         # User directories
/tmp/           # Temporary files
/var/tmp/       # System temporary  
/opt/homebrew/  # Homebrew (Apple Silicon)
/usr/local/     # Homebrew (Intel) + local installations
```

### Windows
```
C:\Users\       # User directories
C:\temp\        # Temporary files
C:\tmp\         # Alternative temp
D:\             # Additional drives
```

## 🔒 Security Features

- **Path validation** prevents directory traversal attacks
- **Platform-aware restrictions** to system-appropriate safe directories
- **Sandboxed execution** environment
- **No access to system-critical directories** outside allowed paths

## ⚙️ Claude Desktop Configuration

### Linux/macOS
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-filesystem-cross-platform/src/index.ts"]
    }
  }
}
```

### Windows
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["tsx", "C:\\path\\to\\mcp-filesystem-cross-platform\\src\\index.ts"]
    }
  }
}
```

## 🎯 Usage Examples

Once configured, you can ask Claude:

### Platform Detection
- "What platform am I running on?"
- "Show me the allowed filesystem paths"

### File Operations  
- "List the contents of my home directory"
- "Create a new directory called 'projects'"
- "Read the contents of my .bashrc file" (Linux/macOS)
- "Search for all .js files in my projects folder"

### Cross-Platform Commands
- "Run 'ls -la'" (Linux/macOS) or "Run 'dir'" (Windows)
- "Execute 'npm install' in my project directory"

## 🔄 Differences from macOS-Only Version

### **Improvements:**
- ✅ **Cross-platform compatibility** (Linux, macOS, Windows)
- ✅ **Platform-aware command execution** (find vs dir)
- ✅ **Intelligent path restrictions** based on OS
- ✅ **Better error handling** for platform differences
- ✅ **Platform detection and reporting**

### **Key Changes:**
- Uses `os.platform()` for platform detection
- Platform-specific allowed paths arrays
- Different search commands per platform (`find` vs `dir`)
- Platform-aware shell selection (`bash` vs `cmd.exe`)
- Windows drive letter support
- Enhanced hidden file filtering (includes `$` files on Windows)

## 🐧 Linux-Specific Notes

The filesystem MCP works excellently on Linux with these considerations:

- **Package Management**: Can access `/opt/` and `/usr/local/` for installed software
- **Configuration**: Read access to `/etc/` for system configs
- **Permissions**: Full Unix permissions and ownership support
- **Shell**: Uses `/bin/bash` for command execution
- **Temporary Files**: Supports both `/tmp/` and `/var/tmp/`

## 💻 Windows-Specific Notes

Full Windows support with these adaptations:

- **Drive Letters**: Supports multiple drives (C:, D:, etc.)
- **Path Separators**: Handles Windows backslashes correctly
- **Commands**: Uses `cmd.exe` and Windows-native commands
- **Hidden Files**: Filters both `.` and `$` prefixed files
- **Permissions**: Windows-style file attributes

## 🚀 Migration from macOS-Only Version

If you're currently using the macOS-only version, here's how to migrate:

### 1. Update your Claude Desktop config:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["tsx", "/path/to/mcp-filesystem-cross-platform/src/index.ts"]
    }
  }
}
```

### 2. Test platform detection:
Ask Claude: "What platform am I running on?" to verify it's working.

### 3. Benefits you'll gain:
- Future-proof for Linux servers/containers
- Better Windows compatibility if needed
- More robust error handling
- Platform-aware command suggestions

## 🐛 Troubleshooting

### Common Issues:

1. **Permission Denied**
   - Check that the path is within allowed directories
   - Use "get platform info" to see allowed paths

2. **Command Not Found** 
   - Commands are platform-specific (use `ls` on Unix, `dir` on Windows)
   - MCP will suggest appropriate commands for your platform

3. **Path Not Found**
   - Use forward slashes `/` on all platforms (Node.js handles conversion)
   - Check path exists with "list directory" first

---

This cross-platform version provides excellent Linux support with full compatibility for Linux-specific paths, permissions, and shell commands. The original macOS version would have failed on Linux due to hardcoded `/Users/` paths and macOS-specific assumptions.
