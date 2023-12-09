export interface ScreenDetails {
  title: string
  subtitle: string
  description: string
  docs?: {
    url: string
    title: string
    description: string
    example: string
    tableContent?: {
      headers: string[]
      rows: string[][]
    }
  }
}
