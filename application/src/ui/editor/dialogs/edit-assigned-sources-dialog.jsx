import React from "react";

import CloseIcon from '@mui/icons-material/Close';

import { Typography, Box, IconButton, List, Dialog } from "@mui/material";

import { AssignedSourceListItem } from '../components/assigned-source-list-item.jsx';

function EditAssignedSourcesDialog({
  open,
  onClose,
  keyConfigs,
  onKeyConfigsUpdated,
  assignedSourceKey,
  sources,
}) {
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
          <Typography variant="h6">Assigned Sources</Typography>
          <IconButton onClick={() => onClose()}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            overflow: "auto",
            maxHeight: "calc(100vh - 200px)",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        >
          {/* Make the list have a max height */}
          <List>
            {keyConfigs
              .filter((cfg) => cfg.key == assignedSourceKey)
              .map((cfg) => {
                return { cfg, source: sources[cfg.source] };
              })
              .map(({ cfg, source }) => (
                <AssignedSourceListItem
                  key={source.name}
                  name={source.name}
                  press={source.pressSound.replace(/\\/g, "/").split("/").pop()}
                  release={
                    source.pressSound && source.releaseSound
                      ? source.releaseSound.replace(/\\/g, "/").split("/").pop()
                      : null
                  }
                  isDefault={source.isDefault}
                  onDelete={() => {
                    const shouldClose =
                      keyConfigs.filter((kc) => kc.key == assignedSourceKey)
                        .length == 1;
                    onKeyConfigsUpdated(
                      keyConfigs.filter(
                        (kc) =>
                          kc.key != assignedSourceKey || kc.source != cfg.source
                      )
                    );
                    if (shouldClose) {
                      onClose();
                    }
                  }}
                />
              ))}
          </List>
        </Box>
      </Box>
    </Dialog>
  );
}

export { EditAssignedSourcesDialog };