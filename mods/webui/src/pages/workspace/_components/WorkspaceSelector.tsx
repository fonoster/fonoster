import { useState } from 'react'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  SelectChangeEvent,
  Stack
} from '@mui/material'
import BusinessIcon from '@mui/icons-material/Business'

interface Workspace {
  id: string
  name: string
  description: string
}

const workspaces: Workspace[] = [
  {
    id: '1',
    name: 'Workspace Development',
    description: 'Entorno de desarrollo principal'
  },
  {
    id: '2',
    name: 'Workspace Production',
    description: 'Entorno de producción'
  },
  {
    id: '3',
    name: 'Workspace Testing',
    description: 'Entorno de pruebas'
  }
]

const WorkspaceSelector = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState('')

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedWorkspace(event.target.value)
  }

  return (
    <Box
      sx={{ width: '100%', minWidth: 250 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <FormControl fullWidth>
        <InputLabel id="workspace-select-label">Select Workspace</InputLabel>
        <Select
          labelId="workspace-select-label"
          id="workspace-select"
          value={selectedWorkspace}
          label="Select Workspace"
          onChange={handleChange}
          size="medium"
          fullWidth
        >
          {workspaces.map((workspace) => (
            <MenuItem key={workspace.id} value={workspace.id}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{workspace.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {workspace.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default WorkspaceSelector