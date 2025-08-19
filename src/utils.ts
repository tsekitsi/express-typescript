export const isString = (string: string): boolean => {
  return typeof string === 'string'
}

export const isDate = (date: string): boolean => {
  return Boolean(Date.parse(date))
}
