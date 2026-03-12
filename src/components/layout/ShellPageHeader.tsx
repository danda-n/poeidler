type ShellPageHeaderProps = {
  title: string;
  description: string;
};

export function ShellPageHeader({ title, description }: ShellPageHeaderProps) {
  return (
    <header className="shell-page-header">
      <div>
        <p className="shell-page-eyebrow">Current screen</p>
        <h2 className="shell-page-title">{title}</h2>
        <p className="shell-page-description">{description}</p>
      </div>
    </header>
  );
}
