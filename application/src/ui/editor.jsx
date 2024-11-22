import "./index.css";

import React from "react";

import { useState, useEffect } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import green from "@mui/material/colors/green";
import GitHubIcon from "@mui/icons-material/GitHub";
import HelpIcon from '@mui/icons-material/Help';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import LabelIcon from '@mui/icons-material/Label';
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import DeleteOutlineOutlinedIcon  from "@mui/icons-material/DeleteOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FileOpenIcon from '@mui/icons-material/FileOpen';

import Card from "@mui/material/Card";
import { Typography, Box, Tooltip, IconButton, TextField, List, ListItem, Button, Select, MenuItem, Divider, Dialog, InputAdornment, ListItemText, Chip } from "@mui/material";

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

// Create the initial theme for the application.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: green,
  },
});

const keyboardOptions = {
  syncInstanceInputs: true,
  mergeDisplay: true,
  layout: {
    default: [
      "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
      "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
      "{tab} q w e r t y u i o p [ ] {backslash}",
      "{capslock} a s d f g h j k l ; ' {enter}",
      "{shiftleft} z x c v b n m , . / {shiftright}",
      "{controlleft} {altleft} {metaleft} {space} {metaright} {altright} {controlright}"
    ],
    shift: [
      "{escape} {f1} {f2} {f3} {f4} {f5} {f6} {f7} {f8} {f9} {f10} {f11} {f12}",
      "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
      "{tab} Q W E R T Y U I O P { } |",
      '{capslock} A S D F G H J K L : " {enter}',
      "{shiftleft} Z X C V B N M < > ? {shiftright}",
      "{controlleft} {altleft} {metaleft} {space} {metaright} {altright} {controlright}"
    ]
  },
  display: {
    "{f1}": "f1",
    "{f2}": "f2",
    "{f3}": "f3",
    "{f4}": "f4",
    "{f5}": "f5",
    "{f6}": "f6",
    "{f7}": "f7",
    "{f8}": "f8",
    "{f9}": "f9",
    "{f10}": "f10",
    "{f11}": "f11",
    "{f12}": "f12",
    "{escape}": "esc",
    "{tab}": "tab",
    "{backspace}": "backspace",
    "{enter}": "enter",
    "{backslash}": "\\",
    "{capslock}": "caps",
    "{shiftleft}": "shift",
    "{shiftright}": "shift",
    "{controlleft}": "ctrl",
    "{controlright}": "ctrl",
    "{altleft}": "alt",
    "{altright}": "alt",
    "{metaleft}": "cmd",
    "{metaright}": "cmd"
  }
};

const keyboardControlPadOptions = {
  layout: {
    default: [
      "{prtscr} {scrolllock} {pause}",
      "{insert} {home} {pageup}",
      "{delete} {end} {pagedown}"
    ]
  },
  display: {
    "{prtscr}": "prt",
    "{scrolllock}": "scrl",
    "{pause}": "ps",
    "{insert}": "ins",
    "{home}": "home",
    "{pageup}": "pgu",
    "{delete}": "del",
    "{end}": "end",
    "{pagedown}": "pgd"
  }
};

const keyboardArrowsOptions = {
  layout: {
    default: ["{arrowup}", "{arrowleft} {arrowdown} {arrowright}"]
  }
};

const keyboardNumPadOptions = {
  layout: {
    default: [
      "{numlock} {numpaddivide} {numpadmultiply}",
      "{numpad7} {numpad8} {numpad9}",
      "{numpad4} {numpad5} {numpad6}",
      "{numpad1} {numpad2} {numpad3}",
      "{numpad0} {numpaddecimal}"
    ]
  }
};

const keyboardNumPadEndOptions = {
  layout: {
    default: ["{numpadsubtract}", "{numpadadd}", "{numpadenter}"]
  },
  display: {
    "{numpadsubtract}": "-",
    "{numpadadd}": "+",
    "{numpadenter}": "↵",
  }
};

// Name, Author, Description
// Sound Files
// Sources
// Keys

function SourceListItem({ name, press, release }) {
  const secondaryText = (press && release) ? `${press}, ${release}` : `${press}` || `${release}`;

  const typeVariant = press && release ? "filled" : "outlined";
  const typeLabel = press && release ? "Press & Release" : "Press Only";
  const typeDescription = press && release ? "Distinct press and release sounds" : "Single press sound";

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Tooltip title={typeDescription} placement="top" arrow>
            <Chip sx={{ mr: 1 }} size="small" label={typeLabel} variant={typeVariant} color="primary" />
          </Tooltip>

          <Tooltip title="Listen" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Source" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      }
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: "background.default",
        pl: 2,
      }}
    >
      <ListItemText
        primary={(
          <Typography variant="body1">
            {name}
          </Typography>
        )}
        secondary={secondaryText}
        secondaryTypographyProps={{
          noWrap: true,
          variant: "caption",
          style: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 'calc(100vw - 275px)',
          }
        }}
      />
    </ListItem>
  )
}

function Editor() {
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [manageSourcesOpen, setManageSourcesOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Dialog open={profileDetailsOpen} fullWidth>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}>
            <Typography variant="h6">Profile Details</Typography>
            <IconButton onClick={() => setProfileDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField label="Profile Name" size="small" sx={{ mb: 2 }} />
          <TextField label="Author" size="small" sx={{ mb: 2 }} />
          <TextField label="Description" size="small" multiline rows={5} />
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3, }}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <Dialog open={manageSourcesOpen} fullWidth>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}>
            <Typography variant="h6">Manage Sources</Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} sx={{ mr: 1 }} onClick={() => setAddSourceOpen(true)}>
                Add Source
              </Button>
              <IconButton onClick={() => setManageSourcesOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <TextField label="Search" size="small" sx={{ mb: 1 }} InputProps={{
            endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
          }} />
          <Box sx={{ 
            overflow: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}>
            {/* Make the list have a max height */}
            <List>
              {([...Array(20)].map((_, i) => {
                const name = `source${i}`;

                const isPressAndRelease = Math.random() > 0.5;
                const press = `press${i}.mp3`;
                const release = isPressAndRelease ? `release${i}.mp3` : null;

                return (
                  <SourceListItem key={i} name={name} press={press} release={release} />
                )
              }))}
            </List>
          </Box>
        </Box>
      </Dialog>

      <Dialog open={addSourceOpen}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}>
            <Typography variant="h6">Add Source</Typography>
            <IconButton onClick={() => setAddSourceOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField placeholder="Name" size="small" />
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            alignItems: 'center',
            mt: 1,
            p: 1,
          }}>
            <Typography variant="body2" color="GrayText">
              Select a press sound...
            </Typography>

            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
            >
              Select
            </Button>
          </Box>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '400px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            alignItems: 'center',
            mt: 1,
            p: 1,
          }}>
            <Typography variant="body2" color="GrayText">
              Select a release sound...
            </Typography>

            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Typography variant="body2" color="GrayText">
                (optional)
              </Typography>
              <Button
                startIcon={<FileOpenIcon />}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              >
                Select
              </Button>
            </Box>
          </Box>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3, }}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Card
          sx={{
            display: "flex",
            flexDirection: "column",
            ml: 2,
            mr: 2,
            mt: 2,
            pl: 2,
            pr: 2,
            pt: 2, 
            pb: 2,
            width: '100%',
            maxWidth: '1152px',
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Typography variant="h6">Keyboard Sounds Editor</Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Tooltip placement="bottom-start" title="View Profile YAML" arrow>
                <IconButton onClick={() => {}}>
                  <CodeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip placement="bottom-start" title="Help" arrow>
                <IconButton onClick={() => {}}>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 2 }} />
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            display: "flex",
            flexDirection: "column",
            ml: 2,
            mr: 2,
            mt: 2,
            pl: 2,
            pr: 2,
            pt: 2, 
            pb: 2,
            alignItems: 'center',
            maxWidth: '1152px',
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            mb: 1,
            width: '100%',
            maxWidth: '1120px',
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Select size="small" sx={{ mr: 1 }} value="1">
                <MenuItem value="1" selected>Audio Source 1</MenuItem>
                <MenuItem value="2">Audio Source 2</MenuItem>
                <MenuItem value="3">Audio Source 3</MenuItem>
              </Select>
              <Button variant="outlined" startIcon={<CheckCircleIcon />}>
                Apply
              </Button>
              <Divider orientation="vertical" flexItem sx={{ ml: 2, mr: 2 }} variant="middle" />
              <Button variant="text" color="warning">
                Clear Selection
              </Button>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Button variant="outlined" sx={{ mr: 1 }} startIcon={<GraphicEqIcon />} color="info" onClick={() => setManageSourcesOpen(true)}>
                Manage Sources
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />} color="info" onClick={() => setProfileDetailsOpen(true)}>
                Profile Details
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mt: 1, mb: 2, ml: 1, mr: 1 }} flexItem />
          <div className={"keyboardContainer"}>
            <Keyboard 
            baseClass={"simple-keyboard-main"}
              {...keyboardOptions} 
              theme={"hg-theme-default myTheme1"} 
            />
            <div className="controlArrows">
              <Keyboard
                baseClass={"simple-keyboard-control"}
                theme={"hg-theme-default myTheme1"}
                {...keyboardControlPadOptions}
              />
              <Keyboard
                baseClass={"simple-keyboard-arrows"}
                theme={"hg-theme-default myTheme1"}
                {...keyboardArrowsOptions}
              />
            </div>
            <div className="numPad">
              <Keyboard
                baseClass={"simple-keyboard-numpad"}
                theme={"hg-theme-default myTheme1"}
                {...keyboardNumPadOptions}
              />
              <Keyboard
                baseClass={"simple-keyboard-numpadEnd"}
                theme={"hg-theme-default myTheme1"}
                {...keyboardNumPadEndOptions}
              />
            </div>
          </div>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

export default Editor;