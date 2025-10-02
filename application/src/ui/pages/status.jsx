import React from "react";

import green from "@mui/material/colors/green";

import { Box, Typography, FormControl, Select, Slider, MenuItem, Tooltip, IconButton, Divider, Switch, TextField } from "@mui/material";

import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import InfoIcon from '@mui/icons-material/Info';

const Status = ({
    profilesKeyboardLoaded,
    profilesMouseLoaded,
    keyboardProfiles,
    mouseProfiles,
    selectedKeyboardProfile,
    selectedMouseProfile,
    displayVolume,
    onKeyboardProfileChanged,
    onMouseProfileChanged,
    onVolumeChanged,
    onDisplayVolumeChanged,
}) => {
  const tips = React.useMemo(() => [
    'Use Application Rules to enable or disable sounds based on the focused app.',
    'Create your own keyboard profiles with the built-in Editor from the Profiles page.',
    'Enable the Daemon Window in Settings if you need a visible audio source for OBS.',
    'Start Keyboard Sounds with your system from Settings for a seamless experience.',
    'You can import and export profiles from the Profiles page to share with others.',
    'Try mouse profiles too — assign custom clicks for left, right, and middle buttons.',
  ], []);

  const [tipIndex, setTipIndex] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 10000);
    return () => clearInterval(id);
  }, [tips.length]);
  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
      }}
    >
      <Box
        sx={{
          borderRadius: 1,
          pt: 2.5,
          pb: 2.5,
          pr: 3,
          pl: 3,
          mt: 2,
          bgcolor: "#292929",
        }}
      >
      <Typography
        variant="body1"
        sx={{
            fontWeight: "bold",
            mb: 2,
        }}
      >
        Audio Profiles
      </Typography>
      <FormControl size="small" fullWidth>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Select
            value={selectedKeyboardProfile}
            onChange={onKeyboardProfileChanged}
            renderValue={(val) => <Typography>{val === '' ? 'None' : val}</Typography>}
            displayEmpty
            sx={{ flex: 1 }}
            startAdornment={
              <Tooltip title="Keyboard Profile" placement="top" arrow>
                <KeyboardIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
              </Tooltip>
            }
          >
            <MenuItem key="__none_kb" value="" disabled={selectedMouseProfile === ''}>
              <Typography variant="body1">None</Typography>
            </MenuItem>
            {profilesKeyboardLoaded && keyboardProfiles.map((profile) => (
              <MenuItem key={profile.name} value={profile.name}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography variant="body1">
                    {profile.name} <Typography variant="caption" color="text.secondary">by <i>{profile.author}</i></Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{profile.description}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </Box>
      </FormControl>
      <FormControl size="small" fullWidth sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <Select
            value={selectedMouseProfile}
            onChange={onMouseProfileChanged}
            renderValue={(val) => <Typography>{val === '' ? 'None' : val}</Typography>}
            displayEmpty
            sx={{ flex: 1 }}
            startAdornment={
              <Tooltip title="Mouse Profile" placement="top" arrow>
                <MouseIcon sx={{ mr: 1, fontSize: '1.25rem' }} size="small" />
              </Tooltip>
            }
          >
            <MenuItem key="__none_mouse" value="" disabled={selectedKeyboardProfile === ''}>
              <Typography variant="body1">None</Typography>
            </MenuItem>
            {profilesMouseLoaded && mouseProfiles.map((profile) => (
              <MenuItem key={profile.name} value={profile.name}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography variant="body1">
                    {profile.name} <Typography variant="caption" color="text.secondary">by <i>{profile.author}</i></Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{profile.description}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </Box>
      </FormControl>

      <Typography
        variant="body1"
        sx={{
            fontWeight: "bold",
            mt: 2.5,
        }}
      >
        Volume
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Typography variant="button" color="GrayText">
          {displayVolume}%
        </Typography>
        <Slider
          size="small"
          defaultValue={70}
          aria-label="Small"
          valueLabelDisplay="off"
          value={displayVolume}
          onChange={(event, value) => onDisplayVolumeChanged(value)}
          onChangeCommitted={(event, value) => onVolumeChanged(value)}
          sx={{
            ml: 1.5,
            mr: 1,
          }}
        />
        <Tooltip title={displayVolume > 0 ? "Mute" : "Un-mute"} placement="top">
          <IconButton
            sx={{
              pl: 1,
              pr: 1,
            }}
            onClick={() => {
                onDisplayVolumeChanged(displayVolume > 0 ? 0 : 25)
                onVolumeChanged(displayVolume > 0 ? 0 : 25)
            }}
            color={displayVolume > 0 ? "primary" : "error"}
          >
            {displayVolume > 0 ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      </Box>
      <Box
        sx={{
          borderRadius: 1,
          pt: 1.5,
          pb: 2.5,
          pr: 3,
          pl: 3,
          mt: 2,
          bgcolor: "#292929",
        }}
      >
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}>
        <Box sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Typography
            variant="body1"
            sx={{
                fontWeight: "bold",
            }}
          >
            Pitch Shift
          </Typography>
          <Tooltip title="When enabled, the pitch of the audio played for each keypress will be shifted by a random semitone value between your configured upper and lower values." placement="left" arrow>
            <InfoIcon sx={{ ml: 1, mt: -0.25 }} fontSize="small" />
          </Tooltip>
        </Box>
        <Switch sx={{ mr: -1.5 }} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          mt: 4,
        }}
      >
        {/* <TextField size="small" type="number" label="Lower ST" />
        <Divider orientation="vertical" variant="middle" flexItem sx={{ ml: 1, mr: 1 }} />
        <TextField size="small" type="number" label="Upper ST" /> */}
        <Slider
          disableSwap
          defaultValue={[-2, 2]}
          min={-12}
          max={12}
          size="small"
          steps={24}
          valueLabelDisplay="on"
          valueLabelFormat={(value) => value > -1 ? `+${value}st` : `${value}st`}
          marks={[{ value: -10, label: '-10st' }, { value: -6, label: '-6st' }, { value: -2, label: '-2st' }, { value: 0, label: '-' }, { value: 2, label: '+2st' }, { value: 6, label: '+6st' }, { value: 10, label: '+10st' }]}
        />
      </Box>
      </Box>
      <Divider sx={{ mt: 2, mb: 1.5 }} />
      <Box
        sx={{
          borderRadius: 1,
          pt: 2.5,
          pb: 2.5,
          pr: 3,
          pl: 3,
          mt: 2,
          bgcolor: "#292929",
        }}
      >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <TipsAndUpdatesIcon sx={{ color: green[400], mr: 1 }} fontSize="small" />
        <Typography variant="body2" color="text.secondary" sx={{ cursor: 'default' }}>
          Tip: {tips[tipIndex]}
        </Typography>
      </Box>
      </Box>
    </Box>
  );
};

export { Status };
