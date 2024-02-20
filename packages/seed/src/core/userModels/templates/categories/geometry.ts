import { TypeTemplates } from '../types.js'

export const line: TypeTemplates = ({ input }) => `
(() => {
  let options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const points = []

  for (let i = 0; i < 4; i++) {
    const value = copycat.oneOf(${input}, options)
    points.push(value)
    options = options.filter((p) => p !== value)
  }

  return '(' + points[0] + ', ' + points[1] + '), (' + points[2] + ', ' + points[3] + ')'
})()
`

export const circle: TypeTemplates = ({ input }) => `
(() => {
  let options = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const points = []

  for (let i = 0; i < 3; i++) {
    const value = copycat.oneOf(${input}, options)
    points.push(value)
    options = options.filter((p) => p !== value)
  }

  return '((' + points[0] + ', ' + points[1] + ' ), ' + points[2] + ' )'
})()
`

export const point: TypeTemplates = ({ input }) =>
  `'(' + copycat.int(${input}, { max: 10 }) + ',' + copycat.int(${input}, { max: 10 }) + ')'`
