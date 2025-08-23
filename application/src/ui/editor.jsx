import "./index.css";

import React from "react";

import { useState, useEffect, useRef } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import green from "@mui/material/colors/green";
import HelpIcon from "@mui/icons-material/Help";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import EditNoteIcon from "@mui/icons-material/EditNote";

import { Buffer } from "buffer";

import { execute } from "./execute";

import Card from "@mui/material/Card";
import {
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  IconButton,
  Button,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";

import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

import yaml from "js-yaml";

import {
  keyboardOptions,
  keyboardControlPadOptions,
  keyboardArrowsOptions,
  keyboardNumPadOptions,
  keyboardNumPadEndOptions,
  keyToName,
} from "./editor/keyboardopts";

import { HelpDialog } from "./editor/dialogs/help-dialog.jsx";
import { SavingDialog } from "./editor/dialogs/saving-dialog.jsx";
import { SavedDialog } from "./editor/dialogs/saved-dialog.jsx";
import { ErrorDialog } from "./editor/dialogs/error-dialog.jsx";
import { AddSourceDialog } from "./editor/dialogs/add-source-dialog.jsx";
import { ManageSourcesDialog } from "./editor/dialogs/manage-sources-dialog.jsx";
import { ProfileDetailsDialog } from "./editor/dialogs/profile-details-dialog.jsx";
import { EditAssignedSourcesDialog } from "./editor/dialogs/edit-assigned-sources-dialog.jsx";
import { ViewYamlDialog } from "./editor/dialogs/view-yaml-dialog.jsx";
import { ConfirmRemoveSourceDialog } from "./editor/dialogs/confirm-remove-source-dialog.jsx";
import { ConfirmOverwriteProfileDialog } from "./editor/dialogs/confirm-overwrite-profile-dialog.jsx";

// Create the initial theme for the application.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: green,
  },
});

function Editor() {
  const [assignedSourceKey, setAssignedSourceKey] = useState(null);
  const [editAssignedSourcesOpen, setEditAssignedSourcesOpen] = useState(false);

  const showEditAssignedSources = (key) => {
    setAssignedSourceKey(key);
    setEditAssignedSourcesOpen(true);
  };

  const [viewYamlOpen, setViewYamlOpen] = useState(false);

  const [profileDetails, setProfileDetails] = useState({
    name: "new-profile",
    author: "",
    description: "",
  });
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(0);

  const keyboardRef = useRef(null);

  const [keyConfigs, setKeyConfigs] = useState([
    // { key: 'a', source: 'source1', },
  ]);

  const updateKeyboardConfigs = () => {
    console.log("keyConfigs", keyConfigs);
    const countsPerKey = Object.values(
      keyConfigs.reduce((acc, { key }) => {
        if (!acc[key]) {
          acc[key] = { key, count: 0 };
        }
        acc[key].count += 1;
        return acc;
      }, {})
    );
    console.log("countsPerKey", countsPerKey);

    const allKeys = keyboardRef.current.querySelectorAll(".hg-button");
    for (const key of allKeys) {
      const badge = key.querySelector(".badge");

      const k = key.getAttribute("data-skbtn");

      const [keyCount] = countsPerKey.filter((kc) => kc.key === k);

      if (keyCount === undefined) {
        if (badge) {
          badge.remove();
        }
        key.style.position = "initial";
        key.classList.remove("keyAssigned");
        continue;
      }

      key.style.position = "relative";
      key.classList.add("keyAssigned");

      const count = keyCount.count;
      if (count > 0) {
        if (!badge) {
          // Add a badge to the key
          const badge = document.createElement("div");
          badge.classList.add("badge");
          badge.innerText = count;
          key.appendChild(badge);
          badge.addEventListener("pointerdown", function (e) {
            e.stopImmediatePropagation();
            showEditAssignedSources(key.getAttribute("data-skbtn"));
          });
        } else {
          badge.innerText = count;
        }
      }
    }
  };

  const addKeyConfig = (sourceIdx) => {
    const newBatch = [];
    for (const key of selectedKeys) {
      if (
        keyConfigs.filter(
          (kc) => kc.key == selectedKeys[0] && kc.source == sourceIdx
        ).length > 0
      ) {
        continue;
      }

      newBatch.push({ key, source: sourceIdx });
    }

    setKeyConfigs([...keyConfigs, ...newBatch]);
    setSelectedKeys([]);
  };

  useEffect(() => {
    updateKeyboardConfigs();
  }, [keyConfigs]);

  const [profileDetailsOpen, setProfileDetailsOpen] = useState(true);
  const [manageSourcesOpen, setManageSourcesOpen] = useState(false);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [error, setError] = useState(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [editSourceIdx, setEditSourceIdx] = useState(null);

  const [keyboardOptionsFinal, setKeyboardOptionsFinal] =
    useState(keyboardOptions);
  const [keyboardControlPadOptionsFinal, setKeyboardControlPadOptionsFinal] =
    useState(keyboardControlPadOptions);
  const [keyboardArrowsOptionsFinal, setKeyboardArrowsOptionsFinal] = useState(
    keyboardArrowsOptions
  );
  const [keyboardNumPadOptionsFinal, setKeyboardNumPadOptionsFinal] = useState(
    keyboardNumPadOptions
  );
  const [keyboardNumPadEndOptionsFinal, setKeyboardNumPadEndOptionsFinal] =
    useState(keyboardNumPadEndOptions);

  const [selectedKeys, setSelectedKeys] = useState([]);

  const [playingSource, setPlayingSource] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [pendingRemoveSourceIndex, setPendingRemoveSourceIndex] = useState(null);

  const performRemoveSource = (sourceIdx) => {
    // Remove key assignments for this source and reindex remaining assignments
    const updatedKeyConfigs = keyConfigs
      .filter((cfg) => cfg.source !== sourceIdx)
      .map((cfg) => ({
        key: cfg.key,
        source: cfg.source > sourceIdx ? cfg.source - 1 : cfg.source,
      }));
    setKeyConfigs(updatedKeyConfigs);

    // Remove the source from the list
    const updatedSources = sources.filter((_, idx) => idx !== sourceIdx);
    setSources(updatedSources);

    // Adjust selectedSource to stay within bounds and consistent
    if (updatedSources.length === 0) {
      setSelectedSource(0);
    } else if (selectedSource > sourceIdx) {
      setSelectedSource(selectedSource - 1);
    } else if (selectedSource >= updatedSources.length) {
      setSelectedSource(updatedSources.length - 1);
    }
  };

  const requestRemoveSource = (sourceIdx) => {
    const isUsed = keyConfigs.some((cfg) => cfg.source === sourceIdx);
    if (isUsed) {
      setPendingRemoveSourceIndex(sourceIdx);
      setConfirmRemoveOpen(true);
    } else {
      performRemoveSource(sourceIdx);
    }
  };

  useEffect(() => {
    setErrorOpen(error !== null);
  }, [error]);

  const toggleKeySelected = (key) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const clearSelectedKeys = () => {
    setSelectedKeys([]);
  };

  useEffect(() => {
    console.log("selectedKeys", selectedKeys);

    const themes = {
      buttonTheme: [],
    };

    if (selectedKeys.length > 0) {
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
  };

  const [yamlValue, setYamlValue] = useState("");

  const buildYamlObj = () => {
    const yamlObj = {};
    yamlObj.profile = profileDetails;

    // Sources
    yamlObj.sources = [];
    for (const source of sources) {
      // name, isDefault, pressSound, releaseSound
      const sourceObj = {
        id: source.name,
      };
      if (source.releaseSound) {
        sourceObj.source = {
          press: source.pressSound.replace(/\\/g, "/").split("/").pop(),
          release: source.releaseSound.replace(/\\/g, "/").split("/").pop(),
        };
      } else {
        sourceObj.source = source.pressSound
          .replace(/\\/g, "/")
          .split("/")
          .pop();
      }
      yamlObj.sources.push(sourceObj);
    }

    // Keys
    yamlObj.keys = {
      default: sources.filter((s) => s.isDefault).map((s) => s.name),
    };

    // group the keyConfigs by source
    const keyConfigsBySource = [];
    for (const keyConfig of keyConfigs) {
      let found = false;
      for (const ot of keyConfigsBySource) {
        if (ot.sound == sources[keyConfig.source].name) {
          ot.keys.push(keyToName[keyConfig.key] || keyConfig.key);
          found = true;
          break;
        }
      }

      if (!found) {
        keyConfigsBySource.push({
          sound: sources[keyConfig.source].name,
          keys: [keyToName[keyConfig.key] || keyConfig.key],
        });
      }
    }

    yamlObj.keys.other = keyConfigsBySource;
    return yamlObj;
  };

  useEffect(() => {
    setYamlValue(yaml.dump(buildYamlObj()));
  }, [sources, keyConfigs, profileDetails]);

  const [saving, setSaving] = useState(false);
  const [confirmOverwriteOpen, setConfirmOverwriteOpen] = useState(false);

  const doFinalizeSave = async () => {
    try {
      await execute(
        `finalizeProfileEdit ${Buffer.from(
          JSON.stringify({
            profileYaml: buildYamlObj(),
            sources: [
              ...new Set(
                sources.flatMap((source) =>
                  source.releaseSound
                    ? [source.pressSound, source.releaseSound]
                    : [source.pressSound]
                )
              ),
            ],
          })
        ).toString("base64")}`
      );
      console.log("saved successfully");
      setSavedOpen(true);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError(`Failed to save profile: ${err}`);
    }
  };

  const save = async () => {
    setSaving(true);

    // perform validation
    if (
      profileDetails.name === "" ||
      profileDetails.author === "" ||
      profileDetails.description === ""
    ) {
      setError(
        "Please fill out all fields in the Profile Details section before attempting to save the profile."
      );
      setSaving(false);
      return;
    }

    if (sources.filter((s) => s.isDefault) < 1) {
      setError(
        "Please add at least one default source before attempting to save the profile."
      );
      setSaving(false);
      return;
    }

    const profileNames = await execute("profileNames");
    if (profileNames.includes(profileDetails.name)) {
      setConfirmOverwriteOpen(true);
      setSaving(false);
      return;
    }

    await doFinalizeSave();
    setSaving(false);
  };

  const playSource = async (source) => {
    setPlayingSource(true);
    try {
      if (source.pressSound && source.releaseSound) {
        await execute(
          `one-shot "${source.pressSound}" "${source.releaseSound}"`
        );
      } else if (source.pressSound) {
        await execute(
          `one-shot "${source.pressSound}"`
        );
      } else if (source.releaseSound) {
        await execute(
          `one-shot "${source.releaseSound}"`
        );
      }
    } catch (e) {
      console.log(e);
    } finally {
      setPlayingSource(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      {/* Dialogs */}

      <SavingDialog saving={saving} />
      <SavedDialog open={savedOpen} onClose={() => setSavedOpen(false)} />

      <ErrorDialog
        open={errorOpen}
        onClose={() => setError(null)}
        error={error}
      />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />

      <ProfileDetailsDialog
        open={profileDetailsOpen}
        profileDetails={profileDetails}
        onClose={() => setProfileDetailsOpen(false)}
        onSave={(profileDetails) => {
          setProfileDetails(profileDetails);
        }}
        onError={(err) => setError(err)}
      />

      <ViewYamlDialog
        open={viewYamlOpen}
        onClose={() => setViewYamlOpen(false)}
        yaml={yamlValue}
      />

      <EditAssignedSourcesDialog
        open={editAssignedSourcesOpen}
        onClose={() => setEditAssignedSourcesOpen(false)}
        keyConfigs={keyConfigs}
        onKeyConfigsUpdated={(kc) => setKeyConfigs(kc)}
        assignedSourceKey={assignedSourceKey}
        sources={sources}
      />

      <ConfirmRemoveSourceDialog
        open={confirmRemoveOpen}
        onCancel={() => {
          setConfirmRemoveOpen(false);
          setPendingRemoveSourceIndex(null);
        }}
        onConfirm={() => {
          if (pendingRemoveSourceIndex !== null) {
            performRemoveSource(pendingRemoveSourceIndex);
          }
          setConfirmRemoveOpen(false);
          setPendingRemoveSourceIndex(null);
        }}
      />

      <ConfirmOverwriteProfileDialog
        open={confirmOverwriteOpen}
        profileName={profileDetails.name}
        onCancel={() => setConfirmOverwriteOpen(false)}
        onConfirm={async () => {
          setConfirmOverwriteOpen(false);
          setSaving(true);
          await doFinalizeSave();
          setSaving(false);
        }}
      />

      <ManageSourcesDialog
        open={manageSourcesOpen}
        onClose={() => setManageSourcesOpen(false)}
        onAddSource={() => setAddSourceOpen(true)}
        onListenRequested={(s) => playSource(s)}
        onEditSource={(idx) => {
          setEditSourceIdx(idx);
          setAddSourceOpen(true);
        }}
        onRemoveSource={(idx) => requestRemoveSource(idx)}
        sources={sources}
        playingSource={playingSource}
      />

      <AddSourceDialog
        open={addSourceOpen}
        onClose={() => {
          setAddSourceOpen(false);
          setEditSourceIdx(null);
        }}
        onSourceAdded={(source) => {
          setSources([...sources, source]);
          setAddSourceOpen(false);
        }}
        onSourceUpdated={(updated) => {
          if (editSourceIdx !== null) {
            const newSources = sources.map((s, i) => (i === editSourceIdx ? { ...updated } : s));
            setSources(newSources);
          }
          setAddSourceOpen(false);
          setEditSourceIdx(null);
        }}
        onError={(err) => setError(err)}
        mode={editSourceIdx !== null ? "edit" : "add"}
        initialSource={editSourceIdx !== null ? sources[editSourceIdx] : null}
      />

      {/* Main Editor */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
            width: "100%",
            maxWidth: "1152px",
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Keyboard Sounds Editor</Typography>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ ml: 2, mr: 2 }}
                variant="middle"
              />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "background.default",
                  pl: 1.5,
                  pr: 1,
                  py: 0.5,
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ mr: 1, color: "#388e3c", fontWeight: "bold" }}
                >
                  {profileDetails.name}
                </Typography>
                <Tooltip
                  placement="bottom-start"
                  title="Edit profile name"
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={() => setProfileDetailsOpen(true)}
                  >
                    <EditNoteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* {needsSave ? (
                <Tooltip placement="bottom-start" title="Unsaved Changes" arrow>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                </Tooltip>
              ) : (
                <Tooltip placement="bottom-start" title="Up to date" arrow>
                    <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                </Tooltip>
              )}
              <Divider orientation="vertical" flexItem sx={{ ml: 1, mr: 1 }} variant="middle" /> */}

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
              <Divider
                orientation="vertical"
                flexItem
                sx={{ ml: 1, mr: 2 }}
                variant="middle"
              />
              {saving ? (
                <CircularProgress size={18} />
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveIcon />}
                  onClick={() => save()}
                >
                  Save
                </Button>
              )}
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
            alignItems: "center",
            maxWidth: "1152px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              width: "100%",
              maxWidth: "1120px",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {sources.length > 0 ? (
                <Box sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                }}>
                  <Select
                    size="small"
                    sx={{ mr: 1 }}
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    disabled={selectedKeys.length === 0}
                  >
                    {sources.map((source, idx) => (
                      <MenuItem value={idx} selected={selectedSource === idx}>
                        {source.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => addKeyConfig(selectedSource)}
                    disabled={selectedKeys.length === 0 || sources.length < 1}
                  >
                    Apply
                  </Button>
                </Box>
              ) : (
                <Box sx={{
                  display: "flex",
                  flexDirection: "row",
                  visibility: sources.length < 1 ? "visible" : "hidden",
                }}>
                  <Typography variant="body2" color="GrayText">
                    Add a source to get started.
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  visibility: selectedKeys.length > 0 ? "visible" : "hidden",
                }}
              >
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ ml: 2, mr: 2 }}
                  variant="middle"
                />
                <Button
                  variant="text"
                  color="warning"
                  onClick={() => clearSelectedKeys()}
                >
                  Clear Selection
                </Button>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                startIcon={<GraphicEqIcon />}
                color="info"
                onClick={() => setManageSourcesOpen(true)}
              >
                Manage Sources
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                color="info"
                onClick={() => setProfileDetailsOpen(true)}
              >
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

export default Editor;
