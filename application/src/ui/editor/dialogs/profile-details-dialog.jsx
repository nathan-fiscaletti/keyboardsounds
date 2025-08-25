import React from "react";

import { useState, useEffect } from "react";

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
  const [nameError, setNameError] = useState(null);
  const [authorError, setAuthorError] = useState(null);
  const [descriptionError, setDescriptionError] = useState(null);

  const validateProfileName = (value) => {
    const trimmed = (value || "").trim();
    if (trimmed.length < 1) {
      return "Name must be at least 1 character. Allowed: A-Z a-z 0-9 - _ . (no spaces)";
    }
    if (!/^[A-Za-z0-9-_.]+$/.test(trimmed)) {
      return "Allowed characters: A-Z a-z 0-9 - _ . (no spaces)";
    }
    return null;
  };

  const validateNonEmpty = (value, label) => {
    const trimmed = (value || "").trim();
    if (trimmed.length < 1) {
      return `${label} cannot be empty.`;
    }
    return null;
  };

  // Keep local state in sync with incoming props when dialog opens
  useEffect(() => {
    if (open) {
      setName(profileDetails.name);
      setAuthor(profileDetails.author);
      setDescription(profileDetails.description);
      setNameError(validateProfileName(profileDetails.name));
      setAuthorError(validateNonEmpty(profileDetails.author, "Author"));
      setDescriptionError(validateNonEmpty(profileDetails.description, "Description"));
    }
  }, [open, profileDetails]);

  const doSave = () => {
    const nameErr = validateProfileName(name);
    const authorErr = validateNonEmpty(author, "Author");
    const descriptionErr = validateNonEmpty(description, "Description");

    setNameError(nameErr);
    setAuthorError(authorErr);
    setDescriptionError(descriptionErr);

    if (nameErr || authorErr || descriptionErr) {
      return;
    }
    onSave({ name: name.trim(), author: author.trim(), description: description.trim() });
    onClose();
  };

  return (
    <Dialog open={open} sx={{ maxWidth: '50%', maxWidth: '50%', justifySelf: 'center' }}>
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
          <Typography variant="h6">Edit Metadata</Typography>
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
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2, width: "100%", mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                label="Profile Name"
                size="small"
                fullWidth
                value={name}
                error={Boolean(nameError)}
                inputProps={{ maxLength: 22, "aria-label": "profile name" }}
                InputProps={{
                  endAdornment: (
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {name.length}/22
                    </Typography>
                  ),
                }}
                onChange={(e) => {
                  const v = (e.target.value || "").slice(0, 22);
                  setName(v);
                  setNameError(validateProfileName(v));
                }}
              />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField
                label="Author"
                size="small"
                fullWidth
                value={author}
                error={Boolean(authorError)}
                inputProps={{ maxLength: 22, "aria-label": "author" }}
                InputProps={{
                  endAdornment: (
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {author.length}/22
                    </Typography>
                  ),
                }}
                onChange={(e) => {
                  const v = (e.target.value || "").slice(0, 22);
                  setAuthor(v);
                  setAuthorError(validateNonEmpty(v, "Author"));
                }}
              />
          </Box>
        </Box>
          <TextField
            label="Description"
            size="small"
            multiline
            rows={3}
            fullWidth
            value={description}
            error={Boolean(descriptionError)}
            inputProps={{ maxLength: 110, "aria-label": "description" }}
            InputProps={{
              endAdornment: (
                <Box sx={{ position: 'absolute', top: 6, right: 8, pointerEvents: 'none' }}>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    {description.length}/110
                  </Typography>
                </Box>
              ),
            }}
            onChange={(e) => {
              const v = (e.target.value || "").slice(0, 110);
              setDescription(v);
              setDescriptionError(validateNonEmpty(v, "Description"));
            }}
            sx={{
              mt: 0,
              '& .MuiInputBase-root': { position: 'relative' },
            }}
          />
        <Button
          fullWidth
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ mt: 3 }}
          disabled={Boolean(nameError || authorError || descriptionError)}
          onClick={() => doSave()}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  );
}

export { ProfileDetailsDialog };