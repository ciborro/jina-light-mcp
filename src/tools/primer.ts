/**
 * Tool 1: Primer - Get system information (no API key required)
 * This is a placeholder - tools will be registered in index.ts using the correct MCP SDK API
 */
export function registerPrimerTool(): {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (input: any) => Promise<any>;
} {
  return {
    name: 'primer',
    description: 'Get system information and server status. No API key required. Returns current server time, timezone, and service information.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async () => {
      try {
        const now = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        return {
          content: [
            {
              type: 'text',
              text: `
Server Status: ✅ Online
Version: 1.0.0
Current Time: ${now.toLocaleString()}
Timezone: ${timezone}
Timestamp (ISO): ${now.toISOString()}

Jina MCP Server is ready to serve requests.
Use other tools to interact with Jina.AI APIs.
              `.trim(),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error getting server info: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
