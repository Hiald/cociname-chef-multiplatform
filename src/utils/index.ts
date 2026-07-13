export * from './formatters'
export * from './crypto'
export * from './peruDate'

export function isDesc(str: string, isDesc: boolean) {
    return isDesc ? `${str}_DESC` : str
}
