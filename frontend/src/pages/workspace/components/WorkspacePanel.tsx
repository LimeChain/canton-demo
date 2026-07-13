import type { PropsWithChildren, ReactNode } from 'react';

type WorkspacePanelProps = PropsWithChildren<{
  icon: ReactNode;
  title: string;
  className?: string;
}>;

export function WorkspacePanel({ icon, title, className, children }: WorkspacePanelProps) {
  return (
    <div className={className ? `panel ${className}` : 'panel'}>
      <div className="panel-title">
        {icon}
        <h2>{title}</h2>
      </div>

      {children}
    </div>
  );
}
