import React from "react";

import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { Typography, Box, Tooltip, IconButton, ListItem, ListItemText, Chip } from "@mui/material";

function AssignedSourceListItem({ name, press, release, isDefault, onDelete }) {
  const secondaryText =
    press && release ? `${press}, ${release}` : `${press}` || `${release}`;

  const typeVariant = press && release ? "filled" : "outlined";
  const typeLabel = press && release ? "Press & Release" : "Press Only";
  const typeIcon = press && release ? <CheckCircleIcon color="primary" /> : <ErrorOutlineIcon color="warning" /> 
  const typeColor = press && release ? "primary" : "warning";
  const typeDescription =
    press && release
      ? "Distinct press and release sounds"
      : "Only press sound";

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Box
          sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <Tooltip title={typeDescription} placement="top" arrow>
            <Chip
              sx={{ mr: 1 }}
              size="small"
              label={typeLabel}
              icon={typeIcon}
              variant={typeVariant}
              color={typeColor}
            />
          </Tooltip>

          <Tooltip title="Remove Source" placement="top" arrow>
            <IconButton
              color="primary"
              sx={{ mr: 1 }}
              onClick={() => onDelete()}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      }
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: "background.default",
        pl: 2,
      }}
    >
      <ListItemText
        primary={
          <Typography variant="body1">
            {name}{" "}
            {isDefault && (
              <Typography variant="caption" color="text.secondary">
                (default)
              </Typography>
            )}
          </Typography>
        }
        secondary={secondaryText}
        secondaryTypographyProps={{
          noWrap: true,
          variant: "caption",
          style: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "calc(100vw - 275px)",
          },
        }}
      />
    </ListItem>
  );
}

export { AssignedSourceListItem };