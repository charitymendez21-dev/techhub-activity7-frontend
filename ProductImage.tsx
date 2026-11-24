import { useState } from 'react'
import { Box } from '@mui/material'

const fallbackImageUrl = `${import.meta.env.BASE_URL}tech-product-placeholder.svg`

function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const imageUrl = src && failedSource !== src ? src : fallbackImageUrl

  return (
    <Box
      component="img"
      src={imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        if (!event.currentTarget.currentSrc.endsWith('/tech-product-placeholder.svg') && src) {
          setFailedSource(src)
        }
      }}
      sx={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        bgcolor: 'grey.50',
        p: 0.5,
      }}
    />
  )
}

export default ProductImage
