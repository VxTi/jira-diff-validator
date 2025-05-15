/**
 * Validate a git diff against a Jira ticket description using an LLM
 * @param ticketDescription The Jira ticket description
 * @param gitDiff The git diff to validate
 * @returns The validation result as markdown
 */
export async function validateDiffAgainstTicket(
  ticketDescription: string,
  gitDiff: string
): Promise<string> {
  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validateDiffAgainstTicket',
        ticketDescription,
        gitDiff,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to validate diff against ticket');
    }

    return result.data || '';
  } catch (error) {
    console.error('Error validating diff against ticket:', error);
    return `Error validating diff: ${error instanceof Error ? error.message : String(error)}`;
  }
}
