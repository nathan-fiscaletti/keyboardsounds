import React from "react";

import { useState } from "react";

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

import { Typography, Box, IconButton, TextField, List, Button, Dialog, InputAdornment, Tooltip } from "@mui/material";

import { SourceListItem } from './../components/source-list-item.jsx';

function ManageSourcesDialog({ open, onClose, onAddSource, onListenRequested, onEditSource, onRemoveSource, playingSource, sources, searchPath, onChangeSearchPath }) {
  const [search, setSearch] = useState("");
  const truncateMiddle = (val, maxLen) => {
    const s = String(val || "");
    if (s.length <= maxLen) return s;
    const keep = maxLen - 3;
    const start = Math.ceil(keep / 2);
    const end = Math.floor(keep / 2);
    return s.slice(0, start) + "..." + s.slice(s.length - end);
  };

  return (
    <Dialog open={open} fullWidth>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          px: 2,
          pt: searchPath && (sources || []).length === 0 ? 3 : 2,
          pb: searchPath && (sources || []).length === 0 ? 4 : 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: searchPath && (sources || []).length === 0 ? 3 : 2,
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
            {searchPath ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => onAddSource()}
                >
                  Add Source
                </Button>
              </>
            ) : null}
            <IconButton onClick={() => onClose()}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {searchPath ? (
          sources.length > 0 ? (
            <>
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
                          onEditRequested={() => onEditSource(originalIndex)}
                          onRemoveRequested={() => onRemoveSource(originalIndex)}
                          playingSource={playingSource}
                        />
                      );
                    })}
                </List>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "240px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 1,
                  width: 420,
                  mb: 2,
                }}
              >
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                  Add a source to start building your profile
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3,
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 1,
                  width: 420,
                }}
              >
                <Typography variant="body1" sx={{ mb: 1.5, textAlign: 'center' }}>
                  Change the directory containing your audio files
                </Typography>
                {searchPath ? (
                  <Tooltip title={searchPath} placement="top" arrow>
                    <Typography variant="body2" color="GrayText" sx={{ mb: 2, textAlign: 'center' }}>
                      {truncateMiddle(searchPath, 50)}
                    </Typography>
                  </Tooltip>
                ) : null}
                <Button
                  variant="contained"
                  startIcon={<FolderOpenIcon />}
                  onClick={() => onChangeSearchPath && onChangeSearchPath()}
                >
                  Change Search Path
                </Button>
              </Box>
            </Box>
          )
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "240px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 1,
                minWidth: 360,
              }}
            >
              <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                Select the directory containing your audio files to begin
              </Typography>
              <Button variant="contained" startIcon={<FolderOpenIcon />} onClick={() => onChangeSearchPath && onChangeSearchPath()}>
                Select Directory
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

export { ManageSourcesDialog };