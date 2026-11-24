import type { SxProps, Theme } from '@mui/material/styles'

const productActionButtonSx = {
  transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.3), 0 0 18px rgba(25, 118, 210, 0.45)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.2), 0 0 8px rgba(25, 118, 210, 0.3)',
  },
  '&:focus-visible': {
    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.32)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover, &:active': {
      transform: 'none',
    },
  },
} satisfies SxProps<Theme>

export default productActionButtonSx
