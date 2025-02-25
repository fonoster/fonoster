import { Box, TextField, Button, Stack } from '@mui/material';
import { useState } from 'react';

export interface ApplicationFormData {
  name: string;
  description: string;
  endpoint: string;
}

interface ApplicationFormProps {
  initialData?: ApplicationFormData;
  onSubmit: (data: ApplicationFormData) => void;
  isLoading?: boolean;
}

export default function ApplicationForm({ initialData, onSubmit, isLoading = false }: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationFormData>(
    initialData || {
      name: '',
      description: '',
      endpoint: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Nombre de la aplicación"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        
        <TextField
          fullWidth
          label="Descripción"
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          rows={3}
        />

        <TextField
          fullWidth
          label="Endpoint"
          name="endpoint"
          value={formData.endpoint}
          onChange={handleChange}
          required
        />

        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading}
        >
          {initialData ? 'Actualizar' : 'Crear'} Aplicación
        </Button>
      </Stack>
    </Box>
  );
} 