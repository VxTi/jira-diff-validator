'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getBranches,
  getCurrentBranch,
  getDefaultBranch,
  getDiff,
  getProjectName,
} from '@/lib/git-utils';
import { getJiraTicket } from '@/lib/jira-ticket-retrieval';
import { validateDiffAgainstTicket } from '@/lib/llm-utils';
import { AlertCircle, FolderOpen, GitBranch, RefreshCw } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Config = {
  ticketId?: string | undefined;
  ticketDescription?: string | undefined;
  targetBranch?: string | undefined;
  workingBranch?: string | undefined;
  projectPath?: string | undefined;
  projectName?: string | undefined;
  additionalInfo?: string;
};

export default function Home() {
  const [config, setConfig] = useState<Config>({});

  const [branches, setBranches] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJiraTicket = useCallback(async (ticketId: string) => {
    let desc;
    try {
      const ticket = await getJiraTicket(ticketId);

      desc = ticket
        ? ticket.markdownDescription
        : `Could not find Jira ticket: ${ticketId}`;
    } catch (error) {
      desc = `Error fetching Jira ticket: ${error instanceof Error ? error.message : String(error)}`;
    }

    setConfig(cfg => ({
      ...cfg,
      ticketDescription: desc,
      ticketId,
    }));
  }, []);

  const handleProjectSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      let path = e.target.value;

      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];

        if (file.webkitRelativePath) {
          const relativePath = file.webkitRelativePath;
          path = relativePath.split('/')[0];
        } else {
          path = file.name;
        }
      }

      if (!path || path.trim().length === 0) {
        resetState();
        return;
      }

      const name = getProjectName(path);

      try {
        const branchList = await getBranches(path);
        setBranches(branchList);

        const currentWorkingBranch = await getCurrentBranch(path);

        const defaultBranch = await getDefaultBranch(path);

        const matches = currentWorkingBranch
          ? /^(?:\w+\/)*([^-]+)-(\d+)/g.exec(currentWorkingBranch)
          : undefined;

        const ticketId =
          matches && matches?.length > 2
            ? `${matches[1]}-${matches[2]}`
            : undefined;
        const newTicketId = ticketId ?? config.ticketId ?? undefined;

        setConfig(cfg => ({
          ...cfg,
          projectPath: path ?? '',
          projectName: name ?? undefined,
          workingBranch: currentWorkingBranch ?? undefined,
          targetBranch: cfg.targetBranch ?? defaultBranch ?? undefined,
          ticketId: newTicketId,
        }));

        if (!newTicketId) return;

        await fetchJiraTicket(newTicketId);
      } catch (error) {
        console.error('Error fetching git data:', error);
      }
    },
    [config.ticketId, fetchJiraTicket]
  );

  const resetState = () => {
    setConfig({});
    setBranches([]);
    setValidationResult('');
  };

  const handleJiraTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ticketId = e.target.value;
    setConfig(cfg => ({ ...cfg, ticketId }));
  };

  const handleJiraTicketBlur = async () => {
    if (!config.ticketId) return;
    await fetchJiraTicket(config.ticketId);
  };

  const handleFolderButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleValidate = useCallback(async () => {
    if (!config.projectPath || !config.workingBranch || !config.targetBranch) {
      setValidationResult('Please select a project and branches to compare.');
      return;
    }

    if (!config.ticketDescription) {
      setValidationResult('No Jira ticket description available.');
      return;
    }

    setIsLoading(true);

    try {
      const diff = await getDiff(
        config.projectPath,
        config.targetBranch,
        config.workingBranch
      );

      if (!diff) {
        setValidationResult(
          'No differences found between the selected branches.'
        );
        setIsLoading(false);
        return;
      }

      const result = await validateDiffAgainstTicket(
        config.ticketDescription,
        diff
      );
      setValidationResult(result);
    } catch (error) {
      setValidationResult(
        `Error validating diff: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [config.projectPath, config.targetBranch, config.ticketDescription, config.workingBranch]);

  const setTargetBranch = useCallback((targetBranch: string) => {
    setConfig(cfg => ({ ...cfg, targetBranch }));
  }, []);

  const setWorkingBranch = useCallback((workingBranch: string) => {
    const matches = /^(?:\w+\/)*([^-]+)-(\d+)/g.exec(workingBranch);
    const ticketId =
      matches && matches.length > 2 ? `${matches[1]}-${matches[2]}` : undefined;

    setConfig(cfg => ({
      ...cfg,
      workingBranch,
      ticketId: cfg.ticketId ?? ticketId,
    }));
  }, []);

  return (
    <div className="container mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-blue-600 text-3xl font-bold">
          Validate acceptance criteria
        </h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Project Configuration</CardTitle>
          <CardDescription>
            Select your project directory and Jira ticket to validate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-stretch gap-4 md:flex-row">
              <div className="flex w-full flex-col justify-between md:w-1/2">
                <label
                  htmlFor="project-path"
                  className="mb-2 block text-sm font-medium"
                >
                  Project Directory
                  <span className="ml-2 text-xs text-gray-500">
                    (Click folder icon to browse, you may need to adjust the
                    path)
                  </span>
                </label>
                <div className="flex gap-2">
                  <Input
                    id="project-path"
                    placeholder="Enter project directory path"
                    value={config.projectPath ?? ''}
                    onChange={handleProjectSelect}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFolderButtonClick}
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProjectSelect}
                    style={{ display: 'none' }}
                    {...({
                      webkitdirectory: 'true',
                      directory: 'true',
                    } as object)}
                  />
                </div>
              </div>
              <div className="flex w-full flex-col justify-between md:w-1/2">
                <label
                  htmlFor="jira-ticket"
                  className="mb-2 block text-sm font-medium"
                >
                  Jira Ticket ID
                </label>
                <Input
                  id="jira-ticket"
                  placeholder="PROJ-123"
                  value={config.ticketId ?? ''}
                  onChange={handleJiraTicketChange}
                  onBlur={handleJiraTicketBlur}
                />
              </div>
            </div>

            {config.projectName && (
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="w-full md:w-1/2">
                  <label
                    htmlFor="from-branch"
                    className="mb-2 block text-sm font-medium"
                  >
                    Base Branch to merge into
                  </label>
                  <BranchSelector
                    value={config.targetBranch || ''}
                    onValueChange={setTargetBranch}
                    branches={branches}
                    placeholder="Select branch"
                    label="Base Branch"
                  />
                </div>

                <div className="w-full md:w-1/2">
                  <label
                    htmlFor="to-branch"
                    className="mb-2 block text-sm font-medium"
                  >
                    Current working branch
                  </label>
                  <BranchSelector
                    value={config.workingBranch || ''}
                    onValueChange={setWorkingBranch}
                    branches={branches}
                    placeholder="Select working branch"
                    label="Working Branch"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {config.projectName && (
        <Input placeholder="Additional information not present in ticket description" />
      )}

      {config.projectName ? (
        <Content
          handleValidate={handleValidate}
          isLoading={isLoading}
          config={config}
          validationResult={validationResult}
        />
      ) : (
        <Alert className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No project selected</AlertTitle>
          <AlertDescription>
            Please enter a project directory path to get started.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface BranchSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  branches: string[];
  placeholder: string;
  label: string;
}

function BranchSelector({
  value,
  onValueChange,
  branches,
  placeholder,
  label,
}: BranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredBranches = branches.filter(branch =>
    branch.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            {value || placeholder}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full">
        <Command>
          <CommandInput
            placeholder={`Search ${label.toLowerCase()}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No branches found.</CommandEmpty>
            <CommandGroup>
              {filteredBranches.map(branch => (
                <CommandItem
                  key={branch}
                  value={branch}
                  onSelect={currentValue => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <GitBranch className="mr-2 h-4 w-4" />
                  {branch}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Content({
  handleValidate,
  isLoading,
  config,
  validationResult,
}: {
  handleValidate: () => void;
  isLoading: boolean;
  config: Config;
  validationResult: string | undefined;
}) {
  return (
    <Tabs defaultValue="results" className="mb-8">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="results">Validation Results</TabsTrigger>
        <TabsTrigger value="ticket">Jira Ticket Details</TabsTrigger>
      </TabsList>

      <TabsContent value="results">
        <ValidationResult
          handleValidate={handleValidate}
          isLoading={isLoading}
          validationResult={validationResult}
          config={config}
        />
      </TabsContent>

      <TabsContent value="ticket">
        <TicketDescription ticketDescription={config.ticketDescription} />
      </TabsContent>
    </Tabs>
  );
}

function ValidationResult({
  handleValidate,
  isLoading,
  validationResult,
  config,
}: {
  handleValidate: () => void;
  isLoading: boolean;
  validationResult: string | undefined;
  config: Config;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Validation Result</CardTitle>
          <CardDescription>
            Analysis of your implementation against the ticket requirements
          </CardDescription>
        </div>
        <Button
          onClick={handleValidate}
          disabled={
            isLoading ||
            !config.targetBranch ||
            !config.workingBranch ||
            !config.ticketDescription
          }
          className="ml-auto"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>Validate</>
          )}
        </Button>
      </CardHeader>
      <CardContent className="h-[500px] overflow-auto">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-[70%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : validationResult ? (
          <Markdown>{validationResult}</Markdown>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No validation results yet</AlertTitle>
            <AlertDescription>
              Click the &#39;Validate&#39; button to check if your
              implementation conforms to the ticket description.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function Markdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}

function TicketDescription({
  ticketDescription,
}: {
  ticketDescription: string | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jira Ticket Description</CardTitle>
        <CardDescription>Details of the ticket requirements</CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] overflow-auto">
        {ticketDescription ? (
          <Markdown>{ticketDescription}</Markdown>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No ticket description available</AlertTitle>
            <AlertDescription>
              Enter a valid Jira ticket ID to fetch the description.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
