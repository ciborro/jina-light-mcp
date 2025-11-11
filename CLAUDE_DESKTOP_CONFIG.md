# Claude Desktop Configuration

This guide shows how to configure the Jina MCP Server with Claude Desktop.

## Configuration File Location

The Claude configuration file is located at:
```
~/Library/Application\ Support/Claude/claude_desktop_config.json
```

On Windows:
```
%APPDATA%\Claude\claude_desktop_config.json
```

## Configuration Format

The configuration file uses JSON format with this structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "cwd": "working-directory",
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

## Local Configuration (Development)

Use this configuration to run the MCP server locally from your machine:

```json
{
  "mcpServers": {
    "jina-mcp-local": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/jina-mcp-server",
      "env": {
        "JINA_API_KEY": "your_jina_api_key_here"
      }
    }
  }
}
```

Replace `/path/to/jina-mcp-server` with your actual installation path.

### Steps for macOS/Linux:

1. Open Terminal
2. Edit the configuration file:
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. Add the server configuration (see above)

4. Save and exit (Ctrl+X, then Y, then Enter)

5. Restart Claude Desktop

### Steps for Windows:

1. Open PowerShell or Command Prompt as Administrator
2. Edit the configuration file:
   ```powershell
   notepad %APPDATA%\Claude\claude_desktop_config.json
   ```

3. Add the server configuration

4. Save and close

5. Restart Claude Desktop

## Remote Configuration (Production)

When deploying to Cloudflare Workers or another remote server:

```json
{
  "mcpServers": {
    "jina-mcp-remote": {
      "url": "https://mcp.jina.ai/sse",
      "headers": {
        "Authorization": "Bearer your_jina_api_key_here"
      }
    }
  }
}
```

## Full Configuration Example

Here's a complete example with both local and remote:

```json
{
  "mcpServers": {
    "jina-mcp-local": {
      "command": "npm",
      "args": ["start"],
      "cwd": "/path/to/jina-mcp-server",
      "env": {
        "JINA_API_KEY": "jina_xxxxxxxxxxxxxxxxxxxxx"
      }
    },
    "jina-mcp-remote": {
      "url": "https://mcp.jina.ai/sse",
      "headers": {
        "Authorization": "Bearer jina_xxxxxxxxxxxxxxxxxxxxx"
      }
    },
    "other-server": {
      "command": "npx",
      "args": ["some-other-mcp-server"]
    }
  }
}
```

## Getting Your API Key

1. Visit https://jina.ai
2. Log in to your account
3. Go to API Settings
4. Copy your API key
5. Paste it in the configuration file

## Verifying Installation

After configuration, check if the tools appear in Claude:

1. Open Claude Desktop
2. Start a new conversation
3. Click the "Tools" button or look for the tool icons
4. You should see these Jina tools:
   - primer
   - read_url
   - capture_screenshot_url
   - guess_datetime_url
   - parallel_read_url
   - search_web
   - search_arxiv
   - search_images
   - parallel_search_web

## Troubleshooting

### Tools Not Appearing

**Problem:** Tools don't show up in Claude

**Solution:**
1. Check config JSON syntax (use https://jsonlint.com/)
2. Verify file path exists and is correct
3. Make sure JINA_API_KEY is set
4. Restart Claude Desktop completely (not just close)

### Command Not Found

**Problem:** "npm: command not found" error

**Solution:**
1. Use full path to npm: `/usr/local/bin/npm`
2. Or use `npx` with full path
3. Check node is installed: `node --version`

### Working Directory Issues

**Problem:** "Cannot find module" errors

**Solution:**
1. Use absolute path for `cwd`, not relative
2. Make sure the directory exists
3. Verify `npm install` was run in that directory

### API Key Errors

**Problem:** "Invalid API key" or "401 Unauthorized"

**Solution:**
1. Copy API key from https://jina.ai/api
2. Check for typos or extra spaces
3. Make sure key hasn't expired
4. Try regenerating key on Jina dashboard

## Environment Variables

You can set any environment variables in the `env` section:

```json
{
  "env": {
    "JINA_API_KEY": "your_key",
    "NODE_ENV": "production",
    "DEBUG": "false"
  }
}
```

## Security Notes

⚠️ **Important:** Keep your API key secure!

- Never commit `.env` files to git
- Don't share your `claude_desktop_config.json` with API keys
- Regenerate API keys if you suspect compromise
- Use environment variables instead of hardcoding values

### Better Security Approach

Instead of putting the API key directly in the config, you can:

1. Store it in a `.env` file in the mcp-server directory
2. The server will read it automatically:
   ```
   JINA_API_KEY=your_key_here
   ```

3. Don't put the key in claude_desktop_config.json

## Advanced Configuration

### Custom Node Version

If you need a specific Node.js version (example using NVM):

```json
{
  "command": "$HOME/.nvm/versions/node/v18.0.0/bin/node",
  "args": ["dist/index.js"],
  "cwd": "/path/to/jina-mcp-server"
}
```

Replace `$HOME` with your home directory path and adjust the Node.js version as needed.

### Using NVM (Node Version Manager)

```json
{
  "command": "bash",
  "args": ["-c", "source ~/.nvm/nvm.sh && npm start"]
}
```

### Docker Support

```json
{
  "command": "docker",
  "args": ["run", "--rm", "-e", "JINA_API_KEY=xxx", "jina-mcp:latest"]
}
```

## Testing Configuration

Before using with Claude, test the server manually:

```bash
# Start the server
npm start

# In another terminal, test with mcp-cli
mcp list
mcp call primer {}
```

## Common Patterns

### Monorepo Structure

If multiple MCP servers in one directory:

```json
{
  "mcpServers": {
    "jina": {
      "command": "npm",
      "args": ["start", "--prefix", "mcp-server"]
    },
    "other": {
      "command": "npm",
      "args": ["start", "--prefix", "other-server"]
    }
  }
}
```

### Using Node Directly

```json
{
  "command": "node",
  "args": ["dist/index.js"],
  "cwd": "/path/to/mcp-server"
}
```

## References

- MCP Specification: https://modelcontextprotocol.io
- Claude Desktop: https://claude.ai
- Jina.AI API Docs: https://docs.jina.ai
- Node.js: https://nodejs.org
