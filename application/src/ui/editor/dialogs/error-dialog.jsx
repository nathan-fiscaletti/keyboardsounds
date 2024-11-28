import React from "react";

import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';

import { Typography, Box, IconButton, Dialog, Paper } from "@mui/material";

function ErrorDialog({ open, onClose, error }) {
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <ErrorIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="h6">Error</Typography>
          </Box>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 1,
            height: "100%",
          }}
        >
          <Typography variant="body1" color="HighlightText">
            {error}
          </Typography>
        </Paper>
      </Box>
    </Dialog>
  );
}


export { ErrorDialog };