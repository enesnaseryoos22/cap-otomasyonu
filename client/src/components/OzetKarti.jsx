import { Paper, Typography } from '@mui/material';

export default function OzetKarti({ etiket, deger }) {
  return (
    <Paper sx={{ p: 2, minWidth: 180, flex: 1 }}>
      <Typography variant="body2" color="text.secondary">{etiket}</Typography>
      <Typography variant="h4">{deger}</Typography>
    </Paper>
  );
}
