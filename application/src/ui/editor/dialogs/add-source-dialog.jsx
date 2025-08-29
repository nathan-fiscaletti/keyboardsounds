import React from "react";

import { useState, useEffect } from "react";

import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { Typography, Box, Tooltip, IconButton, TextField, Button, Dialog, Checkbox, Select, MenuItem } from "@mui/material";

function AddSourceDialog({ open, onClose, onSourceAdded, onSourceUpdated, onError, mode = "add", initialSource = null, audioSearchPath = '', availableAudioFiles = [], existingNames = [] }) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    console.log("initialSource", initialSource);
  }, [initialSource]);

  const [selectedPress, setSelectedPress] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");

  // Seed base fields when opening or switching mode/source
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialSource) {
      setName(initialSource.name || "");
      setIsDefault(!!initialSource.isDefault);
      setSelectedPress(initialSource ? initialSource.pressSound.replace(/^.*[\\/]/, '') : "");
      setSelectedRelease(initialSource ? initialSource.releaseSound ? initialSource.releaseSound.replace(/^.*[\\/]/, '') : "" : "");
    } else if (mode === "add") {
      setName("");
      setIsDefault(false);
      setSelectedPress("");
      setSelectedRelease("");
    }
  }, [open, mode, initialSource]);

  // Preselect dropdowns by basename once files are available (single search path)
  useEffect(() => {
    if (!open || mode !== "edit" || !initialSource) return;
    const files = (availableAudioFiles && availableAudioFiles[0] && Array.isArray(availableAudioFiles[0].files)) ? availableAudioFiles[0].files : [];
    if (files.length === 0) return;

    const basename = (p) => (p || '').replace(/\\\\/g, '/').split('/').pop();
    if (!selectedPress && initialSource.pressSound) {
      const base = (basename(initialSource.pressSound) || '').toLowerCase();
      const found = files.find(f => (f || '').toLowerCase() === base);
      if (found) setSelectedPress(found);
    }
    if (!selectedRelease && initialSource.releaseSound) {
      const base = (basename(initialSource.releaseSound) || '').toLowerCase();
      const found = files.find(f => (f || '').toLowerCase() === base);
      if (found) setSelectedRelease(found);
    }
  }, [open, mode, initialSource, availableAudioFiles, selectedPress, selectedRelease]);

  const saveSource = () => {
    const trimmedName = (name || "").trim();
    if (trimmedName.length < 1) {
      onError("Source name cannot be empty.");
      return;
    }
    // Enforce unique name (case-insensitive)
    const lower = trimmedName.toLowerCase();
    const initialLower = ((initialSource && initialSource.name) ? String(initialSource.name) : "").trim().toLowerCase();
    if (mode === 'add') {
      if (existingNames.some(n => String(n).toLowerCase() === lower)) {
        onError("A source with that name already exists.");
        return;
      }
    } else {
      // edit mode: allow keeping the same name, block collisions with others
      if (lower !== initialLower && existingNames.some(n => String(n).toLowerCase() === lower)) {
        onError("A source with that name already exists.");
        return;
      }
    }
    const files = (availableAudioFiles && availableAudioFiles[0] && Array.isArray(availableAudioFiles[0].files)) ? availableAudioFiles[0].files : [];
    if (!audioSearchPath || files.length === 0) {
      onError("No audio files are available. Set an audio search path first.");
      return;
    }
    if (!selectedPress) {
      onError("Press sound must be set.");
      return;
    }

    const sep = audioSearchPath.endsWith('\\') || audioSearchPath.endsWith('/') ? '' : (audioSearchPath.includes('\\') ? '\\' : '/');
    const pressAbs = `${audioSearchPath}${sep}${selectedPress}`;
    const releaseAbs = selectedRelease ? `${audioSearchPath}${sep}${selectedRelease}` : null;

    const payload = { name: trimmedName, isDefault, pressSound: pressAbs, releaseSound: releaseAbs };
    if (mode === "edit" && onSourceUpdated) {
      onSourceUpdated(payload);
    } else if (onSourceAdded) {
      onSourceAdded(payload);
      // reset only in add mode after successful save
      setName("");
      setIsDefault(true);
      setSelectedPress("");
      setSelectedRelease("");
    }
  };

  const files = (availableAudioFiles && availableAudioFiles[0] && Array.isArray(availableAudioFiles[0].files)) ? availableAudioFiles[0].files : [];
  const selectsDisabled = files.length === 0;

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
          <Typography variant="h6">{mode === "edit" ? "Edit Source" : "Add Source"}</Typography>
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
        <Box sx={{ display: "flex", flexDirection: "column", mt: 1 }}>
          <Typography variant="caption" color="GrayText" sx={{ mb: 0.5 }}>Press sound</Typography>
          <Select
            value={selectedPress}
            size="small"
            onChange={(e) => setSelectedPress(e.target.value)}
            displayEmpty
            sx={{ width: "400px" }}
            disabled={selectsDisabled}
          >
            <MenuItem value=""><em>{selectsDisabled ? 'No files available' : 'Select press sound…'}</em></MenuItem>
            {files.map((fileName) => (
              <MenuItem key={fileName} value={fileName}>{fileName}</MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", mt: 1 }}>
          <Typography variant="caption" color="GrayText" sx={{ mb: 0.5 }}>Release sound (optional)</Typography>
          <Select
            value={selectedRelease}
            size="small"
            onChange={(e) => setSelectedRelease(e.target.value)}
            displayEmpty
            sx={{ width: "400px" }}
            disabled={selectsDisabled}
          >
            <MenuItem value=""><em>{selectsDisabled ? 'No files available' : 'None'}</em></MenuItem>
            {files.map((fileName) => (
              <MenuItem key={fileName} value={fileName}>{fileName}</MenuItem>
            ))}
          </Select>
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
          <Typography variant="body">Add to default sources</Typography>
          <Tooltip
            title="This source will be included in the default sources used for keys that do not have a specific source set."
            placement="left"
            arrow
          >
            <Checkbox checked={isDefault} onChange={(e, c) => setIsDefault(c)} />
          </Tooltip>
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