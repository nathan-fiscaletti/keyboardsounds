import React, { useEffect } from "react";

import { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";

import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import GitHubIcon from '@mui/icons-material/GitHub';

import {
  Button,
  Link,
  Dialog,
  DialogContent,
  SvgIcon,
} from "@mui/material";
import { execute } from "../execute";

import ReactMarkdown from "react-markdown";
import Close from "@mui/icons-material/Close";
import { LoadingButton } from "@mui/lab";

const AboutItem = ({ icon, title, value, first, last }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        mt: first ? 0 : 1,
        mb: last ? 0 : 1
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {icon}
        <Typography
          variant="body1"
          sx={{
            fontWeight: "bold",
            ml: 1,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography variant="button" color="GrayText">
        {value}
      </Typography>
    </Box>
  );
};

const InputCheckbox = ({title, first, last, checked, onChange=(value)=>{}}) => {
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
      >
        {title}
      </Typography>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
      }}>
        <Divider orientation="vertical" variant="middle" flexItem sx={{ mr: 1 }} />
        <Checkbox checked={checked} sx={{ mr: -1.5 }} onChange={(_, value) => onChange(value)} />
      </Box>
    </Box>
  )
};

function DiscordIcon(props) {
  return (
    <SvgIcon viewBox="0 0 256 256" {...props}>
      <path
        d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
        fill="currentColor"          // lets the icon inherit the button colour
        fillRule="nonzero"           // JSX uses camelCase, not fill-rule
      />
    </SvgIcon>
  );
}

const Settings = ({ appVersion, backEndVersion, notifyOnLaunch, notifyOnHide, notifyOnUpdate, onNotifyOnLaunchChanged, onNotifyOnHideChanged, onNotifyOnUpdateChanged }) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [update, setUpdate] = useState(null);
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const checkForUpdate = function () {
    setCheckingForUpdate(true);
    execute("checkForUpdate").then((release) => {
      if (release) {
        setIsUpdateAvailable(true);
        setUpdate(release);
      }

      setCheckingForUpdate(false);
      setUpdateDialogOpen(true);
    });
  };

  useEffect(() => {
    if (!updateDialogOpen) {
      setUpdate(null);
      setIsUpdateAvailable(false);
    }
  }, [updateDialogOpen]);

  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
        mt: 2,
      }}
    >
      <Dialog open={updateDialogOpen} fullWidth>
        {isUpdateAvailable && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 1,
              p: 2,
              bgcolor: "background.default",
            }}
          >
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "start",
                mb: 1,
              }}>
                <CheckCircleOutlineIcon color="success" />
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Update Available
                </Typography>
              </Box>
              <IconButton onClick={() => setUpdateDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ mt: 1 }}>Version {update.tag_name}</Typography>
            <DialogContent dividers={scroll === "paper"}>
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <Typography variant="h6" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <Typography variant="body1" {...props} />
                  ),
                  h3: ({ node, ...props }) => (
                    <Typography variant="body2" {...props} />
                  ),
                  h4: ({ node, ...props }) => (
                    <Typography variant="subtitle1" {...props} />
                  ),
                  p: ({ node, ...props }) => (
                    <Typography variant="subtitle2" {...props} />
                  ),
                }}
              >
                {update.body}
              </ReactMarkdown>
            </DialogContent>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              onClick={() => window.open(update.html_url, "_blank")}
            >
              Download
            </Button>
          </Box>
        )}
        {!isUpdateAvailable && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 1,
              p: 2,
              bgcolor: "background.default",
            }}
          >
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "start",
                mb: 1,
              }}>
                <CheckCircleOutlineIcon color="success" />
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Up to Date
                </Typography>
              </Box>
              <IconButton onClick={() => setUpdateDialogOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            <Typography variant="body" sx={{ mt: 2 }}>
              You are running the latest version of Keyboard Sounds.
            </Typography>
          </Box>
        )}
      </Dialog>

      <Typography variant="h6">Notification Preferences</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          pl: 2,
          pr: 2,
          pt: 1,
          pb: 1,
          bgcolor: "background.default",
          // minHeight: "calc(100vh - 800px)",
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

      <Typography variant="h6" sx={{ mt: 2 }}>Discord Community</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Typography variant="body2" color="GrayText">
          Join our Discord community to get support, share and download profiles, and connect with other members.
        </Typography>
        <Link
          href="https://discord.gg/gysskqts6z"
          target="_blank"
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DiscordIcon sx={{ mt: 0.5 }} />}
            sx={{ mt: 2 }}
          >
            Join the Discord Community
          </Button>
        </Link>
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>Feedback & Support</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          p: 2,
          bgcolor: "background.default",
        }}
      >
        <Typography variant="body2" color="GrayText">
          Report bugs, request features, submit suggestions, and contribute to the project on the official GitHub page.
        </Typography>
        <Link
          href="https://github.com/nathan-fiscaletti/keyboardsounds"
          target="_blank"
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon sx={{ mt: -0.5 }} />}
            sx={{
              mt: 2,
            }}
          >
            View on GitHub
          </Button>
        </Link>
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>
        About
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
        <AboutItem
          icon={<CheckCircleOutlineIcon fontSize="small" color="disabled" />}
          title="App Version"
          value={appVersion}
          first
        />
        <AboutItem
          icon={<StorageIcon fontSize="small" color="disabled" />}
          title="Backend Version"
          value={backEndVersion}
        />

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
          <Typography variant="body2" color="GrayText">Github</Typography>
          <Link href="https://github.com/nathan-fiscaletti/keyboardsounds" target="_blank">
            <Typography variant="body2">nathan-fiscaletti/keyboardsounds</Typography>
          </Link>
        </Box>

        <LoadingButton
          fullWidth
          variant="outlined"
          loading={checkingForUpdate}
          disabled={checkingForUpdate}
          loadingPosition="start"
          startIcon={<CloudDownloadIcon />}
          sx={{
            mt: 2,
          }}
          onClick={() => checkForUpdate()}
        >
          Check for Update
        </LoadingButton>
      </Box>
    </Box>
  );
};

export { Settings };
