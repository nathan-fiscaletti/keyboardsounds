import React, { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import Collapse from '@mui/material/Collapse';

import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

const InfoAlert = ({children, title, text}) => {
  const [alertOpen, setAlertOpen] = useState(true);

  return (
    <Box sx={{ width: "100%" }}>
      <Collapse in={alertOpen}>
        <Alert
          severity="success"
          variant="outlined"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          iconMapping={{
            success: <InfoIcon />,
          }}
          sx={{ mr: 2, mb: 1, mt: 0.5 }}
        >
          {title && <AlertTitle>{title}</AlertTitle>}
          {children}
        </Alert>
      </Collapse>
    </Box>
  );
};

export { InfoAlert };
