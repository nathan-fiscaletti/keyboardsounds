import React, { useEffect } from "react";

import { useState } from "react";

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  Select,
  MenuItem,
  FormControl,
  Switch,
  Divider,
} from "@mui/material";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FileOpenIcon from '@mui/icons-material/FileOpen';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from "@mui/icons-material/Settings";

import { execute } from '../execute';


const RuleActionLabel = ({ action }) => {
  return (
    <Typography variant="button" fontSize={11}>
      {action === "disable"
        ? "Disabled"
        : action === "exclusive"
        ? "Exclusive"
        : "Enabled"}
    </Typography>
  );
};

const AppRule = ({ rule }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <ListItem
      key={rule.app_path}
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: "background.default",
        pl: 2,
      }}
      disableGutters
      secondaryAction={
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Chip
            variant="outlined"
            sx={{
              mr: 1,
              borderRadius: 1,
              width: 90,
              cursor: "default",
              "& .MuiChip-label": {
                textTransform: "capitalize",
              },
            }}
            size="small"
            label={<RuleActionLabel action={rule.action} />}
            color={
              rule.action === "disable"
                ? "error"
                : rule.action === "exclusive"
                ? "warning"
                : "success"
            }
          />

          {isDeleting && (
            <CircularProgress size={18} sx={{mr: 2, ml: 1}} />
          )}

          {!isDeleting && (
            <Tooltip title="Remove rule" placement="top" arrow>
              <IconButton
                color="primary"
                sx={{ mr: 1 }}
                onClick={() => {
                  setIsDeleting(true);
                  execute(`remove-rule --app "${rule.app_path}"`, (_) => {
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
    >
      <Tooltip title={rule.app_path} followCursor>
        <ListItemText
          sx={{
            cursor: "default",
          }}
          primary={rule.app_path.match(/[^\\/]+$/)[0]}
          primaryTypographyProps={{
            variant: "body2",
          }}
          secondary={rule.app_path}
          secondaryTypographyProps={{
            noWrap: true,
            variant: "caption",
            style: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100vw - 232px)",
            },
          }}
        />
      </Tooltip>
    </ListItem>
  );
};

const AppRules = ({ appRules, appRulesLoaded, enabledRulesAreExclusive, globalAction, onGlobalActionChanged }) => {
  const [searchValue, setSearchValue] = useState("");

  // Sort the app rules so that "exclusive" rules come first
  appRules.sort((a, b) => {
    if (a.action === "exclusive" && b.action !== "exclusive") {
      return -1;
    } else if (a.action !== "exclusive" && b.action === "exclusive") {
      return 1;
    } else {
      return 0;
    }
  });

  const [addAppRuleDialogOpen, setAddAppRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState("disable");
  const [selectedApplication, setSelectedApplication] = useState("");
  const [addingRule, setAddingRule] = useState(false);

  useEffect(() => {
    if (!addAppRuleDialogOpen) {
      setSelectedRule("disable");
      setSelectedApplication("");
    }
  }, [addAppRuleDialogOpen]);

  const selectExecutableFile = () => {
    execute("selectExecutableFile").then((path) => {
      if (path) {
        setSelectedApplication(path);
      }
    });
  };

  const saveRule = () => {
    if (selectedApplication === "") {
      return;
    }

    setAddingRule(true);
    execute(`add-rule --app "${selectedApplication}" --rule ${selectedRule}`)
      .then(() => {
        setAddingRule(false);
        setAddAppRuleDialogOpen(false);
      });
  };

  return (
    <Box
      sx={{
        ml: 2,
        mt: 2,
      }}
    >
      <Dialog open={addAppRuleDialogOpen} fullWidth>
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
            <Typography variant="h6">Add Application Rule</Typography>
            <IconButton onClick={() => setAddAppRuleDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body" sx={{ mt: 2 }}>
            Application
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
            {selectedApplication !== "" && (
              <Tooltip title={selectedApplication} followCursor>
                <Typography variant="body2" color="GrayText" noWrap sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "calc(100vw - 250px)",
                }}>
                  {selectedApplication}
                </Typography>
              </Tooltip>
            )}
            {selectedApplication === "" && (
              <Typography variant="body2" color="GrayText">
                Select an application...
              </Typography>
            )}

            <Button
              startIcon={<FileOpenIcon />}
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
              onClick={selectExecutableFile}
            >
              Select
            </Button>
          </Box>
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              mb: 1,
            }}
          >
            Rule
          </Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
              renderValue={(v) => (
                <Typography variant="button">
                  {v === "disable"
                    ? "Disable"
                    : v === "enable"
                    ? "Enable"
                    : "Exclusive"}
                </Typography>
              )}
            >
              <MenuItem value="disable" selected>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography variant="button">Disable</Typography>
                  <Typography variant="caption" color="GrayText">
                    Disables the sound daemon when this application gains focus.
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="enable">
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography variant="button">Enable</Typography>
                  <Typography variant="caption" color="GrayText">
                    Enables the sound daemon when this application gains focus.
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="exclusive">
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  <Typography variant="button">Exclusive</Typography>
                  <Typography variant="caption" color="GrayText">
                    Enables the sound daemon ONLY when this application gains focus.
                  </Typography>
                  <Typography variant="caption" color="GrayText">
                    (There can only be one EXCLUSIVE rule at a time.)
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            startIcon={
              addingRule ? (
                <CircularProgress size={18} />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ mt: 3, }}
            disabled={selectedApplication === "" || addingRule}
            onClick={saveRule}
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
        <Typography variant="h6">Application Rules</Typography>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => setAddAppRuleDialogOpen(true)}>
          Add Rule
        </Button>
      </Box>
      <Typography variant="body2" color="GrayText" sx={{ mb: 0.5, mt: 0.5 }}>
        These rules allow you to control the behavior of the sound daemon based
        on the currently focused application.
      </Typography>
      <Box sx={{ pr: 2 }}>
      <TextField
        label="Search"
        size="small"
        fullWidth
        sx={{
          mt: 1,
          mb: 0.5,
        }}
        value={searchValue}
        onChange={
          e => setSearchValue(e.target.value)
        }
        InputProps={{
          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
        }}
      />

      <Box sx={{
        borderRadius: 1,
        mb: 1,
        // bgcolor: "background.default",
        pt: 1,
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <Tooltip followCursor title={(
            <Typography variant="caption">
              When enabled, sounds will only be played when applications with a rule configured are in focus.
            </Typography>
          )}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
            }}>
              <SettingsIcon color="GrayText" fontSize="small" sx={{ mt: 0.5 }} />
              <Typography variant="body2" sx={{ ml: 1, mt: 0.5, cursor: 'default' }}>
                Disable for unknown applications
              </Typography>
            </Box>
          </Tooltip>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Switch checked={enabledRulesAreExclusive} onChange={(e, c) => onGlobalActionChanged(c)} />
        </Box>
      </Box>
      </Box>
      {appRulesLoaded && appRules.length > 0 && (
        <List
          sx={{
            overflow: "auto",
            maxHeight: "calc(100vh - 410px)",
            pr: 2,
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255, 255, 255, 0.07)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          {appRules.map((rule) => {
            if (
              searchValue === "" ||
              rule.app_path
                .match(/[^\\/]+$/)[0]
                .toLowerCase()
                .includes(searchValue.toLowerCase())
            ) {
              return (
                <AppRule rule={rule} />
              );
            }

            return null;
          })}
        </List>
      )}
      {(!appRulesLoaded || appRules.length < 1) && (
        <Box sx={{ mt: 18, display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <Typography variant="button" color="GrayText">
              No rules have been added yet.
            </Typography>
            <Typography variant="body2" color="GrayText" sx={{ mt: 1 }}>
              Click the "Add Rule" button to get started.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export { AppRules };
