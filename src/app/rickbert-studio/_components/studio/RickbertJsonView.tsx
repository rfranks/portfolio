import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

type RickbertJsonViewProps = {
  data: unknown;
  onCopy: () => void;
};

export default function RickbertJsonView({ data, onCopy }: RickbertJsonViewProps) {
  return (
    <div className="overflow-hidden rounded-md bg-slate-900">
      <div className="flex items-center justify-end border-b border-slate-700 bg-slate-800/70 p-1 text-slate-100">
        <Tooltip title="Copy JSON">
          <IconButton
            size="small"
            color="inherit"
            aria-label="Copy JSON"
            onClick={onCopy}
            sx={{ color: "inherit" }}
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </div>
      <pre className="max-h-[62vh] overflow-auto p-3 text-xs leading-5 text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
