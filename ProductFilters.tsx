import { useId } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { CatalogBrand, CatalogCategory } from '../../api/products'
import { priceFormatter } from '../../config/store'

export type FilterValues = {
  category: string
  brands: string[]
  minimum: number
  maximum: number
  rating: string
  inStock: boolean
}

type Props = {
  categories: CatalogCategory[]
  categoriesLoaded: boolean
  brands: CatalogBrand[]
  minBound: number
  maxBound: number
  values: FilterValues
  onChange: (values: FilterValues) => void
  onPriceChange: (minimum: number, maximum: number) => void
  onClear: () => void
}

function ProductFilters({ categories, categoriesLoaded, brands, minBound, maxBound, values, onChange, onPriceChange, onClear }: Props) {
  const idPrefix = useId()
  const sliderMax = maxBound > minBound ? maxBound : minBound + 1
  const selectedCategory = categories.find(
    (category) => category.slug === values.category || String(category.id) === values.category,
  )
  const categoryValue = selectedCategory?.slug ?? ''

  function toggleBrand(brandId: number, checked: boolean) {
    const id = String(brandId)
    const selected = checked
      ? [...values.brands, id]
      : values.brands.filter((item) => item !== id)
    onChange({ ...values, brands: selected })
  }

  return (
    <Stack spacing={2.25}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Filters</Typography>
        <Button size="small" onClick={onClear}>Clear filters</Button>
      </Stack>

      <FormControl size="small" fullWidth>
        <InputLabel id={`${idPrefix}-category-label`} shrink>Category</InputLabel>
        <Select
          labelId={`${idPrefix}-category-label`}
          label="Category"
          displayEmpty
          value={categoryValue}
          renderValue={(selected) => (
            categories.find((category) => category.slug === selected)?.name
              ?? (categoriesLoaded && values.category ? 'Unavailable category' : 'All categories')
          )}
          onChange={(event) => onChange({ ...values, category: event.target.value })}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.slug}>
              {category.name} ({category.products_count})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <Typography fontWeight={600} gutterBottom>Brand</Typography>
        <Stack sx={{ maxHeight: 220, overflow: 'auto' }}>
          {brands.map((brand) => (
            <FormControlLabel
              key={brand.id}
              control={(
                <Checkbox
                  size="small"
                  checked={values.brands.includes(String(brand.id))}
                  onChange={(event) => toggleBrand(brand.id, event.target.checked)}
                />
              )}
              label={`${brand.name} (${brand.products_count})`}
            />
          ))}
        </Stack>
      </Box>

      <Divider />
      <Box>
        <Typography fontWeight={600} gutterBottom>Price range</Typography>
        <Slider
          value={[values.minimum, values.maximum]}
          min={minBound}
          max={sliderMax}
          step={1}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => priceFormatter.format(value)}
          onChange={(_, value) => {
            if (Array.isArray(value)) {
              onPriceChange(value[0], value[1])
            }
          }}
        />
        <Stack direction="row" spacing={1}>
          <TextField
            label="Min"
            type="number"
            size="small"
            value={values.minimum}
            inputProps={{ min: minBound, max: values.maximum, step: 0.01 }}
            onChange={(event) => onPriceChange(
              Math.min(Number(event.target.value || minBound), values.maximum),
              values.maximum,
            )}
          />
          <TextField
            label="Max"
            type="number"
            size="small"
            value={values.maximum}
            inputProps={{ min: values.minimum, max: maxBound, step: 0.01 }}
            onChange={(event) => onPriceChange(
              values.minimum,
              Math.max(Number(event.target.value || maxBound), values.minimum),
            )}
          />
        </Stack>
      </Box>

      <FormControl size="small" fullWidth>
        <InputLabel id={`${idPrefix}-rating-label`}>Minimum rating</InputLabel>
        <Select
          labelId={`${idPrefix}-rating-label`}
          label="Minimum rating"
          value={values.rating}
          onChange={(event) => onChange({ ...values, rating: event.target.value })}
        >
          <MenuItem value="">Any rating</MenuItem>
          <MenuItem value="3">3 stars and up</MenuItem>
          <MenuItem value="4">4 stars and up</MenuItem>
          <MenuItem value="4.5">4.5 stars and up</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={<Checkbox checked={values.inStock} onChange={(event) => onChange({ ...values, inStock: event.target.checked })} />}
        label="In stock only"
      />
    </Stack>
  )
}

export default ProductFilters
