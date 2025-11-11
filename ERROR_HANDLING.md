# Error Handling and Troubleshooting Guide

## Common Errors and Solutions

### Authentication Errors (401 Unauthorized)

**Error Message:**
```
🔑 Authentication Error: Invalid or missing API key.
```

**Causes:**
1. API key is missing from `.env` file
2. API key is expired or revoked
3. API key format is incorrect
4. API key not passed in Authorization header

**Solutions:**

1. **Check `.env` file exists:**
   ```bash
   cat .env
   ```
   Should output: `JINA_API_KEY=jina_xxxxx...`

2. **Verify key format:**
   - Jina API keys start with `jina_`
   - They are typically 60+ characters long
   - No spaces or extra characters

3. **Get a new API key:**
   - Visit https://jina.ai/api
   - Log in to your account
   - Generate a new API key
   - Update `.env` file
   - Restart server

4. **Check Authorization header (remote):**
   ```json
   {
     "headers": {
       "Authorization": "Bearer jina_xxxxxxx..."
     }
   }
   ```

### Quota Exceeded (402 Payment Required)

**Error Message:**
```
💳 Quota Error: API quota exceeded.
Check your Jina.AI account usage at https://jina.ai/api
```

**Causes:**
1. Monthly API quota exceeded
2. Too many requests in a short time
3. Account payment issue

**Solutions:**

1. **Check usage:**
   - Go to https://jina.ai/api
   - View "Usage" or "Billing" section
   - See remaining quota

2. **Wait for quota reset:**
   - Monthly quotas reset on the 1st of each month
   - Or upgrade your plan

3. **Reduce request rate:**
   - Don't run massive bulk operations
   - Implement backoff between requests

4. **Upgrade plan:**
   - Free tier: Limited requests
   - Pro/Enterprise: Higher limits
   - Visit https://jina.ai/pricing

### Rate Limiting (429 Too Many Requests)

**Error Message:**
```
⏱️ Rate Limit: Too many requests. Please wait and retry.
Limit: 500 RPM for API key holders
```

**Rate Limits:**
- **Reader API (no key)**: 20 requests per minute
- **Reader API (with key)**: 500 requests per minute
- **Search API (with key)**: 500 requests per minute

**Solutions:**

1. **Add delay between requests:**
   ```typescript
   await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
   ```

2. **Use parallel limits:**
   - Never use `maxParallel > 10`
   - Default 5 parallel requests is safe
   - Example:
   ```json
   {
     "urls": ["url1", "url2", "url3"],
     "maxParallel": 3
   }
   ```

3. **Batch requests over time:**
   - Break large requests into smaller batches
   - Spread batches across multiple minutes

4. **Add exponential backoff:**
   ```typescript
   let delay = 1000; // 1 second
   const maxRetries = 3;

   for (let i = 0; i < maxRetries; i++) {
     try {
       return await fetch(...);
     } catch (error) {
       if (error.status === 429) {
         await new Promise(r => setTimeout(r, delay));
         delay *= 2; // Double delay next time
       } else {
         throw error;
       }
     }
   }
   ```

### Network Errors

**Error Message:**
```
❌ Error: Network error: [specific error]
```

**Common Network Issues:**

#### Connection Timeout
```
Error: Request timeout after 30000ms
```

**Solutions:**
- Increase timeout: `{"url": "...", "timeout": 60000}`
- Check internet connection
- Try accessing https://r.jina.ai directly
- Check Jina service status

#### DNS Resolution Failed
```
Error: getaddrinfo ENOTFOUND api.jina.ai
```

**Solutions:**
- Check DNS: `nslookup r.jina.ai`
- Check internet connection
- Try pinging the server: `ping r.jina.ai`
- Check firewall/proxy settings

#### Connection Refused
```
Error: ECONNREFUSED 127.0.0.1:3000
```

**Solutions:**
- Server isn't running
- Wrong port number
- Another process using the port

### Invalid URL Errors

**Error Message:**
```
❌ Error: Invalid URL format
```

**Causes:**
1. URL is malformed
2. URL missing protocol (http/https)
3. Special characters not encoded

**Valid URLs:**
```
✅ https://example.com
✅ https://example.com/path?query=value
✅ https://example.com:8080/page
```

**Invalid URLs:**
```
❌ example.com (missing https://)
❌ ht!tp://example.com (invalid characters)
❌ https://example.com/<script> (unencoded)
```

**Solutions:**
```typescript
// Always include protocol
const url = "https://example.com";

// Encode special characters
const encoded = encodeURIComponent(url);

// Or use URL constructor for validation
try {
  new URL(inputUrl);
  // Valid URL
} catch {
  // Invalid URL
}
```

### Tool Not Found Errors

**Error Message:**
```
❌ Unknown tool: some_tool_name
```

**Causes:**
1. Tool name is misspelled
2. Tool doesn't exist
3. MCP server not updated

**Valid Tool Names:**
```
primer
read_url
capture_screenshot_url
guess_datetime_url
parallel_read_url
search_web
search_arxiv
search_images
parallel_search_web
```

**Solutions:**
1. Check spelling carefully (underscores, not hyphens)
2. Verify tool name matches exactly
3. Restart Claude/MCP client
4. Check server logs for registration

### JSON Parse Errors

**Error Message:**
```
❌ SyntaxError: Unexpected token in JSON
```

**Causes:**
1. Response isn't valid JSON
2. Malformed tool arguments
3. Special characters not escaped

**Valid JSON:**
```json
{
  "url": "https://example.com",
  "count": 10
}
```

**Invalid JSON:**
```json
{
  url: "https://example.com",  // Missing quotes on key
  count: 10,                    // Trailing comma
}
```

### Memory Issues

**Error Message:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed
JavaScript heap out of memory
```

**Causes:**
1. Reading very large URLs
2. Too many parallel requests
3. Memory leak in server

**Solutions:**

1. **Reduce parallel operations:**
   ```json
   {
     "urls": [...],
     "maxParallel": 2
   }
   ```

2. **Increase Node memory:**
   ```bash
   node --max-old-space-size=4096 dist/index.js
   ```

3. **Process in batches:**
   ```typescript
   const urls = [...]; // 1000 URLs
   const batchSize = 10;

   for (let i = 0; i < urls.length; i += batchSize) {
     const batch = urls.slice(i, i + batchSize);
     await parallelReadUrl(batch, 3);
   }
   ```

## Debugging

### Enable Debug Logging

Check server stderr output for detailed error logs:
```
[ERROR] Tool read_url failed: ...
[CALL] Tool: search_web
```

### Test Tools Individually

Use `mcp-cli` to test each tool:

```bash
# Start server in one terminal
npm start

# In another terminal, test tools
mcp list                    # List all tools
mcp call primer {}         # Test primer
mcp call read_url '{
  "url": "https://example.com"
}'
```

### Check Server Status

```bash
# Is server running?
ps aux | grep node

# Check logs
npm run dev 2>&1 | tee server.log
```

### Validate Configuration

```bash
# Check JSON syntax
cat ~/.claude/claude_desktop_config.json | jq .

# Or use online validator
# https://jsonlint.com/
```

## Performance Issues

### Slow Response Time

**Symptoms:** Tools take a long time to respond

**Causes:**
1. Network latency
2. Server under load
3. Large content being processed
4. Rate limiting delays

**Solutions:**

1. **Reduce content size:**
   ```json
   {
     "urls": ["smaller_page_url"]
   }
   ```

2. **Use timeouts:**
   ```json
   {
     "url": "...",
     "timeout": 10000
   }
   ```

3. **Check network:**
   ```bash
   ping r.jina.ai
   ```

4. **Reduce concurrency:**
   ```json
   {
     "maxParallel": 2
   }
   ```

### High CPU Usage

**Symptoms:** Server uses a lot of CPU

**Causes:**
1. Processing large files
2. Too many parallel requests
3. Inefficient code

**Solutions:**
1. Reduce `maxParallel`
2. Process in smaller batches
3. Restart server: `killall node; npm start`

## Getting Help

### Check Logs

Look for error messages in:
1. Server stderr output
2. Claude console (View → Toggle Developer Tools)
3. Check system logs

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| 401 | Unauthorized | Bad/missing API key |
| 402 | Payment Required | Quota exceeded |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Jina service error |
| 503 | Service Unavailable | Jina down for maintenance |

### Support Resources

- Jina.AI Docs: https://docs.jina.ai
- MCP Spec: https://modelcontextprotocol.io
- GitHub Issues: Report bugs here
- Email: support@jina.ai

## FAQ

### Q: Why is my API key not working?

A:
1. Verify key starts with `jina_`
2. Check for typos or spaces
3. Make sure it's not expired
4. Generate new key at https://jina.ai/api

### Q: Can I use without an API key?

A: Yes, Reader API works without a key (20 RPM limit).
Search API requires a key.

### Q: How do I handle rate limits?

A: Add delays between requests and reduce maxParallel.

### Q: Can I run multiple instances?

A: Yes, but share the same API key quota.
Be careful not to exceed limits.

### Q: How do I increase timeout?

A: Pass timeout in milliseconds:
```json
{"url": "...", "timeout": 60000}
```

## Report a Bug

Found an issue? Help us fix it:

1. Check this guide first
2. Check existing GitHub issues
3. Create new issue with:
   - Error message
   - Steps to reproduce
   - Server logs
   - Environment (OS, Node version, etc.)

Please don't include API keys in bug reports!

---

**Last Updated:** 2025-11-09
**Server Version:** 1.0.0
