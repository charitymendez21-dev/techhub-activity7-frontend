import { Box, Stack, Typography } from '@mui/material'
import type { OrderHistoryEntry } from '../../api/orders'
import StatusChip from './StatusChip'

function OrderHistoryTimeline({ entries }: { entries: OrderHistoryEntry[] }) {
  if (!entries.length) return <Typography color="text.secondary">No status history is available.</Typography>

  return (
    <Stack spacing={0}>
      {entries.map((entry, index) => (
        <Stack key={entry.id} direction="row" spacing={1.5} alignItems="stretch">
          <Stack alignItems="center" sx={{ width: 18, flexShrink: 0 }}>
            <Box sx={{ width: 10, height: 10, mt: 1, borderRadius: '50%', bgcolor: 'primary.main' }} />
            {index < entries.length - 1 && <Box sx={{ width: 2, flexGrow: 1, minHeight: 34, bgcolor: 'divider' }} />}
          </Stack>
          <Box sx={{ pb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <StatusChip status={entry.to_status} />
              <Typography variant="caption" color="text.secondary">
                {new Date(entry.created_at).toLocaleString()}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {entry.from_status ? `Changed from ${entry.from_status}` : 'Order placed'}
              {entry.changed_by ? ` by ${entry.changed_by.name}` : ''}
            </Typography>
            {entry.note && <Typography variant="body2">{entry.note}</Typography>}
          </Box>
        </Stack>
      ))}
    </Stack>
  )
}

export default OrderHistoryTimeline
