# Quick Start Guide

Get the Jina MCP Server running in 5 minutes!

## 1. Prerequisites

- Node.js 18+ installed
- npm installed
- Jina API key (optional for Reader API, required for Search API)
  - Get one free at https://jina.ai/api

## 2. Install & Build

```bash
# Clone/go to the repository
cd mcp-server

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## 3. Configure API Key

Create a `.env` file:

```bash
echo "JINA_API_KEY=your_api_key_here" > .env
```

Or edit manually:
```
JINA_API_KEY=jina_xxxxxxxxxxxxx
```

Get your key from https://jina.ai/api

## 4. Start Server

```bash
npm start
```

You should see:
```
[INFO] Jina MCP Server starting...
[INFO] Registered 9 tools
[OK] Jina MCP Server running on stdio transport
```

## 5. Test in Claude Desktop

### Option A: Configure Local (Recommended for Testing)

1. Open `~/Library/Application\ Support/Claude/claude_desktop_config.json`

2. Add this configuration:
   ```json
   {
     "mcpServers": {
       "jina-mcp-local": {
         "command": "npm",
         "args": ["start"],
         "cwd": "/path/to/jina-mcp-server",
         "env": {
           "JINA_API_KEY": "your_key_here"
         }
       }
     }
   }
   ```

3. Replace:
   - `/path/to/jina-mcp-server` with your actual installation path (e.g., `/Users/yourname/projects/jina-mcp-server`)
   - `your_key_here` with your Jina API key

4. Save and restart Claude Desktop

5. Look for the Jina tools in Claude!

### Option B: Test with MCP Inspector (Quick Test)

```bash
# In the mcp-server directory, with server running:
npm install -g @modelcontextprotocol/inspector

npx @modelcontextprotocol/inspector npx npm start
```

Opens web UI at http://localhost:5173

## 6. Try a Tool

In Claude, ask:

> "Read the content from https://www.example.com and summarize it"

Or:

> "Search the web for 'artificial intelligence' and show me the top results"

Or test the primer:

> "What is the server status?"

## 7. Available Tools

```
1. primer              - Get server status
2. read_url            - Read URL content
3. capture_screenshot  - Screenshot a webpage
4. guess_datetime_url  - Detect publication date
5. parallel_read_url   - Read multiple URLs
6. search_web          - Web search
7. search_arxiv        - Search papers
8. search_images       - Image search
9. parallel_search     - Batch search
```

## Troubleshooting

### "npm: command not found"

Install Node.js from https://nodejs.org

### "Cannot find module"

```bash
npm install
npm run build
```

### "Invalid API key"

Check `.env` file:
```bash
cat .env
```

Should output: `JINA_API_KEY=jina_xxxxx...`

### Tools not appearing in Claude

1. Make sure config JSON is valid (use https://jsonlint.com)
2. Use absolute paths (not relative)
3. Restart Claude Desktop completely
4. Check the working directory path exists

### Server won't start

Make sure you're in the mcp-server directory:
```bash
pwd  # Should show: /path/to/mcp-server
npm start
```

## What's Next?

- Read full docs: See `README.md`
- Learn tool options: See `README.md` → API Reference
- Troubleshooting: See `ERROR_HANDLING.md`
- Configure details: See `CLAUDE_DESKTOP_CONFIG.md`

## Common Tasks

### Read a webpage

Ask Claude:
> "Read https://example.com and extract key points"

### Search and analyze results

> "Search for 'machine learning 2024' and summarize the top 3 results"

### Screenshot a page

> "Take a screenshot of https://example.com"

### Find publication date

> "What is the publication date of https://example.com?"

### Batch read URLs

> "Read these URLs and compare: https://url1.com, https://url2.com, https://url3.com"

## Tips & Tricks

✅ **DO:**
- Use absolute URLs (with https://)
- Set reasonable timeouts
- Keep maxParallel ≤ 5
- Wait for API quota limits

❌ **DON'T:**
- Share API keys
- Run >10 parallel operations
- Hammer the API repeatedly
- Commit API keys to git

## Rate Limits

- Reader API (no key): 20 req/min
- Reader API (with key): 500 req/min
- Search API (with key): 500 req/min

If you hit limits, wait a bit before retrying.

## Need Help?

1. Check `ERROR_HANDLING.md`
2. Check logs: `npm start 2>&1 | tee debug.log`
3. Visit https://docs.jina.ai
4. Check MCP docs: https://modelcontextprotocol.io

---

**You're all set!** 🎉

Start asking Claude to read, search, and analyze the web using Jina AI.
