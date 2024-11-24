import "./index.css";

import React from "react";

import { useState, useEffect, useRef } from "react";

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
import WarningIcon from '@mui/icons-material/Warning';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteIcon from '@mui/icons-material/Delete';

import { execute } from './execute';

import Card from "@mui/material/Card";
import { Typography, Box, Tooltip, IconButton, TextField, List, ListItem, Button, Select, MenuItem, Divider, Dialog, InputAdornment, ListItemText, Chip, Paper, Checkbox } from "@mui/material";

import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

import { CopyBlock, solarizedDark } from 'react-code-blocks';

const sampleYaml = `profile:
  name: Example
  author: Your Name
  description: Describe your profile

sources:
  - id: key1
    source: sound1.wav
  - id: key2
    source:
      press: sound2.wav
      release: sound3.wav

keys:
  default: [ key1, key2 ]

  other:
    - sound: key1
      keys: [ backspace, delete ]`;

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
    "{space}": "space",
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
  },
  buttonTheme: [],
};

const keyboardControlPadOptions = {
  syncInstanceInputs: true,
  mergeDisplay: true,
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
  },
  buttonTheme: [],
};

const keyboardArrowsOptions = {
  syncInstanceInputs: true,
  mergeDisplay: true,
  buttonTheme: [],
  layout: {
    default: ["{arrowup}", "{arrowleft} {arrowdown} {arrowright}"]
  }
};

const keyboardNumPadOptions = {
  syncInstanceInputs: true,
  mergeDisplay: true,
  buttonTheme: [],
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
  syncInstanceInputs: true,
  mergeDisplay: true,
  buttonTheme: [],
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

function SourceListItem({ name, press, release, isDefault }) {
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
            {name} {isDefault && <Typography variant="caption" color="text.secondary">(default)</Typography>}
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

function AssignedSourceListItem({ name, press, release, isDefault, onDelete }) {
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

          <Tooltip title="Remove Source" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }} onClick={() => onDelete()}>
              <DeleteIcon />
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
            {name} {isDefault && <Typography variant="caption" color="text.secondary">(default)</Typography>}
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
  const [assignedSourceKey, setAssignedSourceKey] = useState(null);
  const [editAssignedSourcesOpen, setEditAssignedSourcesOpen] = useState(false);

  const showEditAssignedSources = (key) => {
    setAssignedSourceKey(key);
    setEditAssignedSourcesOpen(true);
  };

  const [viewYamlOpen, setViewYamlOpen] = useState(false);

  const [profileName, setProfileName] = useState("new-profile");
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(0);

  const keyboardRef = useRef(null);

  const [keyConfigs, setKeyConfigs] = useState([
    // { key: 'a', source: 'source1', },
  ]);

  const updateKeyboardConfigs = () => {
    console.log('keyConfigs', keyConfigs);
    const countsPerKey = Object.values(
      keyConfigs.reduce((acc, { key }) => {
          if (!acc[key]) {
              acc[key] = { key, count: 0 };
          }
          acc[key].count += 1;
          return acc;
      }, {})
    );
    console.log('countsPerKey', countsPerKey);

    const allKeys = keyboardRef.current.querySelectorAll(".hg-button");
    for (const key of allKeys) {
      const badge = key.querySelector(".badge");

      const k = key.getAttribute("data-skbtn");
      
      const [ keyCount ] = countsPerKey.filter(kc => kc.key === k);

      if (keyCount === undefined) {
        if (badge) {
          badge.remove();
        }
        key.style.position = 'initial';
        key.classList.remove('keyAssigned');
        continue;
      }

      key.style.position = 'relative';
      key.classList.add('keyAssigned');

      const count = keyCount.count;
      if (count > 0) {
        if (!badge) {
          // Add a badge to the key
          const badge = document.createElement("div");
          badge.classList.add("badge");
          badge.innerText = count;
          key.appendChild(badge);
          badge.addEventListener("pointerdown", function(e) {
            e.stopImmediatePropagation();
            showEditAssignedSources(key.getAttribute("data-skbtn"));
          });
        } else {
          badge.innerText = count;
        }
      }
    };
  };

  const addKeyConfig = (sourceIdx) => {
    const newBatch = [];
    for(const key of selectedKeys) {
      newBatch.push({ key, source: sourceIdx });
    }
    setKeyConfigs([...keyConfigs, ...newBatch]);
    setSelectedKeys([]);
  };

  useEffect(() => {
    updateKeyboardConfigs();
  }, [keyConfigs]);

  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [manageSourcesOpen, setManageSourcesOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [keyboardOptionsFinal, setKeyboardOptionsFinal] = useState(keyboardOptions);
  const [keyboardControlPadOptionsFinal, setKeyboardControlPadOptionsFinal] = useState(keyboardControlPadOptions);
  const [keyboardArrowsOptionsFinal, setKeyboardArrowsOptionsFinal] = useState(keyboardArrowsOptions);
  const [keyboardNumPadOptionsFinal, setKeyboardNumPadOptionsFinal] = useState(keyboardNumPadOptions);
  const [keyboardNumPadEndOptionsFinal, setKeyboardNumPadEndOptionsFinal] = useState(keyboardNumPadEndOptions);

  const [selectedKeys, setSelectedKeys] = useState([]);

  const [editProfileName, setEditProfileName] = useState(profileName);

  const toggleKeySelected = (key) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter(k => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const clearSelectedKeys = () => {
    setSelectedKeys([]);
  };

  useEffect(() => {
    console.log('selectedKeys', selectedKeys);
    
    const themes = {
      buttonTheme: [],
    };

    if(selectedKeys.length > 0) {
      themes.buttonTheme.push({
        class: "keySelected",
        buttons: selectedKeys.join(" "),
      });
    }

    setKeyboardOptionsFinal({
      ...keyboardOptions,
      ...themes,
    });

    setKeyboardControlPadOptionsFinal({
      ...keyboardControlPadOptions,
      ...themes,
    });

    setKeyboardArrowsOptionsFinal({
      ...keyboardArrowsOptions,
      ...themes,
    });

    setKeyboardNumPadOptionsFinal({
      ...keyboardNumPadOptions,
      ...themes,
    });

    setKeyboardNumPadEndOptionsFinal({
      ...keyboardNumPadEndOptions,
      ...themes,
    });
  }, [selectedKeys]);

  const onKeyPress = (key) => {
    toggleKeySelected(key);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Dialog open={viewYamlOpen} fullWidth>
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
            <Typography variant="h6">View Profile YAML</Typography>
            <IconButton onClick={() => setViewYamlOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <CopyBlock
            text={sampleYaml}
            language={"yaml"}
            showLineNumbers={false}
            customStyle={{
              padding: '16px',
            }}
            theme={{...solarizedDark, backgroundColor: '#121212'}}
          />
        </Box>
      </Dialog>

      <Dialog open={editAssignedSourcesOpen} fullWidth>
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
            <Typography variant="h6">Assigned Sources</Typography>
            <IconButton onClick={() => setEditAssignedSourcesOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

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
              {keyConfigs.filter(cfg => cfg.key == assignedSourceKey).map(cfg => {return {cfg, source: sources[cfg.source]}}).map(({cfg, source}) =>
                <AssignedSourceListItem
                  key={source.name}
                  name={source.name}
                  press={source.pressSound.replace(/\\/g, "/").split("/").pop()}
                  release={source.pressSound && source.releaseSound ? source.releaseSound.replace(/\\/g, "/").split("/").pop() : null}
                  isDefault={source.isDefault}
                  onDelete={() => {
                    const shouldClose = keyConfigs.filter(kc => kc.key == assignedSourceKey).length == 1;
                    setKeyConfigs(keyConfigs.filter(kc => kc.key != assignedSourceKey || kc.source != cfg.source));
                    if (shouldClose) {
                      setEditAssignedSourcesOpen(false);
                    }
                  }
                } />
              )}
            </List>
          </Box>
        </Box>
      </Dialog>

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
          <TextField label="Profile Name" size="small" sx={{ mb: 2 }} value={editProfileName} onChange={(e) => setEditProfileName(e.target.value)} />
          <TextField label="Author" size="small" sx={{ mb: 2 }} />
          <TextField label="Description" size="small" multiline rows={5} />
          <Button
            fullWidth
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3, }}
            disabled={!(() => {
              // make sure profile name only contains alphanumeric characters, dashes, underscores and no spaces.
              const regex = /^[a-zA-Z0-9-_]+$/;
              return regex.test(editProfileName);
            })()}
            onClick={() => {
              setProfileName(editProfileName)
              setProfileDetailsOpen(false);
            }}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <ManageSourcesDialog open={manageSourcesOpen} onClose={() => setManageSourcesOpen(false)} onAddSource={() => setAddSourceOpen(true)} sources={sources} />

      <AddSourceDialog open={addSourceOpen} onClose={() => setAddSourceOpen(false)} onSourceAdded={(source) => {
        setSources([...sources, source]);
        setAddSourceOpen(false);
      }} />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

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
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Typography variant="h6">Keyboard Sounds Editor</Typography>
              <Divider orientation="vertical" flexItem sx={{ ml: 2, mr: 2 }} variant="middle" />
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'background.default',
                pl: 1.5,
                pr: 1,
                py: 0.5,
                borderRadius: 3,
              }}>
                <Typography variant="body1" sx={{ mr: 1, color: '#388e3c', fontWeight: 'bold' }}>
                  {profileName}*
                </Typography>
                <Tooltip placement="bottom-start" title="Edit profile name" arrow>
                  <IconButton size="small" onClick={() => {
                    setEditProfileName(profileName);
                    setProfileDetailsOpen(true)
                  }}>
                    <EditNoteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              {/* <Tooltip placement="bottom-start" title="Up to date" arrow>
                  <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
              </Tooltip> */}
              <Tooltip placement="bottom-start" title="Unsaved Changes" arrow>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 1 }} variant="middle" />
              <Tooltip placement="bottom-start" title="View Profile YAML" arrow>
                <IconButton onClick={() => setViewYamlOpen(true)}>
                  <CodeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip placement="bottom-start" title="Help" arrow>
                <IconButton onClick={() => setHelpOpen(true)}>
                  <HelpIcon />
                </IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 2 }} variant="middle" />
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
            mb: 1,
            width: '100%',
            maxWidth: '1120px',
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Select size="small" sx={{ mr: 1 }} value={selectedSource} onChange={e => setSelectedSource(e.target.value)} disabled={selectedKeys.length === 0}>
                {sources.map((source, idx) => (
                  <MenuItem value={idx} selected={selectedSource === idx}>{source.name}</MenuItem>
                ))}
              </Select>
              <Button variant="outlined" startIcon={<CheckCircleIcon />} onClick={() => addKeyConfig(selectedSource)} disabled={selectedKeys.length === 0}>
                Apply
              </Button>
              <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                visibility: selectedKeys.length > 0 ? 'visible' : 'hidden',
              }}>
                <Divider orientation="vertical" flexItem sx={{ ml: 2, mr: 2 }} variant="middle" />
                <Button variant="text" color="warning" onClick={() => clearSelectedKeys()}>
                  Clear Selection
                </Button>
              </Box>
            </Box>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Button variant="outlined" sx={{ mr: 1 }} startIcon={<GraphicEqIcon />} color="info" onClick={() => setManageSourcesOpen(true)}>
                Manage Sources
              </Button>
              <Button variant="outlined" startIcon={<SettingsIcon />} color="info" onClick={() => {
                setEditProfileName(profileName);
                setProfileDetailsOpen(true)
              }}>
                Profile Details
              </Button>
            </Box>
          </Box>
          <Divider sx={{ mt: 1, mb: 2 }} flexItem />

          <div ref={keyboardRef} className={"keyboardContainer"}>
            <Keyboard 
            onRender={() => updateKeyboardConfigs()}
            onKeyPress={onKeyPress}
            baseClass={"simple-keyboard-main"}
            {...keyboardOptionsFinal} 
            theme={"hg-theme-default myTheme1"} 
            />
            <div className="controlArrows">
              <Keyboard
                onRender={() => updateKeyboardConfigs()}
                {...keyboardControlPadOptionsFinal}
                onKeyPress={onKeyPress}
                baseClass={"simple-keyboard-control"}
                theme={"hg-theme-default myTheme1"}
              />
              <Keyboard
                onRender={() => updateKeyboardConfigs()}
                {...keyboardArrowsOptionsFinal}
                onKeyPress={onKeyPress}
                baseClass={"simple-keyboard-arrows"}
                theme={"hg-theme-default myTheme1"}
              />
            </div>
            <div className="numPad">
              <Keyboard
                onRender={() => updateKeyboardConfigs()}
                {...keyboardNumPadOptionsFinal}
                onKeyPress={onKeyPress}
                baseClass={"simple-keyboard-numpad"}
                theme={"hg-theme-default myTheme1"}
              />
              <Keyboard
                onRender={() => updateKeyboardConfigs()}
                {...keyboardNumPadEndOptionsFinal}
                onKeyPress={onKeyPress}
                baseClass={"simple-keyboard-numpadEnd"}
                theme={"hg-theme-default myTheme1"}
              />
            </div>
          </div>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

function AddSourceDialog({ open, onClose, onSourceAdded }) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  const [pressSound, setPressSound] = useState(null);
  const [releaseSound, setReleaseSound] = useState(null);

  const selectPressSound = () => {
    execute("selectAudioFile").then((path) => {
      if (path) {
        setPressSound(path);
      }
    });
  };

  const selectReleaseSound = () => {
    execute("selectAudioFile").then((path) => {
      if (path) {
        setReleaseSound(path);
      }
    });
  };

  return (
    <Dialog open={open}>
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
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
        <TextField placeholder="Name" size="small" value={name} onChange={(e) => setName(e.target.value)} />
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
          <Typography variant="body2" color="GrayText" noWrap sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 250px)",
          }}>
            {pressSound || "Select a press sound..."}
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
              onClick={() => selectPressSound()}
            >
              Select
            </Button>
          </Box>
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
          <Typography variant="body2" color="GrayText" noWrap sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 250px)",
          }}>
            {releaseSound || "Select a release sound..."}
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
              onClick={() => selectReleaseSound()}
            >
              Select
            </Button>
          </Box>
        </Box>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          mt: 1,
          alignItems: 'center',
        }}>
          <Tooltip title="This source will be included in the default sources used for keys that do not have a specific source set." placement="top" arrow followCursor>
            <Typography variant="body">
              Add to default sources
            </Typography>
          </Tooltip>
          <Checkbox checked={isDefault} onChange={(e, c) => setIsDefault(c)} />
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{ mt: 3, }}
          onClick={() => {
            onSourceAdded({name, isDefault, pressSound, releaseSound});
            setName("");
            setIsDefault(true);
            setPressSound(null);
            setReleaseSound(null);
          }}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  )
}

function HelpDialog({ open, onClose }) {
  return (
    <Dialog open={open}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 200px)',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}>
          <Typography variant="h6">Keyboar Sounds Editor - Help</Typography>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Paper sx={{ 
          p: 2,
          mb: 2,
          height: '100%',
        }}>
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            How it Works
          </Typography>
          <Typography variant="body1">
            Keyboard Sounds Editor is a tool for creating and editing keyboard sound profiles. It allows you to easily add and manage audio sources, as well as apply them to different keys on the keyboard.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            Manage Sources
          </Typography>
          <Typography variant="body1">
            To get started, click the "Manage Sources" button in the top right corner of the editor. This will open a dialog where you can add, edit, and manage audio sources.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Add the audio sources you intend to assign by clicking the "Add Source" button and providing the audio files you want to use.
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }} color="HighlightText">
            Assign to Keys
          </Typography>
          <Typography variant="body1">
            Once you have added sources, you can apply them to different keys on the keyboard.
            <ol>
              <li>Select the keys you want to apply the sources to</li>
              <li>Select the audio source you want to apply to them.</li>
              <li>Click the "Apply" button</li>
            </ol>
            <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
              This will apply the selected sources to the selected keys.
            </Typography>
          </Typography>
        </Paper>
      </Box>
    </Dialog>
  );
}

function ManageSourcesDialog({ open, onClose, onAddSource, sources }) {
  const [search, setSearch] = useState("");

  return (
    <Dialog open={open} fullWidth>
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
            <Button variant="outlined" size="small" startIcon={<AddIcon />} sx={{ mr: 1 }} onClick={() => onAddSource()}>
              Add Source
            </Button>
            <IconButton onClick={() => onClose()}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <TextField label="Search" size="small" sx={{ mb: 1 }} InputProps={{
          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
        }} value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {(sources.filter(source => search === "" || source.name.toLowerCase().includes(search.toLowerCase())).map(source => {
              const name = source.name;

              const isPressAndRelease = source.pressSound && source.releaseSound;
              const press = source.pressSound.replace(/\\/g, "/").split("/").pop();
              const release = isPressAndRelease ? source.releaseSound.replace(/\\/g, "/").split("/").pop() : null;

              return (
                <SourceListItem key={source.name} name={name} press={press} release={release} isDefault={source.isDefault} />
              )
            }))}
          </List>
        </Box>
      </Box>
    </Dialog>
  );
}

export default Editor;