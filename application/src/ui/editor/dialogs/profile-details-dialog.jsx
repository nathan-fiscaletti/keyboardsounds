import React from "react";

import { useState } from "react";

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { Typography, Box, IconButton, TextField, Button, Dialog } from "@mui/material";

function ProfileDetailsDialog({
  open,
  onClose,
  onSave,
  onError,
  profileDetails,
}) {
  const [name, setName] = useState(profileDetails.name);
  const [author, setAuthor] = useState(profileDetails.author);
  const [description, setDescription] = useState(profileDetails.description);

  const doSave = () => {
    if (name.length < 1) {
      onError("Profile name cannot be empty.");
      return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      onError(
        "Profile name can only contain alphanumeric characters, dashes, and underscores."
      );
      return;
    }

    onSave({ name, author, description });
    onClose();
  };

  return (
    <Dialog open={open} fullWidth>
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
          <Typography variant="h6">Profile Details</Typography>
          <IconButton
            onClick={() => {
              setName(profileDetails.name);
              setAuthor(profileDetails.author);
              setDescription(profileDetails.description);
              onClose();
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <TextField
          label="Profile Name"
          size="small"
          sx={{ mb: 2 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Author"
          size="small"
          sx={{ mb: 2 }}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <TextField
          label="Description"
          size="small"
          multiline
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          fullWidth
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ mt: 3 }}
          onClick={() => doSave()}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  );
}

export { ProfileDetailsDialog };