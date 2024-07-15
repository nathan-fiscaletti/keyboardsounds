import React, { useState } from "react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import IosShareIcon from '@mui/icons-material/IosShare';
import FileOpenIcon from '@mui/icons-material/FileOpenOutlined';
import { Chip, CircularProgress } from "@mui/material";
import { execute } from "../execute";

function ProfileListItem({ statusLoaded, status, profile: { name, author, description } }) {  
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {statusLoaded && status.profile === name && (
            <Chip sx={{ mr: 1 }} size="small" label="Active" variant="filled" color="success" />
          )}
          <Tooltip title="Export & Share" placement="top" arrow>
            <IconButton color="primary" sx={{ mr: 1 }}>
              <IosShareIcon />
            </IconButton>
          </Tooltip>

          {isDeleting && (
            <CircularProgress size={18} sx={{mr: 2, ml: 1}} />
          )}

          {!isDeleting && (
            <Tooltip title="Delete Profile" placement="top" arrow>
                <IconButton
                  color="primary"
                  sx={{ mr: 1 }}
                  disabled={status.profile === name}
                  onClick={() => {
                    setIsDeleting(true);
                    execute(`remove-profile --name "${name}"`, (_) => {
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
      sx={{
        borderRadius: 1,
        mb: 1,
        bgcolor: "background.default",
        pl: 2,
      }}
    >
      <Tooltip followCursor title={(
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Typography variant="body1">
            {name} <Typography variant="caption" color="text.secondary">by <i>{author}</i></Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">{description}</Typography>
        </Box>
      )}>
      <ListItemText
        primary={(
          <Typography variant="body1">
            {name} <Typography variant="caption" color="text.secondary">by <i>{author}</i></Typography>
          </Typography>
        )}
        secondary={description}
        secondaryTypographyProps={{
          noWrap: true,
          variant: "caption",
          style: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 'calc(100vw - 275px)',
          }
        }}
      />
      </Tooltip>
    </ListItem>
  );
}

const Profiles = ({statusLoaded, status, profilesLoaded, profiles}) => {
  const [profileSearchValue, setProfileSearchValue] = useState('');

  return (
    <Box sx={{
      ml: 2,
      mt: 2,
    }}>
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
        <Typography variant="h6">Profiles</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileOpenIcon />}
          onClick={() => execute("importProfile")}
        >
          Import
        </Button>
      </Box>
      <Typography variant="body2" color="GrayText" sx={{ mb: 0.5, mt: 0.5, mr: 2 }}>
        Manage your keyboard sound profiles here. You can import, export, and delete profiles.
      </Typography>
      <Box sx={{ pr: 2 }}>
      <TextField
        label="Search"
        size="small"
        fullWidth
        sx={{
          mt: 1,
          mb: 1,
        }}
        value={profileSearchValue}
        onChange={
          e => setProfileSearchValue(e.target.value)
        }
        InputProps={{
          endAdornment: <InputAdornment position="end"><SearchIcon /></InputAdornment>,
        }}
      />
      </Box>
      <List sx={{
        overflow: 'auto',
        pr: 2, 
        maxHeight: 'calc(100vh - 338px)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.07)',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
      }}>
        {profilesLoaded && profiles.filter(p => profileSearchValue === "" || p.name.toLowerCase().includes(profileSearchValue.toLowerCase())).map((profile) => (
          <ProfileListItem statusLoaded={statusLoaded} status={status} key={profile.name} profile={profile} />
        ))}
      </List>
    </Box>
  );
};

export { Profiles };