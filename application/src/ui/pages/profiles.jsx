import React, { useState, useEffect } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import IosShareIcon from '@mui/icons-material/IosShare';
import FileOpenIcon from '@mui/icons-material/FileOpenOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Chip, CircularProgress, Link } from "@mui/material";
import { execute } from "../execute";
import { Buffer } from "buffer";

function ProfileListItem({ statusLoaded, status, profile: { name, author, description, device }, onExport, isActive, selectedKeyboardProfile, selectedMouseProfile }) {  
  const [isDeleting, setIsDeleting] = useState(false);

  const activeKeyboard = statusLoaded && status && status.profile === name;
  const activeMouse = statusLoaded && status && status.mouse_profile === name;
  const selectedKeyboard = name === selectedKeyboardProfile;
  const selectedMouse = name === selectedMouseProfile;

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {(activeKeyboard || selectedKeyboard) && (
            <Chip sx={{ mr: 1 }} size="small" label="Active" variant="filled" color="success" />
          )}
          {(activeMouse || selectedMouse) && (
            <Chip sx={{ mr: 1 }} size="small" label="Active" variant="filled" color="success" />
          )}
          <Tooltip title="Export & Share" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }} onClick={onExport}>
              <IosShareIcon />
            </IconButton>
          </Tooltip>

          {isDeleting && (
            <CircularProgress size={18} sx={{mr: 2, ml: 1}} />
          )}

          {!isDeleting && !isActive && (
            <Tooltip title="Delete Profile" placement="top" arrow>
                <IconButton
                  color="primary"
                  sx={{ mr: 1 }}
                  onClick={() => {
                    setIsDeleting(true);
                    execute(`remove-profile --name "${name}"`, (_) => {
                      setIsDeleting(false);
                    });
                  }}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
            </Tooltip>
          )}
        </Box>
      }
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: "background.default",
        pl: 2,
      }}
    >
      <Tooltip followCursor title={(
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Typography variant="body1">
            {name} <Typography variant="caption" color="text.secondary">by <i>{author}</i></Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
      )}>
      <ListItemText
        primary={(
          <Typography variant="body1" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            {device === 'mouse' ? <MouseIcon sx={{ mr: 1, fontSize: '1.00rem' }} size="small" /> : <KeyboardIcon sx={{ mr: 1, fontSize: '1.25rem' }} size="small" />}
            {name}
          </Typography>
        )}
        secondary={description}
        secondaryTypographyProps={{
          noWrap: true,
          variant: "caption",
          style: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 'calc(100vw - 275px)',
            marginTop: '4px',
          }
        }}
      />
      </Tooltip>
    </ListItem>
  );
}

const Profiles = ({statusLoaded, status, profilesLoaded, profiles, selectedKeyboardProfile, selectedMouseProfile}) => {
  const [profileSearchValue, setProfileSearchValue] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersAnchorEl, setFiltersAnchorEl] = useState(null);
  const [filterKeyboard, setFilterKeyboard] = useState(true);
  const [filterMouse, setFilterMouse] = useState(true);
  const [exportProfileDialogOpen, setExportProfileDialogOpen] = useState(false);
  const [exportPath, setExportPath] = useState("");
  const [exportingProfile, setExportingProfile] = useState(false);
  const [profileToExport, setProfileToExport] = useState("");
  const [selectTypeDialogOpen, setSelectTypeDialogOpen] = useState(false);
  const [createMouseDialogOpen, setCreateMouseDialogOpen] = useState(false);
  const [savingMouseProfile, setSavingMouseProfile] = useState(false);
  const [mouseProfileName, setMouseProfileName] = useState("");
  const [mouseProfileAuthor, setMouseProfileAuthor] = useState("");
  const [mouseProfileDescription, setMouseProfileDescription] = useState("");
  const [mouseLeftPress, setMouseLeftPress] = useState("");
  const [mouseLeftRelease, setMouseLeftRelease] = useState("");
  const [mouseRightPress, setMouseRightPress] = useState("");
  const [mouseRightRelease, setMouseRightRelease] = useState("");
  const [mouseMiddlePress, setMouseMiddlePress] = useState("");
  const [mouseMiddleRelease, setMouseMiddleRelease] = useState("");
  const [mouseDefaultPress, setMouseDefaultPress] = useState("");
  const [mouseDefaultRelease, setMouseDefaultRelease] = useState("");

  useEffect(() => {
    if (!exportProfileDialogOpen) {
      setExportPath("");
    }
  }, [exportProfileDialogOpen]);

  const selectExportPath = () => {
    execute(`selectExportPath ${profileToExport}`).then((path) => {
      if (path) {
        setExportPath(path);
      }
    });
  };

  const exportProfile = () => {
    if (exportPath === "") {
      return;
    }

    setExportingProfile(true);
    execute(`export-profile --name "${profileToExport}" --output "${exportPath}"`)
      .then(() => {
        setExportingProfile(false);
        setExportProfileDialogOpen(false);
        setProfileToExport("");
      });
  };

  const fileNameOnly = (p) => (p || "").replace(/\\/g, "/").split("/").pop();

  const clearMouseProfileState = () => {
    setMouseProfileName("");
    setMouseProfileAuthor("");
    setMouseProfileDescription("");
    setMouseDefaultPress("");
    setMouseDefaultRelease("");
    setMouseLeftPress("");
    setMouseLeftRelease("");
    setMouseRightPress("");
    setMouseRightRelease("");
    setMouseMiddlePress("");
    setMouseMiddleRelease("");
  };

  const saveMouseProfile = async () => {
    // New validation logic: if default is provided, no other files required
    // If no default, at least one press is required
    const hasDefault = mouseDefaultPress !== '';
    const hasAtLeastOnePress = mouseLeftPress !== '' || mouseRightPress !== '' || mouseMiddlePress !== '';
    const canSave = 
      mouseProfileName !== '' && mouseProfileAuthor !== '' && mouseProfileDescription !== '' &&
      (hasDefault || hasAtLeastOnePress);
    if (!canSave || savingMouseProfile) {
      return;
    }

    setSavingMouseProfile(true);
    try {
      const profileYaml = {
        profile: {
          name: mouseProfileName,
          author: mouseProfileAuthor,
          description: mouseProfileDescription,
          device: 'mouse',
        },
        sources: [
          ...(mouseDefaultPress ? [{
            id: 'click_default',
            source: {
              press: fileNameOnly(mouseDefaultPress),
              ...(mouseDefaultRelease ? { release: fileNameOnly(mouseDefaultRelease) } : {}),
            },
          }] : []),
          ...(mouseLeftPress ? [{
            id: 'click_left',
            source: {
              press: fileNameOnly(mouseLeftPress),
              ...(mouseLeftRelease ? { release: fileNameOnly(mouseLeftRelease) } : {}),
            },
          }] : []),
          ...(mouseRightPress ? [{
            id: 'click_right',
            source: {
              press: fileNameOnly(mouseRightPress),
              ...(mouseRightRelease ? { release: fileNameOnly(mouseRightRelease) } : {}),
            },
          }] : []),
          ...(mouseMiddlePress ? [{
            id: 'click_middle',
            source: {
              press: fileNameOnly(mouseMiddlePress),
              ...(mouseMiddleRelease ? { release: fileNameOnly(mouseMiddleRelease) } : {}),
            },
          }] : []),
        ],
        buttons: {
          default: mouseDefaultPress ? 'click_default' : (mouseLeftPress ? 'click_left' : 'click_right'),
          other: [
            ...(mouseLeftPress ? [{ sound: 'click_left', buttons: ['left'] }] : []),
            ...(mouseRightPress ? [{ sound: 'click_right', buttons: ['right'] }] : []),
            ...(mouseMiddlePress ? [{ sound: 'click_middle', buttons: ['middle'] }] : []),
          ],
        },
      };

      const uniqueSources = [
        mouseDefaultPress,
        mouseDefaultRelease,
        mouseLeftPress,
        mouseLeftRelease,
        mouseRightPress,
        mouseRightRelease,
        mouseMiddlePress,
        mouseMiddleRelease,
      ].filter((p) => typeof p === 'string' && p.length > 0);

      const payload = Buffer.from(
        JSON.stringify({
          profileYaml,
          sources: [...new Set(uniqueSources)],
        })
      ).toString('base64');

      await execute(`finalizeProfileEdit ${payload}`);

      // Reset and close
      setCreateMouseDialogOpen(false);
      clearMouseProfileState();
    } catch (e) {
      // Optionally, we could surface an error dialog in this page later
      console.error('Failed to save mouse profile:', e);
    } finally {
      setSavingMouseProfile(false);
    }
  };

  const filtersApplied = !(filterKeyboard && filterMouse);

  return (
    <Box sx={{
      ml: 2,
      mt: 2,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      {/* Select Profile Type Dialog */}
      <Dialog open={selectTypeDialogOpen} onClose={() => setSelectTypeDialogOpen(false)}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          minWidth: 360,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography variant="h6">Select a Profile Type to Create</Typography>
            <IconButton onClick={() => setSelectTypeDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mt: 2,
          }}>
            <Button
              variant="contained"
              onClick={() => {
                execute("showEditorWindow");
                setSelectTypeDialogOpen(false);
              }}
              sx={{ width: '100%', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <KeyboardIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1">Keyboard</Typography>
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setSelectTypeDialogOpen(false);
                setCreateMouseDialogOpen(true);
              }}
              sx={{ width: '100%', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <MouseIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1">Mouse</Typography>
            </Button>
          </Box>
        </Box>
      </Dialog>

             {/* Create Mouse Profile Dialog */}
       <Dialog open={createMouseDialogOpen} onClose={() => {
         setCreateMouseDialogOpen(false);
         clearMouseProfileState();
       }} fullWidth maxWidth="sm">
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          maxHeight: '720px',
          overflowY: 'auto',
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <MouseIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Create Mouse Profile</Typography>
            </Box>
                         <IconButton onClick={() => {
               setCreateMouseDialogOpen(false);
               clearMouseProfileState();
             }}>
              <CloseIcon />
            </IconButton>
          </Box>
          {/* Details Section */}
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', mt: 1, mb: 1 }}
          >
            Details
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            <TextField
              label="Name"
              size="small"
              required
              value={mouseProfileName}
              onChange={(e) => setMouseProfileName((e.target.value || '').replace(/\r?\n/g, ' '))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
            />
            <TextField
              label="Author"
              size="small"
              required
              value={mouseProfileAuthor}
              onChange={(e) => setMouseProfileAuthor((e.target.value || '').replace(/\r?\n/g, ' '))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
            />
          </Box>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Description"
              size="small"
              multiline
              required
              minRows={2}
              fullWidth
              value={mouseProfileDescription}
              onChange={(e) => setMouseProfileDescription((e.target.value || '').replace(/\r?\n/g, ' '))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
            />
          </Box>

          {/* Files Section */}
          <Typography
            variant="body1"
            sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}
          >
            Files
          </Typography>

          {/* Default Section */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Default</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                             {/* Press */}
                               <Button
                  variant={mouseDefaultPress ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    if (mouseDefaultPress) {
                      setMouseDefaultPress("");
                    } else {
                      execute('selectAudioFile').then((result) => {
                        if (typeof result === 'string' && result.length > 0) {
                          setMouseDefaultPress(result);
                        }
                      });
                    }
                  }}
                  sx={{ 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    display: 'inline-flex',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <Tooltip
                    placement="top"
                    arrow
                    title={
                      mouseDefaultPress
                        ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption">Click To Change</Typography>
                            <Typography variant="caption">{mouseDefaultPress}</Typography>
                          </Box>
                        )
                        : 'Select Audio File'
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {mouseDefaultPress ? <CheckCircleIcon sx={{ fontSize: 18, mr: 1 }} /> : <GraphicEqIcon sx={{ fontSize: 18, mr: 1 }} />}
                      <Typography variant="body2">Press</Typography>
                    </Box>
                  </Tooltip>
                  {mouseDefaultPress && (
                    <Tooltip title="Clear" placement="top" arrow>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </Box>
                    </Tooltip>
                  )}
                </Button>

                             {/* Release */}
                               <Button
                  variant={mouseDefaultRelease ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => {
                    if (mouseDefaultRelease) {
                      setMouseDefaultRelease("");
                    } else {
                      execute('selectAudioFile').then((result) => {
                        if (typeof result === 'string' && result.length > 0) {
                          setMouseDefaultRelease(result);
                        }
                      });
                    }
                  }}
                  sx={{ 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    display: 'inline-flex',
                    width: '100%',
                    textAlign: 'left'
                  }}
                >
                  <Tooltip
                    placement="top"
                    arrow
                    title={
                      mouseDefaultRelease
                        ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption">Click To Change</Typography>
                            <Typography variant="caption">{mouseDefaultRelease}</Typography>
                          </Box>
                        )
                        : 'Select Audio File'
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {mouseDefaultRelease ? <CheckCircleIcon sx={{ fontSize: 18, mr: 1 }} /> : <GraphicEqIcon sx={{ fontSize: 18, mr: 1 }} />}
                      <Typography variant="body2">Release</Typography>
                    </Box>
                  </Tooltip>
                  {mouseDefaultRelease && (
                    <Tooltip title="Clear" placement="top" arrow>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          transition: 'background-color 0.2s',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </Box>
                    </Tooltip>
                  )}
                </Button>
            </Box>
          </Box>

          {[
            {
              title: 'Left',
              press: { value: mouseLeftPress, setter: setMouseLeftPress },
              release: { value: mouseLeftRelease, setter: setMouseLeftRelease },
            },
            {
              title: 'Right',
              press: { value: mouseRightPress, setter: setMouseRightPress },
              release: { value: mouseRightRelease, setter: setMouseRightRelease },
            },
            {
              title: 'Middle',
              press: { value: mouseMiddlePress, setter: setMouseMiddlePress },
              release: { value: mouseMiddleRelease, setter: setMouseMiddleRelease },
            },
          ].map(({ title, press, release }) => (
            <Box key={title} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                 {/* Press */}
                                   <Button
                    variant={press.value ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      if (press.value) {
                        press.setter("");
                      } else {
                        execute('selectAudioFile').then((result) => {
                          if (typeof result === 'string' && result.length > 0) {
                            press.setter(result);
                          }
                        });
                      }
                    }}
                    sx={{ 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      display: 'inline-flex',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <Tooltip
                      placement="top"
                      arrow
                      title={
                        press.value
                          ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="caption">Click To Change</Typography>
                              <Typography variant="caption">{press.value}</Typography>
                            </Box>
                          )
                          : 'Select Audio File'
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {press.value ? <CheckCircleIcon sx={{ fontSize: 18, mr: 1 }} /> : <GraphicEqIcon sx={{ fontSize: 18, mr: 1 }} />}
                        <Typography variant="body2">Press</Typography>
                      </Box>
                    </Tooltip>
                    {press.value && (
                      <Tooltip title="Clear" placement="top" arrow>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Button>

                                 {/* Release */}
                                   <Button
                    variant={release.value ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => {
                      if (release.value) {
                        release.setter("");
                      } else {
                        execute('selectAudioFile').then((result) => {
                          if (typeof result === 'string' && result.length > 0) {
                            release.setter(result);
                          }
                        });
                      }
                    }}
                    sx={{ 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      display: 'inline-flex',
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <Tooltip
                      placement="top"
                      arrow
                      title={
                        release.value
                          ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="caption">Click To Change</Typography>
                              <Typography variant="caption">{release.value}</Typography>
                            </Box>
                          )
                          : 'Select Audio File'
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {release.value ? <CheckCircleIcon sx={{ fontSize: 18, mr: 1 }} /> : <GraphicEqIcon sx={{ fontSize: 18, mr: 1 }} />}
                        <Typography variant="body2">Release</Typography>
                      </Box>
                    </Tooltip>
                    {release.value && (
                      <Tooltip title="Clear" placement="top" arrow>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Tooltip>
                    )}
                  </Button>
              </Box>
            </Box>
          ))}

          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', mt: 2 }}>
                         {(() => {
               // New validation logic: if default is provided, no other files required
               // If no default, at least one press is required
               const hasDefault = mouseDefaultPress !== '';
               const hasAtLeastOnePress = mouseLeftPress !== '' || mouseRightPress !== '' || mouseMiddlePress !== '';
               const canSave = 
                 mouseProfileName !== '' && mouseProfileAuthor !== '' && mouseProfileDescription !== '' &&
                 (hasDefault || hasAtLeastOnePress);
              return (
                <Tooltip
                  title={canSave ? 'Save Profile' : 'Provide either a default audio file or at least one button press sound'}
                  placement="left"
                  arrow
                >
                  <span>
                    <Button
                      variant="contained"
                      disabled={!canSave || savingMouseProfile}
                      onClick={saveMouseProfile}
                      startIcon={savingMouseProfile ? <CircularProgress size={14} /> : undefined}
                    >
                      {savingMouseProfile ? 'Saving…' : 'Save'}
                    </Button>
                  </span>
                </Tooltip>
              );
            })()}
          </Box>
        </Box>
      </Dialog>

      <Dialog open={exportProfileDialogOpen} fullWidth>
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
          }}>
            <Typography variant="h6">Export Profile</Typography>
            <IconButton onClick={() => setExportProfileDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body" sx={{ mt: 2 }}>
            Export To
          </Typography>
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
            {exportPath !== "" && (
              <Tooltip title={exportPath} followCursor>
                <Typography variant="body2" color="GrayText" noWrap sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "calc(100vw - 250px)",
                }}>
                  {exportPath}
                </Typography>
              </Tooltip>
            )}
            {exportPath === "" && (
              <Typography variant="body2" color="GrayText">
                Specify an export path...
              </Typography>
            )}

            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
              onClick={selectExportPath}
            >
              Select
            </Button>
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={
              exportingProfile ? (
                <CircularProgress size={18} />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ mt: 3, }}
            disabled={exportPath === "" || exportingProfile}
            onClick={exportProfile}
          >
            Save
          </Button>
        </Box>
      </Dialog>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          mr: 2,
          mb: 2,
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Typography variant="h6">Profiles</Typography>
          <Tooltip title={
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <Typography variant="body2">Community Profiles</Typography>
              <Typography variant="caption" color="text.secondary">Custom profiles are available for download and sharing in the <Link href="https://discord.gg/gysskqts6z" target="_blank">Discord Community</Link></Typography>
            </Box>
          } placement="bottom-end" arrow sx={{ ml: 1 }}>
            <InfoOutlinedIcon fontSize="14" />
          </Tooltip>
        </Box>
        <Box sx={{
          display: "flex",
          flexDirection: "row",
        }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setSelectTypeDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Create
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileOpenIcon />}
            onClick={() => execute("importProfile")}
          >
            Import
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" color="GrayText" sx={{ mb: 0.5, mt: 0.5, mr: 2 }}>
        Manage your sound profiles here. You can import, export, and delete profiles.
      </Typography>
      <Box sx={{ pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Search"
            size="small"
            sx={{
              mt: 1,
              mb: 1,
              flex: 1,
            }}
            value={profileSearchValue}
            onChange={(e) => setProfileSearchValue(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
            }}
          />
          <Tooltip title="Filter" placement="top" arrow>
            <IconButton
              sx={{ ml: 1, mt: 0.5 }}
              color={filtersApplied ? 'primary' : 'default'}
              onClick={(e) => { setFiltersAnchorEl(e.currentTarget); setFiltersOpen(true); }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={filtersAnchorEl}
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disableRipple>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={filterKeyboard}
                    disabled={!filterMouse && filterKeyboard}
                    onChange={(e) => {
                      const next = e.target.checked;
                      if (!next && !filterMouse) return; // prevent neither selected
                      setFilterKeyboard(next);
                    }}
                  />
                }
                label="Keyboard"
              />
            </MenuItem>
            <MenuItem disableRipple>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={filterMouse}
                    disabled={!filterKeyboard && filterMouse}
                    onChange={(e) => {
                      const next = e.target.checked;
                      if (!next && !filterKeyboard) return; // prevent neither selected
                      setFilterMouse(next);
                    }}
                  />
                }
                label="Mouse"
              />
            </MenuItem>
          </Menu>
        </Box>

        {filtersApplied && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Filters:</Typography>
            <Chip
              size="small"
              label={`Type: ${filterKeyboard && filterMouse ? 'All' : filterKeyboard ? 'Keyboard' : filterMouse ? 'Mouse' : 'None'}`}
              sx={{ mr: 1 }}
            />
            <Chip
              size="small"
              label="Clear"
              onClick={() => { setFilterKeyboard(true); setFilterMouse(true); }}
              onDelete={() => { setFilterKeyboard(true); setFilterMouse(true); }}
            />
          </Box>
        )}
      </Box>
      <List sx={{
        overflow: 'auto',
        pr: 2, 
        flex: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.07)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
      }}>
        {profilesLoaded && profiles
          .filter((p) => {
            const nameMatches = profileSearchValue === '' || p.name.toLowerCase().includes(profileSearchValue.toLowerCase());
            const device = (p.device || 'keyboard').toLowerCase();
            const typeMatches = (device === 'keyboard' && filterKeyboard) || (device === 'mouse' && filterMouse);
            return nameMatches && typeMatches;
          })
          .sort((a, b) => {
            // Check if profiles are active (either running in backend or selected in status)
            const aIsActive = (statusLoaded && status && (status.profile === a.name || status.mouse_profile === a.name)) ||
                             (a.name === selectedKeyboardProfile || a.name === selectedMouseProfile);
            const bIsActive = (statusLoaded && status && (status.profile === b.name || status.mouse_profile === b.name)) ||
                             (b.name === selectedKeyboardProfile || b.name === selectedMouseProfile);
            
            // Active profiles come first
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            
            // If both are active or both are inactive, sort alphabetically by name
            return a.name.localeCompare(b.name);
          })
          .map((profile) => {
            const isActive = (statusLoaded && status && (status.profile === profile.name || status.mouse_profile === profile.name)) ||
                            (profile.name === selectedKeyboardProfile || profile.name === selectedMouseProfile);
            return (
              <ProfileListItem 
                statusLoaded={statusLoaded}
                status={status}
                key={profile.name}
                profile={profile}
                onExport={() => {
                  setProfileToExport(profile.name);
                  setExportProfileDialogOpen(true);
                }}
                isActive={isActive}
                selectedKeyboardProfile={selectedKeyboardProfile}
                selectedMouseProfile={selectedMouseProfile}
              />
            );
          })}
      </List>
    </Box>
  );
};

export { Profiles };