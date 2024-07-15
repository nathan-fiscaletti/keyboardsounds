import React, { useEffect } from "react";

import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import BugReportIcon from "@mui/icons-material/BugReport";
import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import {
  Alert,
  Button,
  TextField,
  Link,
  Dialog,
  DialogTitle,
  CircularProgress,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { execute } from "../execute";

import ReactMarkdown from "react-markdown";
import Close from "@mui/icons-material/Close";
import { CheckCircleOutline } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";

const AboutItem = ({ icon, title, value, first }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        mt: first ? 0 : 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon}
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            ml: 1,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="button" color="GrayText">
        {value}
      </Typography>
    </Box>
  );
};

const Settings = ({ appVersion, backEndVersion }) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [update, setUpdate] = useState(null);
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const checkForUpdate = function () {
    setCheckingForUpdate(true);
    execute("checkForUpdate").then((release) => {
      if (release) {
        setIsUpdateAvailable(true);
        setUpdate(release);
      }

      setCheckingForUpdate(false);
      setUpdateDialogOpen(true);
    });
  };

  useEffect(() => {
    if (!updateDialogOpen) {
      setUpdate(null);
      setIsUpdateAvailable(false);
    }
  }, [updateDialogOpen]);

  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
        mt: 2,
      }}
    >
      <Dialog open={updateDialogOpen} fullWidth>
        {isUpdateAvailable && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 1,
              p: 2,
              bgcolor: "background.default",
            }}
          >
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "start",
                mb: 1,
              }}>
                <CheckCircleOutlineIcon color="success" />
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Update Available
                </Typography>
              </Box>
              <IconButton onClick={() => setUpdateDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ mt: 1 }}>Version {update.tag_name}</Typography>
            <DialogContent dividers={scroll === "paper"}>
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <Typography variant="h6" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <Typography variant="body1" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <Typography variant="body2" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <Typography variant="subtitle1" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <Typography variant="subtitle2" {...props} />
                  ),
                }}
              >
                {update.body}
              </ReactMarkdown>
            </DialogContent>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => window.open(update.html_url, "_blank")}
            >
              Download
            </Button>
          </Box>
        )}
        {!isUpdateAvailable && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 1,
              p: 2,
              bgcolor: "background.default",
            }}
          >
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "start",
                mb: 1,
              }}>
                <CheckCircleOutlineIcon color="success" />
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Up to Date
                </Typography>
              </Box>
              <IconButton onClick={() => setUpdateDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Typography variant="body" sx={{ mt: 2 }}>
              You are running the latest version of Keyboard Sounds.
            </Typography>
          </Box>
        )}
      </Dialog>
      <Typography variant="h6">Sound Test</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          p: 2,
          bgcolor: "background.default",
          // minHeight: "calc(100vh - 800px)",
        }}
      >
        <Alert
          severity="success"
          variant="outlined"
          icon={<BugReportIcon />}
          sx={{
            mb: 2,
          }}
        >
          Test the selected profile by typing below.
        </Alert>
        <TextField multiline placeholder="Type here..." fullWidth rows={5.6} />
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>
        About
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
          mt: 2,
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <AboutItem
          icon={<CheckCircleOutlineIcon fontSize="small" color="disabled" />}
          title="App Version"
          value={appVersion}
          first
        />
        <AboutItem
          icon={<StorageIcon fontSize="small" color="disabled" />}
          title="Backend Version"
          value={backEndVersion}
        />
        <AboutItem
          icon={<PersonOutlineIcon fontSize="small" color="disabled" />}
          title="Created By"
          value="Nathan Fiscaletti"
        />

        <Link
          href="https://github.com/nathan-fiscaletti/keyboardsounds/issues"
          target="_blank"
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<BugReportIcon />}
            sx={{
              mt: 2,
            }}
          >
            Report a Bug
          </Button>
        </Link>
        <LoadingButton
          fullWidth
          variant="outlined"
          loading={checkingForUpdate}
          disabled={checkingForUpdate}
          loadingPosition="start"
          startIcon={<CloudDownloadIcon />}
          sx={{
            mt: 2,
          }}
          onClick={() => checkForUpdate()}
        >
          Check for Update
        </LoadingButton>
      </Box>
    </Box>
  );
};

export { Settings };
