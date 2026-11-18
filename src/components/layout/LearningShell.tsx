import { AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import { useRef, useState, type ChangeEventHandler, type ReactNode } from "react";

const drawerWidth = 248;
const navigation = [
  { label: "Today", icon: <HomeOutlinedIcon /> },
  { label: "All notes", icon: <AutoStoriesOutlinedIcon /> },
  { label: "Revision list", icon: <CheckCircleOutlineRoundedIcon /> },
  { label: "Study log", icon: <CalendarMonthOutlinedIcon /> },
  { label: "Subjects", icon: <SubjectOutlinedIcon /> },
];

export function LearningShell({
  page, email, onPageChange, onExport, onImport, onSignOut, backupDisabled, children, dialogs,
}: {
  page: string;
  email?: string;
  onPageChange: (page: string) => void;
  onExport: () => void;
  onImport: ChangeEventHandler<HTMLInputElement>;
  onSignOut: () => void;
  backupDisabled: boolean;
  children: ReactNode;
  dialogs: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const backupInput = useRef<HTMLInputElement>(null);

  function selectPage(nextPage: string) {
    onPageChange(nextPage);
    setMobileOpen(false);
  }

  const sidebar = (
    <Box className="sidebar-content">
      <Box className="brand">
        <Box className="brand-mark"><LocalLibraryOutlinedIcon fontSize="small" /></Box>
        <Box>
          <Typography fontWeight={750} lineHeight={1.2}>Learning</Typography>
          <Typography fontWeight={750} lineHeight={1.2}>Everyday</Typography>
        </Box>
      </Box>
      <Divider />
      <List aria-label="Main navigation" sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.label}
            selected={page === item.label}
            onClick={() => selectPage(item.label)}
            aria-current={page === item.label ? "page" : undefined}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box className="sidebar-bottom">
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Signed in as
        </Typography>
        <Typography variant="body2" fontWeight={650} noWrap>
          {email}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box className="app-shell">
      <Drawer
        variant="permanent"
        className="desktop-drawer"
        sx={{ display: { xs: "none", md: "block" } }}
        PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box" } }}
      >
        {sidebar}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: drawerWidth, boxSizing: "border-box" } }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {sidebar}
      </Drawer>
      <Box className="main-column" sx={{ ml: { md: `${drawerWidth}px` } }}>
        <AppBar position="sticky" color="inherit" elevation={0} className="topbar">
          <Toolbar className="topbar-content">
            <IconButton
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" }, mr: 1 }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary" className="topbar-title">
              {page}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              color="inherit"
              size="small"
              aria-label="Export backup"
              onClick={onExport}
              startIcon={<CloudDownloadOutlinedIcon />}
              disabled={backupDisabled}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Export
              </Box>
            </Button>
            <Button
              color="inherit"
              size="small"
              aria-label="Import notes or backup"
              onClick={() => backupInput.current?.click()}
              startIcon={<CloudUploadOutlinedIcon />}
              disabled={backupDisabled}
              sx={{ ml: 0.5 }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Import
              </Box>
            </Button>
            <input
              ref={backupInput}
              hidden
              type="file"
              accept=".json,application/json,.pdf,application/pdf,.doc,application/msword"
              aria-label="Choose a JSON backup, PDF, or Word document"
              onChange={onImport}
            />
            <Button
              color="inherit"
              aria-label="Sign out"
              onClick={onSignOut}
              startIcon={<LogoutRoundedIcon />}
              sx={{ ml: 1 }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Sign out
              </Box>
            </Button>
          </Toolbar>
        </AppBar>
        <Box component="main" className="main-content">
          <Box className="page-content">
            {children}
          </Box>
        </Box>
      </Box>
      {dialogs}
    </Box>
  );
}
