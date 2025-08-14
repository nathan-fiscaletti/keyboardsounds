import React, { useState, useEffect } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
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
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Chip, CircularProgress, Link } from "@mui/material";
import { execute } from "../execute";
import { Buffer } from "buffer";

function ProfileListItem({ statusLoaded, status, profile: { name, author, description, device }, onExport }) {  
  const [isDeleting, setIsDeleting] = useState(false);

  const activeKeyboard = statusLoaded && status && status.profile === name;
  const activeMouse = statusLoaded && status && status.mouse_profile === name;

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {activeKeyboard && (
            <Chip sx={{ mr: 1 }} size="small" label="Active" variant="filled" color="success" />
          )}
          {activeMouse && (
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

          {!isDeleting && (
            <Tooltip title="Delete Profile" placement="top" arrow>
                <IconButton
                  color="primary"
                  sx={{ mr: 1 }}
                  disabled={activeKeyboard || activeMouse}
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

const Profiles = ({statusLoaded, status, profilesLoaded, profiles}) => {
  const [profileSearchValue, setProfileSearchValue] = useState('');
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

  const saveMouseProfile = async () => {
    const canSave =
      mouseLeftPress !== '' && mouseRightPress !== '' && mouseMiddlePress !== '' &&
      mouseProfileName !== '' && mouseProfileAuthor !== '' && mouseProfileDescription !== '';
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
          {
            id: 'click_left',
            source: {
              press: fileNameOnly(mouseLeftPress),
              ...(mouseLeftRelease ? { release: fileNameOnly(mouseLeftRelease) } : {}),
            },
          },
          {
            id: 'click_right',
            source: {
              press: fileNameOnly(mouseRightPress),
              ...(mouseRightRelease ? { release: fileNameOnly(mouseRightRelease) } : {}),
            },
          },
          {
            id: 'click_middle',
            source: {
              press: fileNameOnly(mouseMiddlePress),
              ...(mouseMiddleRelease ? { release: fileNameOnly(mouseMiddleRelease) } : {}),
            },
          },
        ],
        buttons: {
          default: 'click_left',
          other: [
            { sound: 'click_left', buttons: ['left'] },
            { sound: 'click_right', buttons: ['right'] },
            { sound: 'click_middle', buttons: ['middle'] },
          ],
        },
      };

      const uniqueSources = [
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
      setMouseProfileName("");
      setMouseProfileAuthor("");
      setMouseProfileDescription("");
      setMouseLeftPress("");
      setMouseLeftRelease("");
      setMouseRightPress("");
      setMouseRightRelease("");
      setMouseMiddlePress("");
      setMouseMiddleRelease("");
    } catch (e) {
      // Optionally, we could surface an error dialog in this page later
      console.error('Failed to save mouse profile:', e);
    } finally {
      setSavingMouseProfile(false);
    }
  };

  return (
    <Box sx={{
      ml: 2,
      mt: 2,
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
      <Dialog open={createMouseDialogOpen} onClose={() => setCreateMouseDialogOpen(false)} fullWidth maxWidth="sm">
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
            <IconButton onClick={() => setCreateMouseDialogOpen(false)}>
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
                  <Button
                    variant={press.value ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={press.value ? <CheckCircleIcon sx={{ fontSize: 18, verticalAlign: 'middle' }} /> : <GraphicEqIcon sx={{ fontSize: 18, verticalAlign: 'middle' }} />}
                    onClick={() => {
                      execute('selectAudioFile').then((result) => {
                        if (typeof result === 'string' && result.length > 0) {
                          press.setter(result);
                        }
                      });
                    }}
                    sx={{ justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}
                  >
                    Press *
                  </Button>
                </Tooltip>

                {/* Release */}
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
                  <Button
                    variant={release.value ? 'contained' : 'outlined'}
                    size="small"
                    startIcon={release.value ? <CheckCircleIcon sx={{ fontSize: 18, verticalAlign: 'middle' }} /> : <GraphicEqIcon sx={{ fontSize: 18, verticalAlign: 'middle' }} />}
                    onClick={() => {
                      execute('selectAudioFile').then((result) => {
                        if (typeof result === 'string' && result.length > 0) {
                          release.setter(result);
                        }
                      });
                    }}
                    sx={{ justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}
                  >
                    Release
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="GrayText">* = item is required</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', mt: 2 }}>
            {(() => {
              const canSave = mouseLeftPress !== '' && mouseRightPress !== '' && mouseMiddlePress !== '' && mouseProfileName !== '' && mouseProfileAuthor != '' && mouseProfileDescription !== '';
              return (
                <Tooltip
                  title={canSave ? 'Save Profile' : 'Select Required Files To Save'}
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
      <TextField
        label="Search"
        size="small"
        fullWidth
        sx={{
          mt: 1,
          mb: 1,
        }}
        value={profileSearchValue}
        onChange={
          e => setProfileSearchValue(e.target.value)
        }
        InputProps={{
          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
        }}
      />
      </Box>
      <List sx={{
        overflow: 'auto',
        pr: 2, 
        maxHeight: 'calc(100vh - 338px)',
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
        {profilesLoaded && profiles.filter(p => profileSearchValue === "" || p.name.toLowerCase().includes(profileSearchValue.toLowerCase())).map((profile) => (
          <ProfileListItem 
            statusLoaded={statusLoaded}
            status={status}
            key={profile.name}
            profile={profile}
            onExport={() => {
              setProfileToExport(profile.name);
              setExportProfileDialogOpen(true);
            }} />
        ))}
      </List>
    </Box>
  );
};

export { Profiles };