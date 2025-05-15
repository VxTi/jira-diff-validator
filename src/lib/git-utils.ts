/**
 * Get all branches from a git repository
 * @param projectPath The path to the git repository
 * @returns An array of branch names
 */
export async function getBranches(projectPath: string): Promise<string[]> {
  try {
    const response = await fetch('/api/git', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getBranches',
        projectPath,
      }),
    });


    // eslint-disable-next-line
    const result: any = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get branches');
    }

    return (result.data || []) as string[];
  } catch (error) {
    console.error('Error getting git branches:', error);
    return [];
  }
}

/**
 * Get the current branch of a git repository
 * @param projectPath The path to the git repository
 * @returns The name of the current branch
 */
export async function getCurrentBranch(
  projectPath: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/git', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getCurrentBranch',
        projectPath,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get current branch');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting current git branch:', error);
    return null;
  }
}

/**
 * Get the default branch of a git repository (usually main or develop)
 * @param projectPath The path to the git repository
 * @returns The name of the default branch
 */
export async function getDefaultBranch(
  projectPath: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/git', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getDefaultBranch',
        projectPath,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get default branch');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting default git branch:', error);
    return null;
  }
}

/**
 * Get the diff between two branches
 * @param projectPath The path to the git repository
 * @param fromBranch The base branch
 * @param toBranch The target branch
 * @param excludePatterns Patterns to exclude from the diff
 * @returns The diff as a string
 */
export async function getDiff(
  projectPath: string,
  fromBranch: string,
  toBranch: string,
  excludePatterns: string[] = ['**/*.snap', '**/*.json']
): Promise<string | null> {
  try {
    const response = await fetch('/api/git', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getDiff',
        projectPath,
        fromBranch,
        toBranch,
        excludePatterns,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get diff');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting git diff:', error);
    return null;
  }
}

/**
 * Get the name of a git repository from its path
 * @param projectPath The path to the git repository
 * @returns The name of the repository
 */
export function getProjectName(projectPath: string): string | null {
  try {
    // Extract the last part of the path as the project name
    const parts = projectPath.split(/[/\\]/);
    return parts[parts.length - 1] || null;
  } catch (error) {
    console.error('Error getting project name:', error);
    return null;
  }
}
