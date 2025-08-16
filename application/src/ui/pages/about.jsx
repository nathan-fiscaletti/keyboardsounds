import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import GitHubIcon from '@mui/icons-material/GitHub';
import CoffeeIcon from '@mui/icons-material/Coffee';
import HandshakeIcon from '@mui/icons-material/Handshake';

import {
  Button,
  Link,
  SvgIcon,
} from "@mui/material";

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

const CoffeeIconContainer = () => {
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'row',
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      width: '124px',
      height: '124px',
      backgroundColor: '#1e1e1e',
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100,
        width: '100px',
        height: '100px',
        backgroundColor: '#393939',
      }}>
        <CoffeeIcon sx={{ 
          color: '#4caf50',
          fontSize: "48px",
        }} />
      </Box>
    </Box>
  );
};

const About = () => {
  return (
    <Box
      sx={{
        ml: 2,
        mr: 2,
        mt: 2,
      }}
    >
      <Typography variant="h6">Support the Project</Typography>
      <Box sx={{
        mt: 2,
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        width: '100%',
        alignItems: 'center',
        bgcolor: "#292929",
        borderRadius: 1,
        padding: 2,
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}>
          <Typography variant="body2" color="#BCBCBC">
              If you’re enjoying the app, you can buy me a coffee as a small token of appreciation—it’s totally optional and I’m incredibly grateful for any support.
          </Typography>
          <Link
              href="https://buymeacoffee.com/nathan.fiscaletti"
              target="_blank"
          >
              <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HandshakeIcon sx={{ mt: -0.25 }} />}
                  sx={{
                  mt: 2,
                  }}
              >
                  Buy me a coffee
              </Button>
          </Link>
        </Box>
        <CoffeeIconContainer />
      </Box>

      <Typography variant="h6" sx={{ mt: 2 }}>Discord Community</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          p: 2,
          bgcolor: "#292929",
        }}
      >
        <Typography variant="body2" color="#BCBCBC">
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

      <Typography variant="h6" sx={{ mt: 2 }}>Feedback & Contributions</Typography>
      <Box
        sx={{
          mt: 2,
          borderRadius: 1,
          p: 2,
          bgcolor: "#292929",
        }}
      >
        <Typography variant="body2" color="#BCBCBC">
          Report bugs, request features, submit suggestions, and contribute to the project on the official GitHub page.
        </Typography>
        <Link
          href="https://github.com/nathan-fiscaletti/keyboardsounds"
          target="_blank"
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon sx={{ mt: -0.25 }} />}
            sx={{
              mt: 2,
            }}
          >
            View on GitHub
          </Button>
        </Link>
      </Box>
    </Box>
  );
};

export { About };
