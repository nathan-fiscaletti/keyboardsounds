import React from "react";

import CloseIcon from '@mui/icons-material/Close';

import { Typography, Box, IconButton, Dialog, Paper } from "@mui/material";

function HelpDialog({ open, onClose }) {
  return (
    <Dialog open={open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2,
          overflow: "auto",
          maxHeight: "calc(100vh - 200px)",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
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
          <Typography variant="h6">Keyboar Sounds Editor - Help</Typography>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 2,
            height: "100%",
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            How it Works
          </Typography>
          <Typography variant="body1">
            Keyboard Sounds Editor is a tool for creating and editing keyboard
            sound profiles. It allows you to easily add and manage audio
            sources, as well as apply them to different keys on the keyboard.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            Manage Sources
          </Typography>
          <Typography variant="body1">
            To get started, click the "Sources" button in the top right
            corner of the editor. This will open a dialog where you can add,
            edit, and manage audio sources.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Add the audio sources you intend to assign by clicking the "Add
            Source" button and selecting the audio files you want to use.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            Assign to Keys
          </Typography>
          <Typography variant="body1">
            Once you have added sources, you can apply them to different keys on
            the keyboard.
            <ol>
              <li>Select the keys you want to apply the sources to</li>
              <li>Select the audio source you want to apply to them.</li>
              <li>Click the "Apply" button</li>
            </ol>
            <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
              This will apply the selected sources to the selected keys.
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Dialog>
  );
}

export { HelpDialog };

