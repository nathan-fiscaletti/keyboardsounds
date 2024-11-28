import React from "react";

import CloseIcon from '@mui/icons-material/Close';

import { Typography, Box, IconButton, Dialog } from "@mui/material";

import { CopyBlock, solarizedDark } from 'react-code-blocks';

function ViewYamlDialog({ open, onClose, yaml }) {
  return (
    <Dialog open={open} fullWidth>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">View Profile YAML</Typography>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>

        <CopyBlock
          text={yaml}
          language={"yaml"}
          showLineNumbers={false}
          customStyle={{
            padding: "16px",
          }}
          theme={{ ...solarizedDark, backgroundColor: "#121212" }}
        />
      </Box>
    </Dialog>
  );
}

export { ViewYamlDialog };