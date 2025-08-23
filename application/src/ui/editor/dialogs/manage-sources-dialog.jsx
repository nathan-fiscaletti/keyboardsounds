import React from "react";

import { useState } from "react";

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';

import { Typography, Box, IconButton, TextField, List, Button, Dialog, InputAdornment } from "@mui/material";

import { SourceListItem } from './../components/source-list-item.jsx';

function ManageSourcesDialog({ open, onClose, onAddSource, onListenRequested, onRemoveSource, playingSource, sources }) {
  const [search, setSearch] = useState("");

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
          <Typography variant="h6">Manage Sources</Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              sx={{ mr: 1 }}
              onClick={() => onAddSource()}
            >
              Add Source
            </Button>
            <IconButton onClick={() => onClose()}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <TextField
          label="Search"
          size="small"
          sx={{ mb: 1 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Box
          sx={{
            overflow: "auto",
            maxHeight: "calc(100vh - 200px)",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {/* Make the list have a max height */}
          <List>
            {sources
              .filter(
                (source) =>
                  search === "" ||
                  source.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((source) => {
                const name = source.name;

                const isPressAndRelease =
                  source.pressSound && source.releaseSound;
                const press = source.pressSound
                  .replace(/\\/g, "/")
                  .split("/")
                  .pop();
                const release = isPressAndRelease
                  ? source.releaseSound.replace(/\\/g, "/").split("/").pop()
                  : null;

                const originalIndex = sources.findIndex((s) => s.name === name);

                return (
                  <SourceListItem
                    key={source.name}
                    name={name}
                    press={press}
                    release={release}
                    isDefault={source.isDefault}
                    onListenRequested={() => onListenRequested(source)}
                    onRemoveRequested={() => onRemoveSource(originalIndex)}
                    playingSource={playingSource}
                  />
                );
              })}
          </List>
        </Box>
      </Box>
    </Dialog>
  );
}

export { ManageSourcesDialog };