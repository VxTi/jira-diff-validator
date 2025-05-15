import { execSync } from 'child_process';
import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { basename } from 'path';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    const { action, projectPath, fromBranch, toBranch, excludePatterns } = body;

    switch (action) {
      case 'getBranches':
        return NextResponse.json({ data: getBranches(projectPath) });

      case 'getCurrentBranch':
        return NextResponse.json({ data: getCurrentBranch(projectPath) });

      case 'getDefaultBranch':
        return NextResponse.json({ data: getDefaultBranch(projectPath) });

      case 'getDiff':
        return NextResponse.json({
          data: getDiff(projectPath, fromBranch, toBranch, excludePatterns),
        });

      case 'getProjectName':
        return NextResponse.json({ data: getProjectName(projectPath) });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in git API:', error.message);
    return NextResponse.json({ error: String(error.message) }, { status: 500 });
  }
}

/**
 * Get all branches from a git repository
 * @param projectPath The path to the git repository
 * @returns An array of branch names
 */
function getBranches(projectPath: string): string[] {
  if (!existsSync(projectPath)) return [];
  try {
    const output = execSync('git branch', {
      cwd: projectPath,
      encoding: 'utf8',
    });

    return output
      .split('\n')
      .map(branch => branch.trim())
      .filter(branch => branch.length > 0)
      .map(branch => (branch.startsWith('* ') ? branch.substring(2) : branch));
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
function getCurrentBranch(projectPath: string): string | null {
  if (!existsSync(projectPath)) return null;
  try {
    const output = execSync('git branch --show-current', {
      cwd: projectPath,
      encoding: 'utf8',
    });

    return output.trim();
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
function getDefaultBranch(projectPath: string): string | null {
  if (!existsSync(projectPath)) return null;
  try {
    // Try to find the default branch by checking common names
    const commonDefaultBranches = ['develop', 'main', 'master'];

    const branches = getBranches(projectPath);

    for (const branch of commonDefaultBranches) {
      if (branches.includes(branch)) {
        return branch;
      }
    }

    // If no common default branch is found, try to get it from the remote
    try {
      const remoteOutput = execSync('git remote show origin', {
        cwd: projectPath,
        encoding: 'utf8',
      });

      const headBranchMatch = remoteOutput.match(/HEAD branch: (.+)/);
      if (headBranchMatch && headBranchMatch[1]) {
        return headBranchMatch[1].trim();
      }
    } catch (e) {
      // If this fails, continue to the fallback
    }

    // Fallback to the first branch
    return branches.length > 0 ? branches[0] : null;
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
function getDiff(
  projectPath: string,
  fromBranch: string,
  toBranch: string,
  excludePatterns: string[] = ['**/*.snap', '**/*.json']
): string | null {
  if (!existsSync(projectPath)) return null;
  try {
    const excludeArgs = excludePatterns
      .map(pattern => `':(exclude)${pattern}'`)
      .join(' ');

    const output = execSync(
      `git diff ${fromBranch}...${toBranch} -- ${excludeArgs}`,
      {
        cwd: projectPath,
        encoding: 'utf8',
      }
    );

    return output;
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
function getProjectName(projectPath: string): string | null {
  if (!existsSync(projectPath)) return null;
  return basename(projectPath);
}
