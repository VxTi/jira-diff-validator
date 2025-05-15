import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(request: Request) {
  try {
    const { action, ticketDescription, gitDiff } = await request.json();

    switch (action) {
      case 'validateDiffAgainstTicket':
        return NextResponse.json({ data: await validateDiffAgainstTicket(ticketDescription, gitDiff) });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in LLM API:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * Validate a git diff against a Jira ticket description using an LLM
 * @param ticketDescription The Jira ticket description
 * @param gitDiff The git diff to validate
 * @returns The validation result as markdown
 */
async function validateDiffAgainstTicket(
  ticketDescription: string,
  gitDiff: string
): Promise<string> {
  try {
    const systemPrompt = `
      You are supposed to validate and verify whether the provided git differences conform to the provided Jira ticket description.
      Do not send summaries back, only provide feedback on the diff whether there are any changes required.
      If no changes are required, just say that.
      Only note the AC points and whether they are conformed, by prefixed with checkboxes and the reasoning why it does or doesn't conform.
    `;

    const userPrompt = `
      I have a Jira ticket below. Could you tell me whether the implementation conforms to the description, and if not, what needs to be changed?

      The ticket:
      \`\`\`plaintext
      ${ticketDescription}
      \`\`\`

      The git diff:
      \`\`\`plaintext
      ${gitDiff}
      \`\`\`
    `;

    const { text } = await generateText({
      model: openai('gpt-4.1-mini-2025-04-14'),
      maxTokens: 10000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error('Error validating diff against ticket:', error);
    return `Error validating diff: ${error instanceof Error ? error.message : String(error)}`;
  }
}