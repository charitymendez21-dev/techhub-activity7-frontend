import { api } from './client'

export type ReportType = 'sales' | 'product' | 'inventory' | 'customer'
export type ReportFilters = Record<string, string | number | boolean | undefined>
export type ReportResponse = {
  title: string
  columns: Record<string, string>
  summary: Record<string, unknown>
  data: Array<Record<string, unknown>>
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export const reportsApi = {
  get: async (type: ReportType, params: ReportFilters) =>
    (await api.get<ReportResponse>(`/admin/reports/${type}`, { params })).data,
  export: async (type: ReportType, format: 'pdf' | 'xlsx', params: ReportFilters) => {
    const response = await api.get<Blob>(`/admin/reports/${type}/export`, {
      params: { ...params, format },
      responseType: 'blob',
      withCredentials: true,
    })
    const disposition = response.headers['content-disposition'] as string | undefined
    const filename = disposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1]
      ?.replace(/"/g, '')
      ? decodeURIComponent(disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1]?.replace(/"/g, '') ?? '')
      : `${type}-report.${format}`

    return { blob: response.data, filename }
  },
}

export async function exportErrorMessage(error: unknown): Promise<string> {
  if (error instanceof Error && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    if (response?.data instanceof Blob) {
      try {
        const body = JSON.parse(await response.data.text()) as { message?: string; errors?: Record<string, string[]> }
        return Object.values(body.errors ?? {}).flat()[0] ?? body.message ?? 'The export could not be generated.'
      } catch {
        return 'The export could not be generated.'
      }
    }
  }
  return error instanceof Error ? error.message : 'The export could not be generated.'
}
