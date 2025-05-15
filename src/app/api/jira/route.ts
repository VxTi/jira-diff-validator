import { NextResponse } from 'next/server';
import { jiraClientFrom, type JiraTicket } from '@/lib/jira-ticket-retrieval';

export async function POST(request: Request) {
  try {
    const { action, ticketId } = await request.json();

    switch (action) {
      case 'getTicket':
        return NextResponse.json({ data: await getTicket(ticketId) });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Jira API:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

/**
 * Fetch a Jira ticket by its ID
 * @param ticketId The Jira ticket ID
 * @returns The Jira ticket details or null if not found
 */
async function getTicket(ticketId: string): Promise<JiraTicket | null> {
  try {
    const jiraClient = jiraClientFrom();
    if (!jiraClient) {
      throw new Error('Missing Jira configuration. Please check your environment variables.');
    }

    const ticket = await jiraClient.getTicket(ticketId as `${string}-${string}`);
    return ticket;
  } catch (error) {
    console.error('Error fetching Jira ticket:', error);
    throw error;
  }
}