import {
  groupParentsChildrenRelations,
  fetchRelationshipsResultsType,
} from './groupParentsChildrenRelations.js'

test('should return empty array if no relations for the tables', () => {
  const result = groupParentsChildrenRelations([], ['table1', 'table2'])
  expect(result.size).toEqual(2)
  expect(result.get('table1')).toEqual({ parents: [], children: [] })
  expect(result.get('table2')).toEqual({ parents: [], children: [] })
})

test('should properly group children and parents for each tables', () => {
  const databaseRelationships: fetchRelationshipsResultsType = [
    {
      fkTable: 'private.Enrollments',
      id: 'Enrollments_CourseID_fkey',

      keys: [
        {
          fkColumn: 'CourseID',
          fkType: 'int4',
          nullable: false,
          targetColumn: 'CourseID',
          targetType: 'int4',
        },
      ],
      targetTable: 'private.Courses',
    },
    {
      fkTable: 'public.Students',
      id: 'Students_StudentCourseId_fkey',

      keys: [
        {
          fkColumn: 'StudentCourseId',
          fkType: 'int4',
          nullable: false,
          targetColumn: 'CourseID',
          targetType: 'int4',
        },
      ],
      targetTable: 'public.Courses',
    },
  ]
  const result = groupParentsChildrenRelations(databaseRelationships, [
    'private.Enrollments',
    'private.Courses',
    'public.Students',
    'public.Courses',
  ])

  expect(result.size).toEqual(4)
  expect(result.get('private.Enrollments')).toEqual({
    parents: [
      {
        fkTable: 'private.Enrollments',
        id: 'Enrollments_CourseID_fkey',

        keys: [
          {
            fkColumn: 'CourseID',
            fkType: 'int4',
            nullable: false,
            targetColumn: 'CourseID',
            targetType: 'int4',
          },
        ],
        targetTable: 'private.Courses',
      },
    ],
    children: [],
  })
  expect(result.get('private.Courses')).toEqual({
    parents: [],
    children: [
      {
        fkTable: 'private.Enrollments',
        id: 'Enrollments_CourseID_fkey',

        keys: [
          {
            fkColumn: 'CourseID',
            fkType: 'int4',
            nullable: false,
            targetColumn: 'CourseID',
            targetType: 'int4',
          },
        ],
        targetTable: 'private.Courses',
      },
    ],
  })
  expect(result.get('public.Courses')).toEqual({
    parents: [],
    children: [
      {
        fkTable: 'public.Students',
        id: 'Students_StudentCourseId_fkey',

        keys: [
          {
            fkColumn: 'StudentCourseId',
            fkType: 'int4',
            nullable: false,
            targetColumn: 'CourseID',
            targetType: 'int4',
          },
        ],
        targetTable: 'public.Courses',
      },
    ],
  })
  expect(result.get('public.Students')).toEqual({
    parents: [
      {
        fkTable: 'public.Students',
        id: 'Students_StudentCourseId_fkey',

        keys: [
          {
            fkColumn: 'StudentCourseId',
            fkType: 'int4',
            nullable: false,
            targetColumn: 'CourseID',
            targetType: 'int4',
          },
        ],
        targetTable: 'public.Courses',
      },
    ],
    children: [],
  })
})
