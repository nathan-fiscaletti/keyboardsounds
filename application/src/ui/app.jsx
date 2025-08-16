import "./index.css";

import React from "react";

import { useState, useEffect } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import green from "@mui/material/colors/green";

import { Settings } from "./pages";
import { Profiles } from "./pages";
import { Status } from "./pages";
import { AppRules } from "./pages";
import { About } from "./pages";

import Card from "@mui/material/Card";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import CircularProgress from "@mui/material/CircularProgress";
import GavelIcon from "@mui/icons-material/Gavel";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import GitHubIcon from "@mui/icons-material/GitHub";
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import SettingsIcon from "@mui/icons-material/Settings";
import ForumIcon from '@mui/icons-material/Forum';
import { IconButton, Typography, Link } from "@mui/material";

import { execute } from './execute';


// Create the initial theme for the application.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: green,
  },
});

function ControlButton({
  statusLoaded,
  status,
  isLoading,
  startCmd,
  handleCommand,
}) {
  return (
    <Box>
      {!statusLoaded && (
        <CircularProgress sx={{ color: "#fff" }} size={18} />
      )}

      {statusLoaded && status.status !== "running" && (
        <Tooltip placement="bottom-end" title="Start Daemon" arrow>
          <Button
            sx={{
              pr: 0,
              pl: 0,
              minWidth: '32px',
              borderRadius: '16px',
              '.MuiButton-icon': {
                marginRight: '4px',
                marginLeft: '4px',
              }
            }}
            variant="contained"
            startIcon={
              isLoading ? (
                <CircularProgress sx={{ color: "#000000de" }} size={18} />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={
              handleCommand(startCmd)
            }
          />
        </Tooltip>
      )}

      {statusLoaded && status.status === "running" && (
        <Tooltip placement="bottom-end" title="Stop Daemon" arrow>
          <Button
            sx={{
              pr: 0,
              pl: 0,
              minWidth: '32px',
              borderRadius: '16px',
              '.MuiButton-icon': {
                marginRight: '4px',
                marginLeft: '4px',
              }
            }}
            variant="contained"
            color="error"
            startIcon={
              isLoading ? (
                <CircularProgress sx={{ color: "#fff" }} size={18} />
              ) : (
                <StopIcon />
              )
            }
            onClick={handleCommand("stop")}
          />
        </Tooltip>
      )}
    </Box>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const [volume, setVolume] = useState(0);
  const [displayVolume, setDisplayVolume] = useState(0);

  const [selectedKeyboardProfile, setSelectedKeyboardProfile] = useState('');
  const [selectedMouseProfile, setSelectedMouseProfile] = useState('');

  const [status, setStatus] = useState(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  const [appRules, setAppRules] = useState([]);
  const [appRulesLoaded, setAppRulesLoaded] = useState(false);

  const [profilesKeyboard, setProfilesKeyboard] = useState([]);
  const [profilesMouse, setProfilesMouse] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  const [globalAction, setGlobalAction] = useState('');
  const [enabledRulesAreExclusive, setEnabledRulesAreExclusive] = useState(false);

  const [appVersion, setAppVersion] = useState('<unknown>');
  const [backEndVersion, setBackEndVersion] = useState('<unknown>');

  const [notifyOnLaunch, setNotifyOnLaunch] = useState(true);
  const [notifyOnHide, setNotifyOnHide] = useState(true);
  const [notifyOnUpdate, setNotifyOnUpdate] = useState(true);
  const [runOnStartUp, setRunOnStartup] = useState(true);
  const [enableDaemonWindow, setEnableDaemonWindow] = useState(true);
  const [runSoundDaemonOnStartup, setRunSoundDaemonOnStartup] = useState(true);

  // Get the version from the backend
  useEffect(() => {
    const run = async () => {
      const version = await execute("getAppVersion");
      setAppVersion(version);
    };
    run();
  }, []);
  useEffect(() => {
    const run = async () => {
      const version = await execute("getBackendVersion");
      setBackEndVersion(version);
    };
    run();
  }, []);


  // Load the profile, volume and notification preferences from the backend
  useEffect(() => {
    const run = async () => {
      const volume = await execute("getVolume");
      const kbProfile = await execute("getProfile");
      const mouseProfile = await execute("getMouseProfile");
      const notifyOnLaunch = await execute("getNotifyOnLaunch");
      const notifyOnHide = await execute("getNotifyOnHide");
      const notifyOnUpdate = await execute("getNotifyOnUpdate");
      const runOnStartUp = await execute("getRunOnStartUp");
      const enableDaemonWindow = await execute("getEnableDaemonWindow");
      const startSoundDaemonOnStartUp = await execute("getStartSoundDaemonOnStartUp");

      setVolume(volume);
      setDisplayVolume(volume);
      setSelectedKeyboardProfile(kbProfile);
      setSelectedMouseProfile(mouseProfile);
      setNotifyOnLaunch(notifyOnLaunch);
      setNotifyOnHide(notifyOnHide);
      setNotifyOnUpdate(notifyOnUpdate);
      setRunOnStartup(runOnStartUp);
      setEnableDaemonWindow(enableDaemonWindow);
      setRunSoundDaemonOnStartup(startSoundDaemonOnStartUp);

      if (startSoundDaemonOnStartUp) {
        const cmdParts = ["start", `-v ${volume}`];
        if (kbProfile !== '') cmdParts.push(`-p ${kbProfile}`);
        if (mouseProfile !== '') cmdParts.push(`-m ${mouseProfile}`);
        if (enableDaemonWindow) cmdParts.push('-w');
        await execute(cmdParts.join(' '));
      }
    };
    run();
  }, []);

  useEffect(() => {
    const removeStatusListener = window.kbs.receive(
      "kbs-status",
      (newStatus) => {
        setStatus(newStatus);
      }
    );

    // Cleanup on component unmount
    return () => {
      removeStatusListener();
    };
  }, []);

  useEffect(() => {
    const removeGlobalActionListener = window.kbs.receive(
      "kbs-global-action",
      (newGlobalAction) => {
        setGlobalAction(newGlobalAction);
      }
    );

    // Cleanup on component unmount
    return () => {
      removeGlobalActionListener();
    };
  }, []);

  useEffect(() => {
    if (globalAction !== '') {
      setEnabledRulesAreExclusive(globalAction === 'disable');
    }
  }, [globalAction]);

  useEffect(() => {
    if (!statusLoaded && status !== null) {
      setStatusLoaded(true);
      if (status.volume !== null) {
        setDisplayVolume(status.volume);
        setVolume(status.volume);
      }
    }
  }, [status]);

  useEffect(() => {
    const removeAppRulesListener = window.kbs.receive(
      "kbs-app-rules",
      (newAppRules) => {
        setAppRules(newAppRules);
      }
    );

    return () => {
      removeAppRulesListener();
    }
  }, []);

  useEffect(() => {
    if(!appRulesLoaded && appRules.length > 0) {
      setAppRulesLoaded(true);
    }
  }, [appRules]);

  useEffect(() => {
    const removeKbListener = window.kbs.receive(
      "kbs-profiles-keyboard",
      (newProfiles) => {
        setProfilesKeyboard(newProfiles);
      }
    );
    const removeMouseListener = window.kbs.receive(
      "kbs-profiles-mouse",
      (newProfiles) => {
        setProfilesMouse(newProfiles);
      }
    );

    return () => {
      removeKbListener();
      removeMouseListener();
    }
  }, []);

  useEffect(() => {
    // Merge for Profiles page view
    const merged = [...profilesKeyboard, ...profilesMouse];
    setProfiles(merged);
    if (!profilesLoaded && merged.length > 0) {
      setProfilesLoaded(true);
      if (selectedKeyboardProfile === '' && profilesKeyboard.length > 0) {
        setSelectedKeyboardProfile(profilesKeyboard[0].name);
      }
      if (selectedMouseProfile === '' && profilesMouse.length > 0) {
        setSelectedMouseProfile(profilesMouse[0].name);
      }
    }
  }, [profilesKeyboard, profilesMouse]);

  useEffect(() => {
    const run = async () => {
      if (statusLoaded && status.status === "running") {
        await execute(`setVolume ${volume}`);
      }
    };
    run();
  }, [volume]);

  const buildStartCmd = () => {
    const parts = ["start", `-v ${volume}`];
    if (selectedKeyboardProfile !== '') parts.push(`-p ${selectedKeyboardProfile}`);
    if (selectedMouseProfile !== '') parts.push(`-m ${selectedMouseProfile}`);
    if (enableDaemonWindow) parts.push('-w');
    return parts.join(' ');
  };

  const handleCommand = (cmd) => {
    return () => {
      // Set loading state
      setIsLoading(true);

      execute(cmd).then((_) => {
        execute("status").then((status) => {
          setStatus(status);
          setIsLoading(false);
        });
      });
    };
  };

  const handleKeyboardProfileChanged = (event) => {
    execute(`storeProfile ${event.target.value}`);
    setSelectedKeyboardProfile(event.target.value);
    if (statusLoaded && status.status === "running") {
      execute(`setProfile ${event.target.value}`).then((_) => {});
    }
  };

  const handleMouseProfileChanged = (event) => {
    execute(`storeMouseProfile ${event.target.value}`);
    setSelectedMouseProfile(event.target.value);
    if (statusLoaded && status.status === "running") {
      execute(`setMouseProfile ${event.target.value}`).then((_) => {});
    }
  };

  const handleVolumeChanged = (volume) => {
    execute(`storeVolume ${volume}`);
    setVolume(volume);
  };

  const handleGlobalActionChanged = (isEnabled) => {
    setEnabledRulesAreExclusive(isEnabled);
    execute(`setGlobalAction ${isEnabled ? 'disable' : 'enable'}`);
  };

  const handleNotifyOnLaunchChanged = (notify) => {
    setNotifyOnLaunch(notify);
    execute(`storeNotifyOnLaunch ${notify}`);
  };

  const handleNotifyOnHideChanged = (notify) => {
    setNotifyOnHide(notify);
    execute(`storeNotifyOnHide ${notify}`);
  };

  const handleNotifyOnUpdateChanged = (notify) => {
    setNotifyOnUpdate(notify);
    execute(`storeNotifyOnUpdate ${notify}`);
  };

  const handleRunOnStartupChanged = (r => {
    setRunOnStartup(r);
    execute(`storeRunOnStartUp ${r}`);
  });

  const handleEnableDaemonWindowChanged = (r => {
    setEnableDaemonWindow(r);
    execute(`storeEnableDaemonWindow ${r}`);
  })

  const handleStartSoundDaemonOnStartupChanged = (r => {
    setRunSoundDaemonOnStartup(r);
    execute(`storeStartSoundDaemonOnStartUp ${r}`);
  });

  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (selectedTab === 0) {        // Audio
      execute(`setHeight 536`);
    } else if (selectedTab === 3) { // Settings
      execute(`setHeight 932`);
    } else if (selectedTab === 4) { // Community
      execute(`setHeight 796`);
    } else {                        // All Other Pages
      execute(`setHeight 800`);
    }
  }, [selectedTab]);

  // Must be last effect.
  useEffect(() => {
    execute("reset_last_known");
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Card
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          ml: 2,
          mr: 2,
          mt: 2,
          pl: 2,
          pr: 2,
          pt: 2, 
          pb: 2,
        }}
      >
        <Box sx={{
          display: "flex",
          flexDirection: "column",
        }}>
          <Typography variant="h6">Keyboard Sounds</Typography>
          <Typography variant="caption"><Link href="https://keyboardsounds.net" target="_blank">keyboardsounds.net</Link></Typography>
        </Box>

        <Box sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}>
          <Tooltip placement="bottom-start" title="View on GitHub" arrow>
            <IconButton sx={{
              mr: 1.5,
            }} onClick={() => execute("openInBrowser")}>
              <GitHubIcon />
            </IconButton>
          </Tooltip>

          <ControlButton 
            statusLoaded={statusLoaded}
            status={status}
            isLoading={isLoading}
            startCmd={buildStartCmd()}
            handleCommand={handleCommand} />
        </Box>
      </Card>
      
      {!statusLoaded && (
        <Card sx={{
          mr: 2,
          ml: 2,
          mb: 1,
          mt: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 124px)",
          maxHeight: "calc(100vh - 124px)"
        }}>
          <Box sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <CircularProgress sx={{ color: "#fff" }} size={48} />
          </Box>
        </Card>
      )}

      {statusLoaded && (
        <Card sx={{
          mr: 2,
          ml: 2,
          mb: 1,
          mt: 1,
          height: "100%",
          minHeight: "calc(100vh - 124px)",
          maxHeight: "calc(100vh - 124px)",
          display: "flex",
          flexDirection: "column"
        }}>
          <Tabs 
            value={selectedTab}
            onChange={(_, v) => setSelectedTab(v)}
            variant="fullWidth"
          >
            <Tooltip title="Audio" arrow><Tab icon={<GraphicEqIcon />} /></Tooltip>
            <Tooltip title="Profiles" arrow><Tab icon={<LibraryMusicIcon />} /></Tooltip>
            <Tooltip title="Rules" arrow><Tab icon={<GavelIcon />} /></Tooltip>
            <Tooltip title="Settings" arrow><Tab icon={<SettingsIcon />} /></Tooltip>
            <Tooltip title="Community" arrow><Tab icon={<ForumIcon />} /></Tooltip>
          </Tabs>

          <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
            {selectedTab === 0 && (
              <Status 
                profilesKeyboardLoaded={profilesKeyboard.length > 0}
                profilesMouseLoaded={profilesMouse.length > 0}
                keyboardProfiles={profilesKeyboard}
                mouseProfiles={profilesMouse}
                selectedKeyboardProfile={selectedKeyboardProfile}
                selectedMouseProfile={selectedMouseProfile}
                displayVolume={displayVolume}
                onKeyboardProfileChanged={handleKeyboardProfileChanged}
                onMouseProfileChanged={handleMouseProfileChanged}
                onVolumeChanged={handleVolumeChanged}
                onDisplayVolumeChanged={setDisplayVolume}
              />
            )}

            {selectedTab === 1 && (
              <Profiles 
                statusLoaded={statusLoaded} 
                status={status} 
                profilesLoaded={profilesLoaded} 
                profiles={profiles}
                selectedKeyboardProfile={selectedKeyboardProfile}
                selectedMouseProfile={selectedMouseProfile}
              />
            )}

            {selectedTab === 2 && (
              <AppRules
                appRules={appRules}
                appRulesLoaded={appRulesLoaded}
                enabledRulesAreExclusive={enabledRulesAreExclusive}
                globalAction={globalAction}
                onGlobalActionChanged={handleGlobalActionChanged}
              />
            )}

            {selectedTab === 3 && (
              <Settings
                appVersion={appVersion}
                backEndVersion={backEndVersion}
                runOnStartUp={runOnStartUp}
                startSoundDaemonOnStartup={runSoundDaemonOnStartup}
                onRunOnStartUpChanged={handleRunOnStartupChanged}
                startDaemonWindow={enableDaemonWindow}
                onStartDaemonWindowChanged={handleEnableDaemonWindowChanged}
                notifyOnLaunch={notifyOnLaunch}
                onNotifyOnLaunchChanged={handleNotifyOnLaunchChanged}
                notifyOnHide={notifyOnHide}
                onNotifyOnHideChanged={handleNotifyOnHideChanged}
                notifyOnUpdate={notifyOnUpdate}
                onNotifyOnUpdateChanged={handleNotifyOnUpdateChanged}
                onStartSoundDaemonOnStartupChanged={handleStartSoundDaemonOnStartupChanged}
              />
            )}

            {selectedTab === 4 && (
              <About />
            )}
          </Box>

        </Card>
      )}
      
    </ThemeProvider>
  );
}

export default App;
