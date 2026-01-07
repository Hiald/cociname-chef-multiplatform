export * from './logger'
export * from './formatters'

export function isDesc(str: string, isDesc: boolean) {
    return isDesc ? `${str}_DESC` : str
}
