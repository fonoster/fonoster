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
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <BusinessIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="h1">
              Seleccionar Workspace
            </Typography>
          </Box>

          <FormControl fullWidth>
            <InputLabel id="workspace-select-label">Workspace</InputLabel>
            <Select
              labelId="workspace-select-label"
              id="workspace-select"
              value={selectedWorkspace}
              label="Workspace"
              onChange={handleChange}
            >
              {workspaces.map((workspace) => (
                <MenuItem key={workspace.id} value={workspace.id}>
                  <Box>
                    <Typography variant="subtitle1">{workspace.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {workspace.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedWorkspace && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" color="primary">
                Workspace seleccionado:{' '}
                {workspaces.find((w) => w.id === selectedWorkspace)?.name}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}

export default WorkspaceSelector