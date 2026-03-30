import { Tooltip } from "./Tooltip";

type InfoIconProps = {
  tooltip: string;
};

export function InfoIcon({ tooltip }: InfoIconProps) {
  return (
    <Tooltip content={tooltip}>
      <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-border-subtle text-text-secondary text-[0.65rem] font-bold cursor-help shrink-0 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.12)] hover:text-[#ccc]" aria-label="More info">&#9432;</span>
    </Tooltip>
  );
}
