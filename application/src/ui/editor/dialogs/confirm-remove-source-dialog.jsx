import React from "react";

import { Dialog, Box, Typography, Button } from "@mui/material";

function ConfirmRemoveSourceDialog({ open, onCancel, onConfirm }) {
  return (
    <Dialog open={open}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2,
          maxWidth: "400px",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Remove Source
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This source is currently being used by some of the keys in this profile. Removing it will remove it from those keys. Are you sure?
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
          <Button color="error" variant="contained" onClick={() => onConfirm()}>
            Remove
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export { ConfirmRemoveSourceDialog };


