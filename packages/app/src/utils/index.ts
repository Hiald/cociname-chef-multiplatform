export * from './logger'
export * from './formatters'
export * from './crypto'

export function isDesc(str: string, isDesc: boolean) {
    return isDesc ? `${str}_DESC` : str
}
