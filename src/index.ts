#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";

const execAsync = promisify(exec);

class CrossPlatformFilesystemMCP {
  private server: Server;
  private baseDir: string;
  private platform: string;
  private allowedPaths: string[];

  constructor() {
    this.platform = os.platform();
    this.baseDir = os.homedir();
    
    // Define safe paths based on platform
    this.allowedPaths = this.getDefaultAllowedPaths();
    
    this.server = new Server(
      {
        name: "cross-platform-filesystem-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private getDefaultAllowedPaths(): string[] {
    switch (this.platform) {
      case 'darwin': // macOS
        return [
          '/Users/',
          '/tmp/',
          '/var/tmp/',
          '/opt/homebrew/', // Homebrew on Apple Silicon
          '/usr/local/', // Homebrew on Intel
        ];
      case 'linux':
        return [
          '/home/',
          '/tmp/',
          '/var/tmp/',
          '/opt/',
          '/usr/local/',
          '/etc/', // Read-only configs
        ];
      case 'win32': // Windows
        return [
          'C:\\Users\\',
          'C:\\temp\\',
          'C:\\tmp\\',
          'D:\\', // Common additional drive
        ];
      default:
        return [this.baseDir, '/tmp/'];
    }
  }

  private validatePath(inputPath: string): string {
    // Resolve relative paths from home directory
    let resolvedPath = path.resolve(this.baseDir, inputPath);
    
    // Security check - ensure we stay within allowed directories
    const isAllowed = this.allowedPaths.some(allowedPath => {
      if (this.platform === 'win32') {
        return resolvedPath.toLowerCase().startsWith(allowedPath.toLowerCase());
      }
      return resolvedPath.startsWith(allowedPath);
    });
    
    if (!isAllowed) {
      throw new McpError(
        ErrorCode.InvalidParams, 
        `Access denied: Path outside allowed directories. Allowed: ${this.allowedPaths.join(', ')}`
      );
    }
    
    return resolvedPath;
  }

  private async getSearchCommand(searchPath: string, pattern: string, maxDepth: number): Promise<string> {
    // Use appropriate search command based on platform
    switch (this.platform) {
      case 'win32':
        // Windows dir command with recursion
        return `dir "${searchPath}\\${pattern}" /s /b`;
      default:
        // Unix-like systems (Linux, macOS, etc.)
        return `find "${searchPath}" -maxdepth ${maxDepth} -name "${pattern}" -type f`;
    }
  }

  private async getCopyCommand(source: string, destination: string): Promise<string> {
    switch (this.platform) {
      case 'win32':
        return `copy "${source}" "${destination}"`;
      default:
        return `cp "${source}" "${destination}"`;
    }
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_platform_info",
            description: "Get information about the current platform and allowed paths",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "list_directory",
            description: "List contents of a directory",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Directory path (relative to home directory or absolute)",
                },
                showHidden: {
                  type: "boolean",
                  description: "Show hidden files (default: false)",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "read_file",
            description: "Read contents of a text file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "File path",
                },
                encoding: {
                  type: "string",
                  description: "File encoding (default: utf8)",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "write_file",
            description: "Write content to a file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "File path",
                },
                content: {
                  type: "string",
                  description: "Content to write",
                },
                encoding: {
                  type: "string",
                  description: "File encoding (default: utf8)",
                },
              },
              required: ["path", "content"],
            },
          },
          {
            name: "create_directory",
            description: "Create a directory (and parent directories if needed)",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Directory path",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "delete_file",
            description: "Delete a file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "File path",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "delete_directory",
            description: "Delete a directory and its contents",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Directory path",
                },
                recursive: {
                  type: "boolean",
                  description: "Delete recursively (default: true)",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "move_item",
            description: "Move or rename a file or directory",
            inputSchema: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  description: "Source path",
                },
                destination: {
                  type: "string",
                  description: "Destination path",
                },
              },
              required: ["source", "destination"],
            },
          },
          {
            name: "copy_item",
            description: "Copy a file or directory",
            inputSchema: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  description: "Source path",
                },
                destination: {
                  type: "string",
                  description: "Destination path",
                },
              },
              required: ["source", "destination"],
            },
          },
          {
            name: "get_file_info",
            description: "Get information about a file or directory",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "File or directory path",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "search_files",
            description: "Search for files by name pattern",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Directory to search in",
                },
                pattern: {
                  type: "string",
                  description: "Search pattern (supports wildcards)",
                },
                maxDepth: {
                  type: "number",
                  description: "Maximum search depth (default: 3)",
                },
              },
              required: ["path", "pattern"],
            },
          },
          {
            name: "execute_command",
            description: "Execute a shell command (platform-aware)",
            inputSchema: {
              type: "object",
              properties: {
                command: {
                  type: "string",
                  description: "Command to execute",
                },
                cwd: {
                  type: "string",
                  description: "Working directory (optional)",
                },
              },
              required: ["command"],
            },
          },
          {
            name: "get_current_directory",
            description: "Get the current working directory",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, "Missing arguments");
      }

      try {
        switch (name) {
          case "get_platform_info":
            return await this.getPlatformInfo();
          
          case "list_directory":
            return await this.listDirectory(args.path as string, args.showHidden as boolean || false);
          
          case "read_file":
            return await this.readFile(args.path as string, args.encoding as string || 'utf8');
          
          case "write_file":
            return await this.writeFile(args.path as string, args.content as string, args.encoding as string || 'utf8');
          
          case "create_directory":
            return await this.createDirectory(args.path as string);
          
          case "delete_file":
            return await this.deleteFile(args.path as string);
          
          case "delete_directory":
            return await this.deleteDirectory(args.path as string, args.recursive as boolean !== false);
          
          case "move_item":
            return await this.moveItem(args.source as string, args.destination as string);
          
          case "copy_item":
            return await this.copyItem(args.source as string, args.destination as string);
          
          case "get_file_info":
            return await this.getFileInfo(args.path as string);
          
          case "search_files":
            return await this.searchFiles(args.path as string, args.pattern as string, args.maxDepth as number || 3);
          
          case "execute_command":
            return await this.executeCommand(args.command as string, args.cwd as string);
          
          case "get_current_directory":
            return await this.getCurrentDirectory();
          
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error: any) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  private async getPlatformInfo() {
    const platformNames = {
      'darwin': 'macOS',
      'linux': 'Linux',
      'win32': 'Windows',
      'freebsd': 'FreeBSD',
      'openbsd': 'OpenBSD',
    };

    return {
      content: [
        {
          type: "text",
          text: `**Platform Information:**\n\n` +
            `• **OS**: ${platformNames[this.platform as keyof typeof platformNames] || this.platform}\n` +
            `• **Architecture**: ${os.arch()}\n` +
            `• **Node.js Version**: ${process.version}\n` +
            `• **Home Directory**: ${this.baseDir}\n` +
            `• **Current Directory**: ${process.cwd()}\n\n` +
            `**Allowed Paths:**\n${this.allowedPaths.map(p => `• ${p}`).join('\n')}`
        }
      ]
    };
  }

  private async listDirectory(dirPath: string, showHidden: boolean) {
    const resolvedPath = this.validatePath(dirPath);
    
    try {
      const items = await fs.readdir(resolvedPath, { withFileTypes: true });
      const filteredItems = showHidden ? items : items.filter(item => 
        !item.name.startsWith('.') && (this.platform === 'win32' ? !item.name.startsWith('$') : true)
      );
      
      const itemList = await Promise.all(
        filteredItems.map(async (item) => {
          const itemPath = path.join(resolvedPath, item.name);
          const stats = await fs.stat(itemPath);
          
          return {
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        })
      );

      return {
        content: [
          {
            type: "text",
            text: `**Directory: ${resolvedPath}**\n\n` +
              itemList.map(item => 
                `${item.type === 'directory' ? '📁' : '📄'} **${item.name}** ` +
                `(${item.type === 'directory' ? 'directory' : `${item.size} bytes`}) - ` +
                `Modified: ${new Date(item.modified).toLocaleString()}`
              ).join('\n')
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to list directory: ${error.message}`);
    }
  }

  private async readFile(filePath: string, encoding: string) {
    const resolvedPath = this.validatePath(filePath);
    
    try {
      const content = await fs.readFile(resolvedPath, encoding as BufferEncoding);
      
      return {
        content: [
          {
            type: "text",
            text: `**File: ${resolvedPath}**\n\n\`\`\`\n${content}\n\`\`\``
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to read file: ${error.message}`);
    }
  }

  private async writeFile(filePath: string, content: string, encoding: string) {
    const resolvedPath = this.validatePath(filePath);
    
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(resolvedPath);
      await fs.mkdir(dir, { recursive: true });
      
      await fs.writeFile(resolvedPath, content, encoding as BufferEncoding);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **File written successfully:** ${resolvedPath}\n\nContent size: ${content.length} characters`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to write file: ${error.message}`);
    }
  }

  private async createDirectory(dirPath: string) {
    const resolvedPath = this.validatePath(dirPath);
    
    try {
      await fs.mkdir(resolvedPath, { recursive: true });
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **Directory created:** ${resolvedPath}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to create directory: ${error.message}`);
    }
  }

  private async deleteFile(filePath: string) {
    const resolvedPath = this.validatePath(filePath);
    
    try {
      await fs.unlink(resolvedPath);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **File deleted:** ${resolvedPath}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to delete file: ${error.message}`);
    }
  }

  private async deleteDirectory(dirPath: string, recursive: boolean) {
    const resolvedPath = this.validatePath(dirPath);
    
    try {
      if (recursive) {
        await fs.rm(resolvedPath, { recursive: true, force: true });
      } else {
        await fs.rmdir(resolvedPath);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **Directory deleted:** ${resolvedPath}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to delete directory: ${error.message}`);
    }
  }

  private async moveItem(source: string, destination: string) {
    const resolvedSource = this.validatePath(source);
    const resolvedDestination = this.validatePath(destination);
    
    try {
      await fs.rename(resolvedSource, resolvedDestination);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **Moved:** ${resolvedSource} → ${resolvedDestination}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to move item: ${error.message}`);
    }
  }

  private async copyItem(source: string, destination: string) {
    const resolvedSource = this.validatePath(source);
    const resolvedDestination = this.validatePath(destination);
    
    try {
      // For cross-platform compatibility, check if it's a directory
      const stats = await fs.stat(resolvedSource);
      
      if (stats.isDirectory()) {
        // Use shell command for directory copying
        const command = await this.getCopyCommand(resolvedSource, resolvedDestination);
        await execAsync(command);
      } else {
        await fs.copyFile(resolvedSource, resolvedDestination);
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ **Copied:** ${resolvedSource} → ${resolvedDestination}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to copy item: ${error.message}`);
    }
  }

  private async getFileInfo(itemPath: string) {
    const resolvedPath = this.validatePath(itemPath);
    
    try {
      const stats = await fs.stat(resolvedPath);
      
      return {
        content: [
          {
            type: "text",
            text: `**File Info: ${resolvedPath}**\n\n` +
              `• **Type**: ${stats.isDirectory() ? 'Directory' : 'File'}\n` +
              `• **Size**: ${stats.size} bytes\n` +
              `• **Created**: ${stats.birthtime.toLocaleString()}\n` +
              `• **Modified**: ${stats.mtime.toLocaleString()}\n` +
              `• **Accessed**: ${stats.atime.toLocaleString()}\n` +
              `• **Permissions**: ${stats.mode.toString(8)}\n` +
              (this.platform !== 'win32' ? `• **Owner**: ${stats.uid}:${stats.gid}\n` : '') +
              `• **Platform**: ${this.platform}`
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Failed to get file info: ${error.message}`);
    }
  }

  private async searchFiles(searchPath: string, pattern: string, maxDepth: number) {
    const resolvedPath = this.validatePath(searchPath);
    
    try {
      const command = await this.getSearchCommand(resolvedPath, pattern, maxDepth);
      const { stdout } = await execAsync(command);
      const files = stdout.trim().split('\n').filter(f => f.length > 0);
      
      return {
        content: [
          {
            type: "text",
            text: `**Search Results for "${pattern}" in ${resolvedPath}:**\n\n` +
              (files.length > 0 
                ? files.map(file => `📄 ${file}`).join('\n')
                : 'No files found matching the pattern.')
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Search failed: ${error.message}`);
    }
  }

  private async executeCommand(command: string, cwd?: string) {
    const workingDir = cwd ? this.validatePath(cwd) : process.cwd();
    
    try {
      // Platform-aware shell selection
      const shell = this.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      const shellFlag = this.platform === 'win32' ? '/c' : '-c';
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: workingDir,
        shell: shell
      });
      
      return {
        content: [
          {
            type: "text",
            text: `**Command:** \`${command}\`\n**Working Directory:** ${workingDir}\n**Platform:** ${this.platform}\n\n` +
              `**Output:**\n\`\`\`\n${stdout}\n\`\`\`` +
              (stderr ? `\n\n**Errors:**\n\`\`\`\n${stderr}\n\`\`\`` : '')
          }
        ]
      };
    } catch (error: any) {
      throw new McpError(ErrorCode.InternalError, `Command execution failed: ${error.message}`);
    }
  }

  private async getCurrentDirectory() {
    return {
      content: [
        {
          type: "text",
          text: `**Current Directory:** ${process.cwd()}\n**Platform:** ${this.platform}\n**Home:** ${this.baseDir}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Cross-platform Filesystem MCP server running on ${this.platform}`);
  }
}

const server = new CrossPlatformFilesystemMCP();
server.run().catch(console.error);
