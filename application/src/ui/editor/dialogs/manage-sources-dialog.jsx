import React from "react";

import { useState } from "react";

import Alert from '@mui/material/Alert';

import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import { Typography, Box, IconButton, TextField, List, Button, Dialog, InputAdornment, Tooltip } from "@mui/material";

import { SourceListItem } from './../components/source-list-item.jsx';

function ManageSourcesDialog({ open, onClose, onAddSource, onListenRequested, onEditSource, onRemoveSource, playingSource, sources, availableAudioFiles, searchPath, onChangeSearchPath }) {
  const [search, setSearch] = useState("");
  const truncateMiddle = (val, maxLen) => {
    const s = String(val || "");
    if (s.length <= maxLen) return s;
    const keep = maxLen - 3;
    const start = Math.ceil(keep / 2);
    const end = Math.floor(keep / 2);
    return s.slice(0, start) + "..." + s.slice(s.length - end);
  };

  const files = (availableAudioFiles && availableAudioFiles[0] && Array.isArray(availableAudioFiles[0].files)) ? availableAudioFiles[0].files : [];
  const numAudioFiles = files.length;

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
          {
            searchPath ? (
              sources.length > 0 ? (
                <Typography variant="h6">Manage Sources</Typography>
              ) : (
                <Typography variant="h6">Source Configuration</Typography>
              )
            ) : (
              <Typography variant="h6">Source Configuration</Typography>
            )
          }
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            {searchPath ? (
              sources.length < 1 ? (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => onAddSource && onAddSource()}
                >
                  Add your first source
                </Button>
              </>
              ) : (
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
              )
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
              }}
            >
              <Alert severity="warning" variant="outlined" sx={{ mb: 2 }}>
                Warning. Once you begin adding sources, this Audio Search Path cannot be changed again until all sources are removed.
              </Alert>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  p: 3,
                  pt: 1.5,
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 1,
                  width: '100%',
                }}
              >
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}>
                  {/* Left aligned box with title and info icon. */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyItems: 'center',
                  }}>
                    <Typography variant="body1">
                      Audio Search Path
                    </Typography>
                    <Tooltip arrow placement="right" title="The directory in which audio files for this profile are stored. All files must be in the root of the directory. Supports: *.wav,*.mp3">
                      <InfoIcon sx={{ ml: 1, mt: 0.25 }} fontSize="small" />
                    </Tooltip>
                  </Box>

                  {/* Right Aligned Box with check icon and number 3 */}
                  <Tooltip placement="left" arrow title={`${numAudioFiles} valid audio files found in search path`}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyItems: 'center',
                      border: '1px solid rgba(76, 175, 80, 0.5)',
                      borderRadius: 24,
                      p: 1,
                    }}>
                      <CheckCircleIcon fontSize="medium" color="success" />
                    </Box>
                  </Tooltip>
                </Box>
                {searchPath ? (
                  <Typography variant="body2" color="GrayText" sx={{ mb: 2 }}>
                    {truncateMiddle(searchPath, 100)}
                  </Typography>
                ) : null}
                <Button
                  variant="outlined"
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
              // height: "240px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                // alignItems: "center",
                justifyContent: "center",
                p: 3,
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 1,
                width: '100%',
              }}
            >
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyItems: 'center',
              }}>
                <Typography variant="body1">
                  Audio Search Path
                </Typography>
                <Tooltip arrow placement="right" title="The directory in which audio files for this profile are stored. All files must be in the root of the directory. Supports: *.wav,*.mp3">
                  <InfoIcon sx={{ ml: 1, mt: 0.25 }} fontSize="small" />
                </Tooltip>
              </Box>
              <Typography variant="body2" color="GrayText" sx={{ mb: 2, mt: 1 }}>
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