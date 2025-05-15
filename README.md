# Jira Ticket Acceptance Criteria Validator

## Overview

This project provides a tool to validate Git diffs against the acceptance criteria defined in Jira tickets. It helps
ensure that changes made in a Git commit or pull request align with the requirements of the associated Jira issue before
they are merged.

## Features

* **Git Diff Validation:** Automatically analyzes Git diffs to identify changes.
* **Jira Integration:** Connects to Jira to retrieve acceptance criteria for specified tickets.
* **Criterion Matching:** Compares the content of the Git diff with the Jira acceptance criteria to identify potential
  discrepancies.
* **Reporting:** Generates reports indicating whether the diff conforms to the criteria and highlighting any issues
  found.

## Getting Started

### Prerequisites

* Node.js (v22+)
* Git
* Access to your Jira instance

### Installation

1. Clone the repository: `git clone <repository_url>`
2. Navigate to the project directory: `cd <project_directory>`
3. Install dependencies: `pnpm install`

## Configuration

This tool requires access to your Jira instance to retrieve ticket details. You'll need to provide your Jira domain,
email, and API token.

1. **Create a `.env` file:** 
    
    In the root directory of the project, create a file named `.env.local`. This file
    will store your sensitive credentials and should not be committed to your version control.

2. **Add your credentials to `.env`:** 

    Open the `.env` file and add the following lines, replacing the
    placeholder values with your actual Jira credentials:

   ```
   OPENAI_API_KEY=sk-proj-your-openai-key
   JIRA_DOMAIN=your-jira-domain.atlassian.net
   JIRA_EMAIL=your-email@example.com
   JIRA_API_TOKEN=your-jira-api-token
   ```
    * `OPENAI_API_KEY`: Your OpenAI key, generated from https://platform.openai.com/api-keys
    * `JIRA_DOMAIN`: Your Jira instance domain (e.g., `your-company.atlassian.net`).
    * `JIRA_EMAIL`: The email address associated with your Jira account.
    * `JIRA_API_TOKEN`: A Jira API token. You can generate an API token in your Jira account settings.

By following these steps, the tool will be able to connect to your Jira instance and retrieve the necessary information
for validating your Git diffs.