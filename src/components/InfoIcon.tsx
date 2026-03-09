import Tooltip from "./Tooltip";

type InfoIconProps = {
  tooltip: string;
};

function InfoIcon({ tooltip }: InfoIconProps) {
  return (
    <Tooltip content={tooltip}>
      <span className="info-icon" aria-label="More info">&#9432;</span>
    </Tooltip>
  );
}

export default InfoIcon;
