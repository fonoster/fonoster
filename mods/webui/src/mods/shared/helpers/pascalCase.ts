export function toPascalCase(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toUpperCase() : word.toLowerCase()
    })
    .replace(/\s+/g, '')
}
