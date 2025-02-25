import { Box, Typography, Button } from '@mui/material';
import { Phone, WifiOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        backgroundColor: 'background.default',
        padding: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 4,
        }}
      >
        <Phone sx={{ fontSize: 60, color: 'primary.main' }} />
        <WifiOff sx={{ fontSize: 60, color: 'error.main' }} />
      </Box>

      <Typography variant="h1" color="primary" sx={{ mb: 2, fontSize: { xs: '4rem', md: '6rem' } }}>
        404
      </Typography>

      <Typography variant="h4" color="text.primary" sx={{ mb: 2 }}>
        ¡Ups! La línea está desconectada
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
        La página que estás buscando parece estar fuera de servicio o no existe. 
        ¿Quizás marcaste el número equivocado?
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={() => navigate('/')}
        startIcon={<Phone />}
      >
        Volver al Inicio
      </Button>
    </Box>
  );
};

export default NotFound; 