import React from "react";

import { useState } from "react";

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import FileOpenIcon from '@mui/icons-material/FileOpen';

import { execute } from '../../execute';

import { Typography, Box, Tooltip, IconButton, TextField, Button, Dialog, Checkbox } from "@mui/material";

function AddSourceDialog({ open, onClose, onSourceAdded, onError }) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [pressSound, setPressSound] = useState(null);
  const [releaseSound, setReleaseSound] = useState(null);

  const selectPressSound = () => {
    execute("selectAudioFile").then((path) => {
      if (path) {
        setPressSound(path);
      }
    });
  };

  const selectReleaseSound = () => {
    execute("selectAudioFile").then((path) => {
      if (path) {
        setReleaseSound(path);
      }
    });
  };

  const saveSource = () => {
    if (name.length < 1) {
      onError("Source name cannot be empty.");
      return;
    }

    if (pressSound === null || pressSound.length < 1) {
      onError("Press sound must be set.");
      return;
    }

    onSourceAdded({ name, isDefault, pressSound, releaseSound });
    setName("");
    setIsDefault(true);
    setPressSound(null);
    setReleaseSound(null);
  };

  return (
    <Dialog open={open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Add Source</Typography>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
        <TextField
          placeholder="Name"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "400px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 1,
            alignItems: "center",
            mt: 1,
            p: 1,
          }}
        >
          <Typography
            variant="body2"
            color="GrayText"
            noWrap
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100vw - 250px)",
            }}
          >
            {pressSound || "Select a press sound..."}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => selectPressSound()}
            >
              Select
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "400px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 1,
            alignItems: "center",
            mt: 1,
            p: 1,
          }}
        >
          <Typography
            variant="body2"
            color="GrayText"
            noWrap
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100vw - 250px)",
            }}
          >
            {releaseSound || "Select a release sound..."}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="GrayText">
              (optional)
            </Typography>
            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => selectReleaseSound()}
            >
              Select
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            mt: 1,
            alignItems: "center",
          }}
        >
          <Tooltip
            title="This source will be included in the default sources used for keys that do not have a specific source set."
            placement="top"
            arrow
            followCursor
          >
            <Typography variant="body">Add to default sources</Typography>
          </Tooltip>
          <Checkbox checked={isDefault} onChange={(e, c) => setIsDefault(c)} />
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ mt: 3 }}
          onClick={() => saveSource()}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  );
}

export { AddSourceDialog };