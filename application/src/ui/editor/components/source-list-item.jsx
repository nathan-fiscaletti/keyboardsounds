import React from "react";

import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import { Typography, Box, Tooltip, IconButton, ListItem, ListItemText, Chip } from "@mui/material";

function SourceListItem({ name, press, release, isDefault }) {
  const secondaryText =
    press && release ? `${press}, ${release}` : `${press}` || `${release}`;

  const typeVariant = press && release ? "filled" : "outlined";
  const typeLabel = press && release ? "Press & Release" : "Press Only";
  const typeDescription =
    press && release
      ? "Distinct press and release sounds"
      : "Single press sound";

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
              variant={typeVariant}
              color="primary"
            />
          </Tooltip>

          <Tooltip title="Listen" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }}>
              <PlayArrowIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Source" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }}>
              <EditIcon />
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

export { SourceListItem };
