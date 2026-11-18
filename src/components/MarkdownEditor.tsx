import { useState } from "react";
import { Box, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownPreview({ value }: { value: string }) {
  return (
    <Box className="markdown-preview" aria-label="Markdown preview">
      {value.trim() ? (
        <ReactMarkdown
          skipHtml
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
        >
          {value}
        </ReactMarkdown>
      ) : (
        <Typography color="text.secondary">
          Your formatted note will appear here as you write.
        </Typography>
      )}
    </Box>
  );
}

export default function MarkdownEditor({
  value,
  onChange,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, nextTab: number) => setActiveTab(nextTab)}
        aria-label="Note editor view"
        sx={{ display: { xs: "flex", md: "none" }, mb: 2 }}
      >
        <Tab label="Write" />
        <Tab label="Preview" />
      </Tabs>
      <Box className="editor-grid">
        <Paper
          variant="outlined"
          className="editor-panel"
          sx={{ display: { xs: activeTab === 0 ? "block" : "none", md: "block" } }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Markdown
          </Typography>
          <TextField
            multiline
            minRows={16}
            fullWidth
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={"# A useful idea\n\nWrite your notes in Markdown..."}
            inputProps={{ "aria-label": "Note in Markdown" }}
          />
        </Paper>
        <Paper
          variant="outlined"
          className="editor-panel"
          sx={{ display: { xs: activeTab === 1 ? "block" : "none", md: "block" } }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Preview
          </Typography>
          <MarkdownPreview value={value} />
        </Paper>
      </Box>
    </Box>
  );
}
