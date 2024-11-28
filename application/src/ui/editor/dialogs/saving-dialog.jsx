import React from "react";

import ErrorIcon from '@mui/icons-material/Error';

import { Typography, Box, Dialog, Paper } from "@mui/material";

function SavingDialog({ saving }) {
  return (
    <Dialog open={saving}>
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
            alignItems: "center",
          }}
        >
          <ErrorIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="h6">Saving...</Typography>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 1,
            mt: 2,
            height: "100%",
          }}
        >
          <Typography variant="body1" color="HighlightText">
            Saving profile, please wait...
          </Typography>
        </Paper>
      </Box>
    </Dialog>
  );
}

export { SavingDialog };