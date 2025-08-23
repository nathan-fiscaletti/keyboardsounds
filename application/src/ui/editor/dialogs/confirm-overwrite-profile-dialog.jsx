import React from "react";

import { Dialog, Box, Typography, Button } from "@mui/material";

function ConfirmOverwriteProfileDialog({ open, profileName, onCancel, onConfirm }) {
  return (
    <Dialog open={open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2,
          maxWidth: "440px",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Overwrite Profile?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A profile with the name '{profileName}' already exists. Are you sure you want to overwrite it?
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            mt: 1,
          }}
        >
          <Button variant="text" onClick={() => onCancel()} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button color="warning" variant="contained" onClick={() => onConfirm()}>
            Overwrite
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export { ConfirmOverwriteProfileDialog };


