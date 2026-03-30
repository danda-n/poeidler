type ShellPageHeaderProps = {
  title: string;
  description: string;
};

export function ShellPageHeader({ title, description }: ShellPageHeaderProps) {
  return (
    <header className="pt-1.5 px-0.5">
      <div>
        <p className="m-0 mb-[5px] text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-[#7f8ca3]">Current screen</p>
        <h2 className="m-0 text-[clamp(1.2rem,1.8vw,1.6rem)] font-extrabold tracking-tight text-[#f7f3e8]">{title}</h2>
        <p className="mt-1.5 mb-0 max-w-[760px] text-[0.82rem] text-[#98a5b9]">{description}</p>
      </div>
    </header>
  );
}
