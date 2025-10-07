import "./index.css";

import React from "react";

import { useState, useEffect } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import green from "@mui/material/colors/green";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";

import {
  CheckCircle,
  Warning,
  Download,
  PlayArrow,
  Refresh,
  ExpandMore,
  Bolt,
} from "@mui/icons-material";

import { execute } from "./execute";

// Create the initial theme for the application.
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: green,
  },
});

const getSteps = (minPythonVersion) => [
  {
    label: "Python",
    description: `Python ${minPythonVersion || '3.8'} or later is required to run this application`
  },
  {
    label: "Keyboard Sounds Backend", 
    description: "The Keyboard Sounds backend is required to run this application"
  }
];

function Wizard() {
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  const [pythonStatus, setPythonStatus] = useState({
    checking: true,
    installed: false,
    version: null,
    path: null,
    isVersionOk: false,
    error: null
  });
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    installed: false, // installed correctly (exists and meets min version)
    version: null,
    isVersionOk: false,
    error: null,
    location: null,
    installing: false,
  });
  const [minBackendVersion, setMinBackendVersion] = useState(null);
  const [minPythonVersion, setMinPythonVersion] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Auto-expand accordion based on status: error first, then success
  useEffect(() => {
    // Don't auto-expand while still checking
    if (pythonStatus.checking || backendStatus.checking) {
      return;
    }

    // If there's an error in Python step, expand it
    if (!pythonStatus.installed || !pythonStatus.isVersionOk) {
      setExpandedAccordion(0); // Expand Python step
      return;
    }

    // If there's an error in Backend step, expand it
    if (!backendStatus.installed) {
      setExpandedAccordion(1); // Expand Backend step
      return;
    }

    // If no errors and all steps are complete, collapse all
    if (pythonStatus.installed && pythonStatus.isVersionOk && backendStatus.installed) {
      setExpandedAccordion(null);
      return;
    }
  }, [pythonStatus.installed, pythonStatus.isVersionOk, backendStatus.installed, pythonStatus.checking, backendStatus.checking]);

  // Check Python installation
  useEffect(() => {
    const checkPython = async () => {
      try {
        setPythonStatus(prev => ({ ...prev, checking: true, error: null }));
        const [pythonDetails, minPythonVer] = await Promise.all([
          execute("getPythonDetails"),
          execute("getMinimumPythonVersion")
        ]);
        setMinPythonVersion(String(minPythonVer || ''));
        console.log("Python details received:", pythonDetails);
        console.log("Python details type:", typeof pythonDetails);
        console.log("Python details isVersionOk:", pythonDetails?.isVersionOk);
        console.log("Python details constructor:", pythonDetails?.constructor?.name);
        
        // Check if we got valid data
        if (pythonDetails && typeof pythonDetails === 'object' && pythonDetails.version) {
          const isVersionOk = pythonDetails.isVersionOk || false;
          setPythonStatus({
            checking: false,
            installed: true, // Python is installed (regardless of version)
            version: pythonDetails.version || "Unknown",
            path: pythonDetails.path || "Unknown",
            isVersionOk: isVersionOk,
            error: null
          });
        } else {
          // Check if we got an error string instead of valid data
          if (typeof pythonDetails === 'string') {
            setPythonStatus({
              checking: false,
              installed: false,
              version: null,
              path: null,
              isVersionOk: false,
              error: pythonDetails
            });
          } else {
            // Fallback to basic check if getPythonDetails doesn't work
            await execute("checkPythonInstallation");
            setPythonStatus({
              checking: false,
              installed: false, // Not installed if we can't verify version
              version: "Detected",
              path: "Unknown",
              isVersionOk: false,
              error: null
            });
          }
        }
      } catch (error) {
        console.log("Python check error:", error);
        console.log("Python check error message:", error.message);
        console.log("Python check error type:", typeof error);
        console.log("Python check error constructor:", error?.constructor?.name);
        console.log("Python check error toString:", error.toString());
        setPythonStatus({
          checking: false,
          installed: false,
          version: null,
          path: null,
          isVersionOk: false,
          error: error.message || error || "Python check failed"
        });
      }
    };
    checkPython();
  }, []);

  // Check backend installation
  useEffect(() => {
    const checkBackend = async () => {
      try {
        setBackendStatus(prev => ({ ...prev, checking: true, error: null }));
        const [details, minV] = await Promise.all([
          execute("getBackendDetails"),
          execute("getMinimumBackendVersion"),
        ]);
        setMinBackendVersion(String(minV || ''));

        if (!details || typeof details !== 'object') {
          setBackendStatus({
            checking: false,
            installed: false,
            version: null,
            isVersionOk: false,
            error: 'Backend check failed',
            location: null,
            installing: false,
          });
          return;
        }

        const versionString = details.version ? String(details.version) : null;
        const ok = !!details.isVersionOk && !!details.installed;
        setBackendStatus({
          checking: false,
          installed: ok,
          version: versionString,
          isVersionOk: !!details.isVersionOk,
          error: details.error || null,
          location: details.location || null,
          installing: false,
        });
      } catch (error) {
        setBackendStatus({
          checking: false,
          installed: false,
          version: null,
          isVersionOk: false,
          error: error.message || "Backend check failed",
          location: null,
          installing: false,
        });
      }
    };
    checkBackend();
  }, []);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : null);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await execute("launchMainApplication");
    } catch (error) {
      console.error("Failed to launch application:", error);
    } finally {
      setIsLaunching(false);
    }
  };

  const getStepIcon = (stepIndex) => {
    if (stepIndex === 0) {
      if (pythonStatus.checking) return <CircularProgress size={20} />;
      if (pythonStatus.installed && pythonStatus.isVersionOk) return <CheckCircle color="success" />;
      return <Warning color="warning" />;
    }
    if (stepIndex === 1) {
      if (backendStatus.checking) return <CircularProgress size={20} />;
      if (backendStatus.installed && backendStatus.isVersionOk) return <CheckCircle color="success" />;
      return <Warning color="warning" />;
    }
    return null;
  };

  const canAccessStep = (stepIndex) => {
    if (stepIndex === 0) return true; // Python step is always accessible
    if (stepIndex === 1) return pythonStatus.installed && pythonStatus.isVersionOk; // Backend step requires Python with proper version
    return false;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 3,
            m: 2,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
            <Bolt sx={{ fontSize: 36, color: 'primary.main' }} />
            <Typography variant="h4" align="center">
              Keyboard Sounds Setup Wizard
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Let's get your Keyboard Sounds environment set up properly
          </Typography>

          <Box sx={{ mt: 2 }}>
            {getSteps(minPythonVersion).map((step, index) => (
              <Accordion
                key={step.label}
                expanded={expandedAccordion === index}
                onChange={handleAccordionChange(index)}
                disabled={!canAccessStep(index)}
                sx={{
                  mb: 1,
                  '&.Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    opacity: 0.6,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getStepIcon(index)}
                    <Box>
                      <Typography variant="h6">{step.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {index === 0 && pythonStatus.installed && (
                      <Chip 
                        label={`Python ${String(pythonStatus.version || '')}`} 
                        size="small" 
                        color={pythonStatus.isVersionOk ? "success" : "warning"} 
                        sx={{ mr: 1 }}
                      />
                    )}
                    {index === 1 && backendStatus.version && (
                      <Tooltip title={`Version ${String(backendStatus.version || '')}${backendStatus.location ? ` • ${String(backendStatus.location)}` : ''}`}>
                        <Chip 
                          label={`v${String(backendStatus.version || '')}`} 
                          size="small" 
                          color={(backendStatus.installed && backendStatus.isVersionOk) ? "success" : "warning"} 
                          sx={{ mr: 1 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {index === 0 && (
                      <PythonStep 
                        status={pythonStatus}
                        minPythonVersion={minPythonVersion}
                        onRefresh={async () => {
                          await execute("clearPythonExecutable");
                          setPythonStatus(prev => ({ ...prev, checking: true, error: null }));
                          try {
                            const [pythonDetails, minPythonVer] = await Promise.all([
                              execute("getPythonDetails"),
                              execute("getMinimumPythonVersion")
                            ]);
                            setMinPythonVersion(String(minPythonVer || ''));
                            console.log("Python details received (refresh):", pythonDetails);
                            
                            // Check if we got valid data
                            if (pythonDetails && typeof pythonDetails === 'object' && pythonDetails.version) {
                              const isVersionOk = pythonDetails.isVersionOk || false;
                              setPythonStatus({
                                checking: false,
                                installed: true, // Python is installed (regardless of version)
                                version: pythonDetails.version || "Unknown",
                                path: pythonDetails.path || "Unknown",
                                isVersionOk: isVersionOk,
                                error: null
                              });
                            } else {
                              // Check if we got an error string instead of valid data
                              if (typeof pythonDetails === 'string') {
                                setPythonStatus({
                                  checking: false,
                                  installed: false,
                                  version: null,
                                  path: null,
                                  isVersionOk: false,
                                  error: pythonDetails
                                });
                              } else {
                                // Fallback to basic check if getPythonDetails doesn't work
                                await execute("checkPythonInstallation");
                                setPythonStatus({
                                  checking: false,
                                  installed: false, // Not installed if we can't verify version
                                  version: "Detected",
                                  path: "Unknown",
                                  isVersionOk: false,
                                  error: null
                                });
                              }
                            }
                          } catch (error) {
                            console.log("Python check error (refresh):", error);
                            setPythonStatus({
                              checking: false,
                              installed: false,
                              version: null,
                              path: null,
                              isVersionOk: false,
                              error: error.message || error || "Python check failed"
                            });
                          }
                        }}
                      />
                    )}
                    {index === 1 && (
                      <BackendStep 
                        status={backendStatus}
                        minVersion={minBackendVersion}
                        setBackendStatus={setBackendStatus}
                        onRefresh={async () => {
                          await execute("clearPythonExecutable");
                          setBackendStatus(prev => ({ ...prev, checking: true, error: null, installing: false }));
                          try {
                            const [details, minV] = await Promise.all([
                              execute("getBackendDetails"),
                              execute("getMinimumBackendVersion"),
                            ]);
                            setMinBackendVersion(String(minV || ''));

                            if (!details || typeof details !== 'object') {
                              setBackendStatus({
                                checking: false,
                                installed: false,
                                version: null,
                                isVersionOk: false,
                                error: 'Backend check failed',
                                location: null,
                                installing: false,
                              });
                              return;
                            }

                            const versionString = details.version ? String(details.version) : null;
                            const ok = !!details.isVersionOk && !!details.installed;
                            setBackendStatus({
                              checking: false,
                              installed: ok,
                              version: versionString,
                              isVersionOk: !!details.isVersionOk,
                              error: details.error || null,
                              location: details.location || null,
                              installing: false,
                            });
                          } catch (error) {
                            setBackendStatus({
                              checking: false,
                              installed: false,
                              version: null,
                              isVersionOk: false,
                              error: error.message || "Backend check failed",
                              location: null,
                              installing: false,
                            });
                          }
                        }}
                      />
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            ml: 2,
            mr: 2,
            mb: 2,
            borderRadius: 2,
          }}
        >
          <LaunchStep 
            onLaunch={handleLaunch}
            isLaunching={isLaunching}
            canLaunch={pythonStatus.installed && pythonStatus.isVersionOk && backendStatus.installed && backendStatus.isVersionOk}
          />
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

function PythonStep({ status, minPythonVersion, onRefresh }) {
  if (status.checking) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Checking Python installation...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (status.installed && status.isVersionOk) {
    return (
      <Box sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: "background.default",
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          alignItems: 'center',
        }}>
          <Tooltip title={String(status.path || 'Unknown')} arrow placement="top">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              nowrap
              sx={{ 
                flex: 1,
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                mr: 1,
              }}
            >
              {String(status.path || 'Unknown')}
            </Typography>
          </Tooltip>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="small"
          >
            Re-check
          </Button>
        </Box>
      </Box>
    );
  }

  // Python is installed but version is insufficient
  if (status.installed && !status.isVersionOk) {
    return (
      <Box sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: "background.default",
      }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Python version {status.version} is installed, but version {minPythonVersion} or later is required. Please update Python to continue.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => window.open('https://www.python.org/downloads/', '_blank')}
            size="small"
          >
            Update Python
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            size="small"
          >
            Re-check
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 2,
      borderRadius: 1,
      bgcolor: "background.default",
    }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography>{status.error || "Unknown error"}</Typography>
      </Alert>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Please install Python {minPythonVersion} or later and ensure it's accessible from your PATH.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        It is crucial that you select the option to "Add Python to PATH" when installing Python, otherwise the application will not be able to find the Python executable and will not be able to run.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => window.open('https://www.python.org/downloads/', '_blank')}
          size="small"
        >
          Download Python
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          size="small"
        >
          Re-check
        </Button>
      </Box>
    </Box>
  );
}

function BackendStep({ status, minVersion, setBackendStatus, onRefresh }) {
  if (status.checking) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>Checking backend installation...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (status.installed && status.isVersionOk) {
    return (
      <Box sx={{
        p: 2,
        borderRadius: 1,
        bgcolor: "background.default",
      }}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          alignItems: 'center',
         }}>
            <Tooltip title={String(status.location)} arrow placement="top">
              <Typography 
                variant="body2" 
                color="text.secondary" 
                nowrap
                sx={{ 
                  flex: 1,
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  mr: 1,
                }}
              >
                {String(status.location)}
              </Typography>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onRefresh}
              size="small"
            >
              Re-check
            </Button>
          </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: 2,
      borderRadius: 1,
      bgcolor: "background.default",
    }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>{status.isVersionOk === false && status.version ? 'Backend update required' : 'Backend is not installed'}</AlertTitle>
        {status.error?.message || String(status.error) || "Unknown error"}
        {status.version && minVersion && (
          <Typography variant="body2" sx={{ mt: 1 }}>Detected: v{String(status.version)} · Required: v{String(minVersion)}+</Typography>
        )}
      </Alert>
      {status.location && (
        <Box sx={{ mb: 2 }}>
          <Tooltip title={String(status.location)} arrow placement="top">
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              Path: {String(status.location)}
            </Typography>
          </Tooltip>
        </Box>
      )}
      <Typography variant="body2" sx={{ mb: 2 }}>
        The Keyboard Sounds backend package is required. This will be installed or updated automatically.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={status.installing ? <CircularProgress size={16} /> : <Download />}
          onClick={async () => {
            try {
              setBackendStatus(prev => ({ ...prev, installing: true }));
              await execute("installPythonPackage");
              // Wait a moment for installation to complete
              setTimeout(() => {
                onRefresh();
              }, 2000);
            } catch (error) {
              console.error("Failed to install backend:", error);
              setBackendStatus(prev => ({ ...prev, installing: false }));
            }
          }}
          disabled={status.installing}
          size="small"
        >
          {status.installing ? 'Installing...' : (status.version && status.isVersionOk === false ? 'Update Backend' : 'Install Backend')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          size="small"
        >
          Re-check
        </Button>
      </Box>
    </Box>
  );
}

function LaunchStep({ onLaunch, isLaunching, canLaunch }) {
  return (
    <Box sx={{
      p: 3,
      borderRadius: 2,
      bgcolor: canLaunch ? "background.paper" : "background.default",
      border: `2px solid ${canLaunch ? "primary.main" : "text.disabled"}`,
      opacity: canLaunch ? 1 : 0.8,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {canLaunch ? (
          <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 24 }} />
        ) : (
          <Warning sx={{ color: 'warning.main', mr: 1, fontSize: 24 }} />
        )}
        <Typography variant="h6" color="text.primary">
          {canLaunch ? 'Ready to Launch' : 'Requirements Not Met'}
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        {!canLaunch ? (
          <Typography variant="body2" color="text.secondary">
            Please ensure all requirements are satisfied before launching Keyboard Sounds.
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            All requirements are satisfied. Click the button below to start using Keyboard Sounds.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isLaunching ? <CircularProgress size={20} /> : <PlayArrow />}
          onClick={onLaunch}
          disabled={!canLaunch || isLaunching}
          fullWidth
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            borderRadius: 2,
            boxShadow: canLaunch ? 3 : 0,
            '&:hover': {
              boxShadow: canLaunch ? 6 : 0,
            }
          }}
        >
          {isLaunching ? 'Launching...' : 'Launch Keyboard Sounds'}
        </Button>
      </Box>
    </Box>
  );
}

export default Wizard;
