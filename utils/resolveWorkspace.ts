export type WorkspaceStrategy = 'path' | 'header';

export type WorkspaceOptions = {
  enabled?: boolean;
  strategy?: WorkspaceStrategy;
};

export const resolveWorkspace = (): WorkspaceOptions => {
  const workspaceMode = process.env.NEXT_PUBLIC_WORKSPACE_MODE?.toLowerCase();

  return {
    enabled: workspaceMode !== 'single',
    strategy:
      process.env.NEXT_PUBLIC_WORKSPACE_STRATEGY === 'header'
        ? 'header'
        : 'path',
  };
};
