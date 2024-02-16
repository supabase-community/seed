import {
  createTestDb,
  createSnapletTestDb,
  createTestRole,
} from '../../testing.js'
import { withDbClient, execQueryNext } from '../client.js'
import type { Relationship } from './introspectDatabase.js'
import {
  basicIntrospectDatabase,
  introspectDatabaseV3,
} from './introspectDatabase.js'

test('basicIntrospectDatabase should return basic database structure', async () => {
  const structure = `
    CREATE SCHEMA test;
    CREATE TABLE test."Table1" (id serial PRIMARY KEY, name text);
    CREATE TYPE test."Enum1" AS ENUM ('A', 'B');
  `
  const connString = await createTestDb(structure)
  await execQueryNext(`VACUUM ANALYZE;`, connString)

  const result = await withDbClient(basicIntrospectDatabase, {
    connString: connString.toString(),
  })
  expect(result).toEqual({
    enums: [
      {
        id: 'test.Enum1',
        name: 'Enum1',
        schema: 'test',
        values: ['A', 'B'],
      },
    ],
    extensions: [],
    schemas: ['public', 'test'],
    server: {
      version: expect.stringMatching(/\d+\.\d+/),
    },
    tables: [
      {
        bytes: 0,
        columns: [
          {
            constraints: ['p'],
            default: 'nextval(\'test."Table1_id_seq"\'::regclass)',
            generated: 'NEVER',
            identity: null,
            id: 'test.Table1.id',
            maxLength: null,
            name: 'id',
            nullable: false,
            schema: 'test',
            table: 'Table1',
            type: 'int4',
            typeCategory: 'N',
            typeId: 'pg_catalog.int4',
          },
          {
            constraints: [],
            default: null,
            generated: 'NEVER',
            identity: null,
            id: 'test.Table1.name',
            maxLength: null,
            name: 'name',
            nullable: true,
            schema: 'test',
            table: 'Table1',
            type: 'text',
            typeCategory: 'S',
            typeId: 'pg_catalog.text',
          },
        ],
        id: 'test.Table1',
        name: 'Table1',
        partitioned: false,
        rows: 0,
        schema: 'test',
      },
    ],
  })
})

test('introspectDatabase should return detailed database structure', async () => {
  const structure = `
    CREATE SCHEMA test;
    CREATE TABLE test."Table1" (id serial PRIMARY KEY, name text);
    CREATE TABLE test."Table2" (id serial PRIMARY KEY, name text, table1_id integer REFERENCES test."Table1"(id));
    CREATE TYPE test."Enum1" AS ENUM ('A', 'B');
  `
  const connString = await createTestDb(structure)
  await execQueryNext(`VACUUM ANALYZE;`, connString)

  const result = await withDbClient(introspectDatabaseV3, {
    connString: connString.toString(),
  })
  expect(result).toMatchObject({
    enums: [
      {
        id: 'test.Enum1',
        name: 'Enum1',
        schema: 'test',
        values: ['A', 'B'],
      },
    ],
    extensions: [],
    sequences: {
      test: [
        {
          current: 1,
          max: 2147483647,
          min: 1,
          name: 'Table1_id_seq',
          schema: 'test',
          start: 1,
          interval: 1,
        },
        {
          current: 1,
          max: 2147483647,
          min: 1,
          name: 'Table2_id_seq',
          schema: 'test',
          start: 1,
          interval: 1,
        },
      ],
    },
    indexes: [
      {
        definition:
          'CREATE UNIQUE INDEX "Table1_pkey" ON test."Table1" USING btree (id)',
        index: 'Table1_pkey',
        indexColumns: ['id'],
        schema: 'test',
        table: 'Table1',
        type: 'btree',
      },
      {
        definition:
          'CREATE UNIQUE INDEX "Table2_pkey" ON test."Table2" USING btree (id)',
        index: 'Table2_pkey',
        indexColumns: ['id'],
        schema: 'test',
        table: 'Table2',
        type: 'btree',
      },
    ],
    schemas: ['public', 'test'],
    server: {
      version: expect.any(String),
    },
    tables: [
      {
        bytes: 0,
        partitioned: false,
        children: [
          {
            fkTable: 'test.Table2',
            id: 'Table2_table1_id_fkey',
            keys: [
              {
                fkColumn: 'table1_id',
                fkType: 'int4',
                nullable: true,
                targetColumn: 'id',
                targetType: 'int4',
              },
            ],
            targetTable: 'test.Table1',
          },
        ],
        columns: [
          {
            constraints: ['p'],
            default: 'nextval(\'test."Table1_id_seq"\'::regclass)',
            generated: 'NEVER',
            identity: null,
            id: 'test.Table1.id',
            maxLength: null,
            name: 'id',
            nullable: false,
            schema: 'test',
            table: 'Table1',
            type: 'int4',
            typeCategory: 'N',
            typeId: 'pg_catalog.int4',
          },
          {
            constraints: [],
            default: null,
            generated: 'NEVER',
            identity: null,
            id: 'test.Table1.name',
            maxLength: null,
            name: 'name',
            nullable: true,
            schema: 'test',
            table: 'Table1',
            type: 'text',
            typeCategory: 'S',
            typeId: 'pg_catalog.text',
          },
        ],
        id: 'test.Table1',
        name: 'Table1',
        parents: [],
        primaryKeys: {
          dirty: false,
          keys: [
            {
              name: 'id',
              type: 'int4',
            },
          ],
          schema: 'test',
          table: 'Table1',
          tableId: 'test.Table1',
        },
        rows: 0,
        schema: 'test',
        constraints: [
          {
            dirty: false,
            name: 'Table1_pkey',
            schema: 'test',
            table: 'Table1',
            columns: ['id'],
          },
        ],
      },
      {
        bytes: 0,
        children: [],
        partitioned: false,
        columns: [
          {
            constraints: ['p'],
            default: 'nextval(\'test."Table2_id_seq"\'::regclass)',
            generated: 'NEVER',
            identity: null,
            id: 'test.Table2.id',
            maxLength: null,
            name: 'id',
            nullable: false,
            schema: 'test',
            table: 'Table2',
            type: 'int4',
            typeCategory: 'N',
            typeId: 'pg_catalog.int4',
          },
          {
            constraints: [],
            default: null,
            generated: 'NEVER',
            identity: null,
            id: 'test.Table2.name',
            maxLength: null,
            name: 'name',
            nullable: true,
            schema: 'test',
            table: 'Table2',
            type: 'text',
            typeCategory: 'S',
            typeId: 'pg_catalog.text',
          },
          {
            constraints: ['f'],
            default: null,
            generated: 'NEVER',
            identity: null,
            id: 'test.Table2.table1_id',
            maxLength: null,
            name: 'table1_id',
            nullable: true,
            schema: 'test',
            table: 'Table2',
            type: 'int4',
            typeCategory: 'N',
            typeId: 'pg_catalog.int4',
          },
        ],
        id: 'test.Table2',
        name: 'Table2',
        parents: [
          {
            fkTable: 'test.Table2',
            id: 'Table2_table1_id_fkey',
            keys: [
              {
                fkColumn: 'table1_id',
                fkType: 'int4',
                nullable: true,
                targetColumn: 'id',
                targetType: 'int4',
              },
            ],
            targetTable: 'test.Table1',
          },
        ],
        primaryKeys: {
          dirty: false,
          keys: [
            {
              name: 'id',
              type: 'int4',
            },
          ],
          schema: 'test',
          table: 'Table2',
          tableId: 'test.Table2',
        },
        constraints: [
          {
            dirty: false,
            name: 'Table2_pkey',
            schema: 'test',
            table: 'Table2',
            columns: ['id'],
          },
        ],
        rows: 0,
        schema: 'test',
      },
    ],
  })
})

test('Read primary keys with readaccess permissions', async () => {
  const structure = `
      CREATE TABLE public."Member" (id serial PRIMARY KEY, name text);
    `
  const connString = await createTestDb(structure)
  const readAccessConnString = await createTestRole(connString)
  await execQueryNext(
    // The role pg_read_all_data only exist on pg 14+, so for pg 13 and bellow, we need to create it
    `
      DROP ROLE IF EXISTS readaccess;
      CREATE ROLE readaccess;
      GRANT CONNECT ON DATABASE "${connString.database}" TO readaccess;
      GRANT USAGE ON SCHEMA public TO readaccess;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO readaccess;
      GRANT readaccess TO "${readAccessConnString.username}";
      `,
    connString
  )
  await execQueryNext(`VACUUM ANALYZE;`, connString)

  const result = await withDbClient(introspectDatabaseV3, {
    connString: readAccessConnString.toString(),
  })

  const member = result.tables.find((t) => t.id == 'public.Member')
  expect(member?.primaryKeys!.keys).toEqual([{ name: 'id', type: 'int4' }])
})

test('introspectDatabase - get parent relationships from structure', async () => {
  const connString = await createSnapletTestDb()
  const structure = await withDbClient(introspectDatabaseV3, {
    connString: connString.toString(),
  })

  const expectedAccessTokenParent: Relationship = {
    id: 'AccessToken_userId_fkey',
    fkTable: 'public.AccessToken',
    targetTable: 'public.User',

    keys: [
      {
        fkColumn: 'userId',
        fkType: 'text',
        nullable: false,
        targetColumn: 'id',
        targetType: 'text',
      },
    ],
  }

  const actualAccessTokenParent = structure.tables.find(
    (t) => t.id == 'public.AccessToken'
  )?.parents[0]

  expect(expectedAccessTokenParent).toEqual(actualAccessTokenParent)
})

test('introspectDatabase - get primary keys from structure', async () => {
  const connString = await createSnapletTestDb()

  const structure = await withDbClient(introspectDatabaseV3, {
    connString: connString.toString(),
  })

  const primaryKeys = structure.tables.find(
    (t) => t.id == 'public.AccessToken'
  )?.primaryKeys

  expect(primaryKeys).toEqual({
    keys: [{ name: 'id', type: 'text' }],
    dirty: false,
    schema: 'public',
    table: 'AccessToken',
    tableId: 'public.AccessToken',
  })
})

test('introspectDatabase - get child relationships from structure', async () => {
  const connString = await createSnapletTestDb()

  const structure = await withDbClient(introspectDatabaseV3, {
    connString: connString.toString(),
  })

  const expectedPricingPlanChild: Relationship = {
    id: 'Organization_pricingPlanId_fkey',
    fkTable: 'public.Organization',
    targetTable: 'public.PricingPlan',

    keys: [
      {
        fkColumn: 'pricingPlanId',
        fkType: 'int4',
        nullable: true,
        targetColumn: 'id',
        targetType: 'int4',
      },
    ],
  }

  const actualPricingPlanChild = structure.tables.find(
    (t) => t.id == 'public.PricingPlan'
  )?.children[0]

  expect(expectedPricingPlanChild).toEqual(actualPricingPlanChild)
})

test('introspect with tables and schemas the user cannot access', async () => {
  const connectionString = await createTestDb()

  const restrictedString = await createTestRole(connectionString)
  const otherString = await createTestRole(connectionString)

  await execQueryNext(
    `CREATE TABLE "public"."table1" ("value" text)`,
    connectionString
  )

  await execQueryNext(
    `GRANT SELECT ON TABLE "public"."table1" TO "${restrictedString.username}"`,
    connectionString
  )

  await execQueryNext(
    `CREATE TABLE "public"."table2" ("value" text)`,
    connectionString
  )

  await execQueryNext(
    `CREATE SCHEMA "someSchema" AUTHORIZATION "${otherString.username}"`,
    connectionString
  )

  await execQueryNext(
    `CREATE TABLE "someSchema"."table3" ("value" text)`,
    connectionString
  )

  const structure = await withDbClient(introspectDatabaseV3, {
    connString: restrictedString.toString(),
  })

  expect(structure).toEqual(
    expect.objectContaining({
      schemas: ['public'],
      tables: [
        expect.objectContaining({
          schema: 'public',
          name: 'table1',
        }),
      ],
    })
  )
})

test('partitions of a partitioned table should not be present in the introspection result', async () => {
  // arrange
  const connectionString = await createTestDb()
  await execQueryNext(
    `
    CREATE TABLE coach(id uuid primary key);
    CREATE TABLE exercise (id uuid, coach_id uuid REFERENCES coach(id)) PARTITION BY list(coach_id);
    CREATE TABLE exercise1 PARTITION OF exercise FOR VALUES IN (NULL);
    CREATE TABLE exercise2 PARTITION OF exercise DEFAULT;
    `,
    connectionString
  )
  // act
  const structure = await withDbClient(introspectDatabaseV3, {
    connString: connectionString.toString(),
  })
  // assert
  expect(structure.tables.find((t) => t.id === 'public.coach')).toMatchObject({
    partitioned: false,
  })
  expect(
    structure.tables.find((t) => t.id === 'public.exercise')
  ).toMatchObject({ partitioned: true })
  const stringifiedStructure = JSON.stringify(structure)
  expect(stringifiedStructure).toContain('exercise')
  expect(stringifiedStructure).not.toContain('exercise1')
  expect(stringifiedStructure).not.toContain('exercise2')
})
