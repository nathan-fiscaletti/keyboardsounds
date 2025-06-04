import React from "react";

import green from "@mui/material/colors/green";

import { Box, Typography, FormControl, Select, Slider, MenuItem, Tooltip, IconButton, Divider } from "@mui/material";

import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const Status = ({
    profilesLoaded,
    profiles,
    selectedProfile,
    displayVolume,
    onProfileChanged,
    onVolumeChanged,
    onDisplayVolumeChanged,
}) => {
  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
        mt: 2,
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
        Profile
      </Typography>
      <FormControl size="small" fullWidth>
        <Select
          value={selectedProfile}
          onChange={onProfileChanged}
          renderValue={(val) => <Typography>{val}</Typography>}
        >
          {profilesLoaded && profiles.map((profile) => (
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
      </FormControl>
      <Typography
        variant="body1"
        sx={{
            mt: 3,
            fontWeight: "bold",
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
    </Box>
  );
};

export { Status };
