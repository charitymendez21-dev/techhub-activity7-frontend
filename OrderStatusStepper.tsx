import { Alert, Step, StepLabel, Stepper } from '@mui/material'
import type { OrderStatus } from '../../api/orders'

const steps: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return <Alert severity="error">This order was cancelled.</Alert>
  }

  return (
    <Stepper activeStep={steps.indexOf(status)} alternativeLabel>
      {steps.map((step) => <Step key={step}><StepLabel sx={{ textTransform: 'capitalize' }}>{step}</StepLabel></Step>)}
    </Stepper>
  )
}

export default OrderStatusStepper
