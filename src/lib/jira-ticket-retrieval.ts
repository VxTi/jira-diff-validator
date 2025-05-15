export interface JiraTicket {
  ticketId: `${string}-${string}`;
  markdownDescription: string;
  description: string;
  title: string;
  parents?: JiraTicket[];
}

/**
 * Fetch a Jira ticket by its ID using the API route
 * @param ticketId The Jira ticket ID
 * @returns The Jira ticket details or null if not found
 */
export async function getJiraTicket(
  ticketId: string
): Promise<JiraTicket | null> {
  try {
    const response = await fetch('/api/jira', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getTicket',
        ticketId,
      }),
    });

    const result: any = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch Jira ticket');
    }

    return (result.data as JiraTicket) || null;
  } catch (error) {
    console.error('Error fetching Jira ticket:', error);
    return null;
  }
}

// The following code is kept for server-side use only (in API routes)
// It should not be imported directly in client components

interface JiraApiResponse {
  fields: {
    summary: string;
    description: unknown;
    parent?: {
      key: string;
    };
    project: {
      key: string;
    };
    issuetype: {
      name: string;
    };
  };
}

function extractTextFromADF(node: any): string {
  let text = '';

  if (node.type === 'text' && node.text) {
    text += node.text;
  }

  if (node.type === 'paragraph') {
    text += '\n';
  }

  if (node.type === 'bulletList') {
    text += '\n';
  }

  if (node.type === 'listItem') {
    text += '• ';
  }

  if (node.content) {
    for (const child of node.content) {
      text += extractTextFromADF(child);
    }
  }

  if (node.type === 'paragraph' || node.type === 'listItem') {
    text += '\n';
  }

  return text;
}

export class JiraClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly apiToken: string;

  constructor(config: { domain: string; email: string; apiToken: string }) {
    const { domain, email, apiToken } = config;
    this.baseUrl = `https://${domain}/rest/api/3`;
    this.email = email;
    this.apiToken = apiToken;
  }

  async getTicket(
    ticketIdentifier: `${string}-${string}`
  ): Promise<JiraTicket | null> {
    const fields = ['summary', 'description', 'parent'];
    const queryParams = new URLSearchParams({ fields: fields.join(',') });
    const url = `${this.baseUrl}/issue/${ticketIdentifier}?${queryParams}`;

    const headers = {
      Authorization: `Basic ${Buffer.from(
        `${this.email}:${this.apiToken}`
      ).toString('base64')}`,
      Accept: 'application/json',
      'X-Force-Accept-Language': 'true',
      'Accept-Language': 'en',
    };

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`);
      }

      const json: JiraApiResponse = await response.json();

      const description = json.fields.description;
      const formattedDesc =
        typeof description === 'object'
          ? extractTextFromADF(description)
          : String(description || '');

      const ticket: JiraTicket = {
        ticketId: ticketIdentifier,
        title: json.fields.summary,
        description: formattedDesc,
        markdownDescription: formattedDesc,
      };

      if (json.fields.parent) {
        // If there's a parent ticket, we could fetch it recursively here
        // For now, just note the parent ID
        ticket.parents = [
          {
            ticketId: json.fields.parent.key as `${string}-${string}`,
            title: '',
            description: '',
            markdownDescription: '',
          },
        ];
      }

      return ticket;
    } catch (error) {
      console.error('Failed to fetch Jira ticket:', error);
      return null;
    }
  }
}

export function jiraClientFrom(): JiraClient | null {
  const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

  if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error(
      'Missing Jira configuration. Please check your environment variables.'
    );
    return null;
  }

  return new JiraClient({
    domain: JIRA_DOMAIN,
    email: JIRA_EMAIL,
    apiToken: JIRA_API_TOKEN,
  });
}
