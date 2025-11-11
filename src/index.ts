#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Load environment variables
dotenv.config();

// Get API key from environment
const API_KEY = process.env.JINA_API_KEY || '';

console.error(`[INFO] API Key configured: ${API_KEY ? 'YES' : 'NO'}`);

// Define all 10 MCP tools
const TOOLS: Tool[] = [
  {
    name: 'primer',
    description: 'Get system information and server status. No API key required.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'read_url',
    description: 'Read and extract content from a URL using Jina Reader API with advanced options.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to read',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds (default: 30000)',
        },
        locale: {
          type: 'string',
          description: 'Browser locale (e.g., "en-US", "pl-PL")',
        },
        instruction: {
          type: 'string',
          description: 'Custom instruction for content extraction',
        },
        targetSelector: {
          type: 'string',
          description: 'CSS selector for specific element to extract',
        },
        removeSelector: {
          type: 'string',
          description: 'CSS selectors to remove (comma-separated)',
        },
        waitForSelector: {
          type: 'string',
          description: 'CSS selector to wait for before extraction',
        },
        retainImages: {
          type: 'string',
          enum: ['all', 'none', 'markdown'],
          description: 'How to handle images (default: "markdown")',
        },
        retainLinks: {
          type: 'string',
          enum: ['all', 'none', 'markdown'],
          description: 'How to handle links (default: "markdown")',
        },
        withImagesSummary: {
          type: 'boolean',
          description: 'Include images summary',
        },
        withLinksSummary: {
          type: 'boolean',
          description: 'Include links summary',
        },
        proxy: {
          type: 'string',
          description: 'Proxy server URL',
        },
        userAgent: {
          type: 'string',
          description: 'Custom User-Agent string',
        },
        jsonSchema: {
          type: 'string',
          description: 'JSON schema for structured output',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'capture_screenshot_url',
    description: 'Capture a screenshot of a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to screenshot',
        },
        fullPage: {
          type: 'boolean',
          description: 'Capture full page or first screen',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'guess_datetime_url',
    description: 'Detect and extract publication date from a URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'parallel_read_url',
    description: 'Read multiple URLs in parallel with advanced extraction options.',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of URLs to read',
        },
        maxParallel: {
          type: 'number',
          description: 'Maximum parallel requests (default: 5)',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds (default: 30000)',
        },
        locale: {
          type: 'string',
          description: 'Browser locale (e.g., "en-US", "pl-PL")',
        },
        instruction: {
          type: 'string',
          description: 'Custom instruction for content extraction',
        },
        targetSelector: {
          type: 'string',
          description: 'CSS selector for specific element to extract',
        },
        retainImages: {
          type: 'string',
          enum: ['all', 'none', 'markdown'],
          description: 'How to handle images (default: "markdown")',
        },
        retainLinks: {
          type: 'string',
          enum: ['all', 'none', 'markdown'],
          description: 'How to handle links (default: "markdown")',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'search_web',
    description: 'Perform a web search using Jina Search API with advanced filtering options.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "AI machine learning")',
        },
        count: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        location: {
          type: 'string',
          description: 'Country code for geolocation (e.g., "US", "PL", "GB")',
        },
        language: {
          type: 'string',
          description: 'Language code for results (e.g., "en", "pl", "de")',
        },
        site: {
          type: 'string',
          description: 'Filter results to specific domain (e.g., "github.com")',
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
        },
        filetype: {
          type: 'string',
          description: 'Filter by file type (e.g., "pdf", "doc", "xlsx")',
        },
        intitle: {
          type: 'string',
          description: 'Search only in page titles',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds (default: 30000)',
        },
        provider: {
          type: 'string',
          description: 'Search provider ("google", "bing", etc.)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_arxiv',
    description: 'Search for academic papers on ArXiv.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of papers',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_images',
    description: 'Search for images.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Image search query',
        },
        count: {
          type: 'number',
          description: 'Number of images',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'parallel_search_web',
    description: 'Perform multiple web searches in parallel.',
    inputSchema: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of search queries',
        },
        maxParallel: {
          type: 'number',
          description: 'Maximum parallel searches',
        },
      },
      required: ['queries'],
    },
  },
];

/**
 * Create and configure MCP Server
 */
async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'jina-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle ListTools requests
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error('[INFO] Listing all available tools');
    return { tools: TOOLS };
  });

  // Handle CallTool requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const toolInput = (request.params.arguments || {}) as Record<string, any>;

    console.error(`[CALL] Tool: ${toolName}`);

    try {
      // Implement tool handlers
      switch (toolName) {
        case 'primer': {
          const now = new Date();
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          return {
            content: [
              {
                type: 'text',
                text: `Server Status: ✅ Online
Version: 1.0.0
Current Time: ${now.toLocaleString()}
Timezone: ${timezone}
Timestamp: ${now.toISOString()}

Jina MCP Server is ready to serve requests.`,
              },
            ],
          };
        }

        case 'read_url': {
          const { readUrl } = await import('./utils/reader.js');
          const startTime = Date.now();
          const content = await readUrl(toolInput.url, undefined, {
            timeout: toolInput.timeout,
            locale: toolInput.locale,
            instruction: toolInput.instruction,
            targetSelector: toolInput.targetSelector,
            removeSelector: toolInput.removeSelector,
            waitForSelector: toolInput.waitForSelector,
            retainImages: toolInput.retainImages,
            retainLinks: toolInput.retainLinks,
            withImagesSummary: toolInput.withImagesSummary,
            withLinksSummary: toolInput.withLinksSummary,
            proxy: toolInput.proxy,
            userAgent: toolInput.userAgent,
            jsonSchema: toolInput.jsonSchema,
          });
          const timeMs = Date.now() - startTime;

          return {
            content: [
              {
                type: 'text',
                text: `**URL:** ${toolInput.url}\n**Time:** ${timeMs}ms\n\n${content}`,
              },
            ],
          };
        }

        case 'capture_screenshot_url': {
          const { captureScreenshot } = await import('./utils/reader.js');
          const startTime = Date.now();
          const imageBuffer = await captureScreenshot(
            toolInput.url,
            undefined,
            toolInput.fullPage || false
          );
          const timeMs = Date.now() - startTime;

          return {
            content: [
              {
                type: 'image',
                data: imageBuffer.toString('base64'),
                mimeType: 'image/png',
              },
            ],
          };
        }

        case 'guess_datetime_url': {
          const { guessDatetime } = await import('./utils/reader.js');
          const startTime = Date.now();
          const result = await guessDatetime(toolInput.url);
          const timeMs = Date.now() - startTime;

          return {
            content: [
              {
                type: 'text',
                text: `URL: ${toolInput.url}\nPublication Date: ${result.date}\nAccuracy: ${result.accuracy}\nTime: ${timeMs}ms`,
              },
            ],
          };
        }

        case 'parallel_read_url': {
          const { parallelReadUrl } = await import('./utils/reader.js');
          const startTime = Date.now();
          const results = await parallelReadUrl(
            toolInput.urls,
            undefined,
            toolInput.maxParallel || 5,
            {
              timeout: toolInput.timeout,
              locale: toolInput.locale,
              instruction: toolInput.instruction,
              targetSelector: toolInput.targetSelector,
              retainImages: toolInput.retainImages,
              retainLinks: toolInput.retainLinks,
            }
          );
          const timeMs = Date.now() - startTime;

          const summary = results
            .map((r, i) => {
              if (r.success) {
                return `${i + 1}. ✅ ${r.url} (${r.content.length} chars)`;
              } else {
                return `${i + 1}. ❌ ${r.url} - ${r.error}`;
              }
            })
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Parallel Read Results (${timeMs}ms):\n\n${summary}`,
              },
            ],
          };
        }

        case 'search_web': {
          const { searchWeb } = await import('./utils/search.js');
          const startTime = Date.now();
          const results = await searchWeb(toolInput.query, API_KEY, {
            count: toolInput.count,
            location: toolInput.location,
            language: toolInput.language,
            site: toolInput.site,
            page: toolInput.page,
            filetype: toolInput.filetype,
            intitle: toolInput.intitle,
            timeout: toolInput.timeout,
            provider: toolInput.provider,
          });
          const timeMs = Date.now() - startTime;

          const limit = toolInput.count || 10;
          const formattedResults = results
            .slice(0, limit)
            .map(
              (r, i) =>
                `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.description || '(no description)'}`
            )
            .join('\n\n');

          return {
            content: [
              {
                type: 'text',
                text: `Search: "${toolInput.query}"\nResults: ${results.length} | Time: ${timeMs}ms\n\n${formattedResults}`,
              },
            ],
          };
        }

        case 'search_arxiv': {
          const { searchArxiv } = await import('./utils/search.js');
          const startTime = Date.now();
          const results = await searchArxiv(
            toolInput.query,
            API_KEY,
            toolInput.maxResults || 10
          );
          const timeMs = Date.now() - startTime;

          const limit = toolInput.maxResults || 10;
          const formattedResults = results
            .slice(0, limit)
            .map(
              (r, i) =>
                `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   Authors: ${r.authors?.join(', ') || '(none)'}`
            )
            .join('\n\n');

          return {
            content: [
              {
                type: 'text',
                text: `ArXiv Search: "${toolInput.query}"\nPapers Found: ${results.length} | Time: ${timeMs}ms\n\n${formattedResults}`,
              },
            ],
          };
        }

        case 'search_images': {
          const { searchImages } = await import('./utils/search.js');
          const startTime = Date.now();
          const results = await searchImages(
            toolInput.query,
            API_KEY,
            toolInput.count || 20
          );
          const timeMs = Date.now() - startTime;

          const limit = toolInput.count || 20;
          const formattedResults = results
            .slice(0, limit)
            .map((r, i) => `${i + 1}. [${r.title || '(no title)'}](${r.url})`)
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Image Search: "${toolInput.query}"\nImages Found: ${results.length} | Time: ${timeMs}ms\n\n${formattedResults}`,
              },
            ],
          };
        }


        case 'parallel_search_web': {
          const { parallelSearchWeb } = await import('./utils/search.js');
          const startTime = Date.now();
          const results = await parallelSearchWeb(
            toolInput.queries,
            API_KEY,
            toolInput.maxParallel || 5
          );
          const timeMs = Date.now() - startTime;

          const summary = results
            .map((r, i) => {
              if (r.success) {
                return `${i + 1}. ✅ "${r.query}" - ${r.results.length} results`;
              } else {
                return `${i + 1}. ❌ "${r.query}" - ${r.error}`;
              }
            })
            .join('\n');

          return {
            content: [
              {
                type: 'text',
                text: `Parallel Search Results (${timeMs}ms):\n\n${summary}`,
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text',
                text: `❌ Unknown tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] Tool ${toolName} failed:`, errorMessage);

      return {
        content: [
          {
            type: 'text',
            text: `❌ Error executing tool "${toolName}": ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  console.error('[INFO] Jina MCP Server starting...');
  console.error(`[INFO] Registered ${TOOLS.length} tools`);

  await server.connect(transport);
  console.error('[OK] Jina MCP Server running on stdio transport');
}

// Run server
main().catch((error) => {
  console.error('[ERROR] Fatal error:', error);
  process.exit(1);
});
