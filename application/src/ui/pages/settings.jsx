import React from "react";

import { useState, useEffect } from "react";

import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";

import StorageIcon from "@mui/icons-material/Storage";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  CircularProgress,
  Link,
  Tooltip,
} from "@mui/material";
import { execute } from "../execute";

const AboutItem = ({ icon, details, title, value }) => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      mb: 1.5,
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
      }}>
        {/* {icon} */}
        <Typography variant="body1" sx={{ ml: 1, fontWeight: "bold", flex: 1, textAlign: "left" }} color="#BCBCBC">
          {title}
        </Typography>
        {details && (
          <Tooltip title={details} placement="top-start" arrow>
            <InfoIcon fontSize="small" sx={{ mr: 1, color: '#BCBCBC' }} />
          </Tooltip>
        )}
        <Box sx={{
          pl: 1,
          pr: 1,
          pt: 0.25,
          pb: 0.25,
          background: '#121212',
          borderRadius: 2,
        }}>
          <Typography variant="button" color="GrayText">
            {value}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const InputCheckbox = ({title, tip, first, last, checked, onChange=(value)=>{}}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        mt: first ? 0 : 0.5,
        mb: last ? 0 : 0.5,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          fontWeight: "bold",
        }}
        color="#BCBCBC"
      >
        {title}
      </Typography>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
      }}>
        <Divider orientation="vertical" variant="middle" flexItem sx={{ mr: 1 }} />
        <Tooltip title={tip} placement="left" arrow>
          <Checkbox checked={checked} sx={{ mr: -1.5 }} onChange={(_, value) => onChange(value)} />
        </Tooltip>
      </Box>
    </Box>
  )
};

const UpdateMessage = ({appVersion, checkingForUpdate, isUpdateAvailable, update, color, onCheckForUpdateRequested}) => {
  const [downloading, setDownloading] = useState(false);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      mb: 1.5,
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
      }}>
        {isUpdateAvailable ? (
          <NewReleasesIcon sx={{ mt: -0.25 }} fontSize="small" />
        ) : (
          <Tooltip title="You are running the latest version" placement="top" arrow>
            <CheckIcon sx={{ color, mr: 1  }} fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="body1" sx={{ ml: isUpdateAvailable ? 1 : 0, fontWeight: "bold", flex: 1, textAlign: "left" }}>
          {checkingForUpdate ? "Checking for Update..." : (isUpdateAvailable ? `Update Available (${appVersion} → ${update.tag_name})` : "Up to date")}
        </Typography>
        {!checkingForUpdate && !isUpdateAvailable && (<>
          <Divider orientation="vertical" variant="middle" flexItem sx={{ mr: 1 }} />
          <Tooltip title="Check for Update" placement="top" arrow>
            <IconButton onClick={onCheckForUpdateRequested}>
              <RefreshIcon sx={{ color: '#bcbcbc' }} fontSize="small" />
            </IconButton>
          </Tooltip>
        </>)}
        {!checkingForUpdate && isUpdateAvailable && (<>
          <Divider orientation="vertical" variant="middle" flexItem sx={{ mr: 1 }} />
          <Tooltip title="View Details on GitHub" placement="top" arrow>
            <Link href={update.html_url} target="_blank">
              <IconButton>
                <OpenInNewIcon sx={{ color: '#bcbcbc' }} fontSize="small" />
              </IconButton>
            </Link>
          </Tooltip>
          {downloading ? (
            <CircularProgress size={18} sx={{ ml: 1.25, mr: 1.25 }} />
          ) : (
            <Tooltip title="Download Now" placement="top" arrow>
              <IconButton onClick={() => { setDownloading(true); execute("downloadUpdate").finally(() => setDownloading(false)); }}>
                <CloudDownloadIcon sx={{ color }} fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>)}
      </Box>
    </Box>
  );
};

const Settings = ({ 
  appVersion,
  backEndVersion,
  runOnStartUp,
  onRunOnStartUpChanged,
  startSoundDaemonOnStartup,
  onStartSoundDaemonOnStartupChanged,
  startDaemonWindow,
  onStartDaemonWindowChanged,
  notifyOnLaunch,
  notifyOnHide,
  notifyOnUpdate,
  onNotifyOnLaunchChanged,
  onNotifyOnHideChanged,
  onNotifyOnUpdateChanged,
}) => {
  const [update, setUpdate] = useState(null);
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const checkForUpdate = () => {
    setCheckingForUpdate(true);
    execute("checkForUpdate")
      .then((release) => {
        if (release) {
          setUpdate(release);
          setIsUpdateAvailable(true);
        }
      })
      .catch((e) => {
        console.error("Update check failed", e);
      })
      .finally(() => {
        setCheckingForUpdate(false);
      });
  };

  useEffect(() => {
    if (!checkingForUpdate) {
      checkForUpdate();
    }
  }, []);

  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
        mt: 2,
      }}
    >
      <Typography variant="h6">Application Settings</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          pl: 2,
          pr: 2,
          pt: 1,
          pb: 1,
          bgcolor: "#292929",
        }}
      >
        <InputCheckbox
          checked={runOnStartUp}
          onChange={onRunOnStartUpChanged}
          title="Start Keyboard Sounds with system"
          tip="If enabled, Keyboard Sounds will automatically launch when your system launches."
          first />
        <InputCheckbox
          checked={startSoundDaemonOnStartup}
          onChange={onStartSoundDaemonOnStartupChanged}
          title="Start playing sounds when launched"
          tip="If enabled, Keyboard Sounds will start listening for keystrokes and playing sounds immediately after the application launches."
          first />
        <InputCheckbox
          checked={startDaemonWindow}
          onChange={onStartDaemonWindowChanged}
          title="Enable Daemon Window (useful for OBS)"
          tip="If enabled the Daemon Window will be launched when the daemon is started. This is useful for apps like OBS that require a window for an audio source."
          first />
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>Notification Preferences</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          pl: 2,
          pr: 2,
          pt: 1,
          pb: 1,
          bgcolor: "#292929",
        }}
      >
        <InputCheckbox
          checked={notifyOnLaunch}
          onChange={onNotifyOnLaunchChanged}
          title="Notify me when the application launches"
          first />
        <InputCheckbox
          checked={notifyOnHide}
          onChange={onNotifyOnHideChanged}
          title="Notify me when minimized to System Tray"
          />
        <InputCheckbox
          checked={notifyOnUpdate}
          onChange={onNotifyOnUpdateChanged}
          title="Notify me when a new version is available"
          last />
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>
        Application Details
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          borderRadius: 1,
          mt: 2,
          p: 2,
          bgcolor: "#292929",
        }}
      >
        <UpdateMessage
          isUpdateAvailable={isUpdateAvailable}
          checkingForUpdate={checkingForUpdate}
          update={update}
          appVersion={appVersion}
          color='#4caf50'
          onCheckForUpdateRequested={checkForUpdate} />

        <Box sx={{
          pt: 1.5,
          pl: 1,
          pr: 1,
          borderRadius: 1,
          mb: 1.5,
          background: '#1e1e1e',
        }}>
          <AboutItem
            icon={<ChangeHistoryIcon fontSize="small" color="disabled" />}
            title="Application Version"
            value={appVersion}
          />
          <AboutItem
            icon={<StorageIcon fontSize="small" color="disabled" />}
            title="Backend Version"
            details="The Keyboard Sounds backend is automatically updated when a new version of the application is installed."
            value={backEndVersion}
          />
        </Box>

        <Divider sx={{ mt: 0.5, mb: 0.5 }} />

        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          mt: 1,
        }}>
          <Typography variant="body2" color="GrayText">Website</Typography>
          <Link href="https://keyboardsounds.net" target="_blank">
            <Typography variant="body2">keyboardsounds.net</Typography>
          </Link>
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          mt: 1,
        }}>
          <Typography variant="body2" color="GrayText">GitHub</Typography>
          <Link href="https://github.com/nathan-fiscaletti/keyboardsounds" target="_blank">
            <Typography variant="body2">nathan-fiscaletti/keyboardsounds</Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export { Settings };
