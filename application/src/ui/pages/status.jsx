import React from "react";

import green from "@mui/material/colors/green";

import { Box, Typography, FormControl, Select, Slider, MenuItem, Tooltip, IconButton, Divider } from "@mui/material";

import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const Status = ({
    statusLoaded,
    status,
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
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 1,
          pl: 2,
          pr: 2,
          pt: 2.5,
          pb: 2.5,
          bgcolor: "#292929",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
          }}
        >
          Status
        </Typography>
        <Box sx={{ 
          borderRadius: 1, 
          pt: 0.25, 
          pb: 0.25,
          pl: 1,
          pr: 1,
          bgcolor: 
            !statusLoaded
                ? "HighlightText"
                : status.status === "running"
                  ? green[500]
                  : "red" 
        }}>
          <Typography
            variant="button"
            color={"white"}
            fontWeight={"bold"}
          >
            {
              statusLoaded 
                ? (
                  status.user_status === "Not running" ? "disabled" : "enabled"
                ) : "Loading..."
            }
          </Typography>
        </Box>
      </Box>
      {/* <Divider sx={{ mt: 2 }} /> */}
      <Typography variant="h6" sx={{ mt: 2 }}>
          Configuration
      </Typography>
      <Box
        sx={{
          borderRadius: 1,
          p: 2,
          mt: 2,
          bgcolor: "background.default",
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
        >
          {profilesLoaded && profiles.map((profile) => (
            <MenuItem key={profile.name} value={profile.name}>
              {profile.name}
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
      <Typography variant="h6" sx={{ mt: 2 }}>
          Status Details
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
          mt: 2,
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Volume
          </Typography>
          <Typography variant="button" color="GrayText">
            {statusLoaded && status.volume !== null ? `${status.volume}%` : "N/A"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Selected Profile
          </Typography>
          <Typography variant="button" color="GrayText">
            {statusLoaded && status.profile ? status.profile : "N/A"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Daemon Status
          </Typography>
          <Typography variant="button" color="GrayText">
            {statusLoaded && status.status ? status.status : "N/A"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Daemon PID
          </Typography>
          <Typography variant="button" color="GrayText">
            {statusLoaded && status.pid ? status.pid : "N/A"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: "bold",
            }}
          >
            Daemon Lock
          </Typography>
          <Typography variant="button" color="GrayText">
            {statusLoaded
              ? status.lock.active
                ? "Active"
                : "Inactive"
              : "N/A"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export { Status };
