<div align="center">
<img width="400" src="https://assets-global.website-files.com/605b054afe05f848015d3a1a/65f18fcc8e3e35c93906d207_seed%20by%20snaplet.svg" alt="Seed by Snaplet logo"/>
</div>

# No data? No problem!

**Automatically seed** your database with **production-like dummy data** based on your schema for **local development** and **testing**.

## Automated values

<div align="center">
  <img width="200" src="https://assets-global.website-files.com/605b054afe05f848015d3a1a/655371beb851a7ad89e52a87_Automated%20values%20Image.svg" alt="Automated values"/>
</div>
Seed automatically determines the values in your database so you don’t have to define each and every value unless you want to be specific, in which case you just use Typescript to define those values. Our default data automatically adds necessary built-ins, like country lists, currency codes etc.

## Automated relationships

<div align="center">
  <img width="200" src="https://assets-global.website-files.com/605b054afe05f848015d3a1a/65537689bad723130b59aada_automated%20relationships%20image.svg" alt="Automated relationships"/>
</div>

Seed automatically creates relational entities so you don’t have to keep track of IDs in one table when you’re defining values in another.

## Type-safe by default

```ts
await seed.posts([{
  title: "Why you need Seed",
  author: {
    email: "snappy@snaplet.dev",
  },
  comments: (x) => x(3),
}]);
```

Seed creates a TypeScript client based off your database structure. Values are safe, and soft documented. You have the full power of the typescript language and the rich node.js infrastructure when seeding production-like data and defining data values.

## Deterministic data

<div align="center">
  <img width="200" src="https://assets-global.website-files.com/605b054afe05f848015d3a1a/65537990e71cdd72c5705028_Deterministic%20image.svg" alt="Deterministic data"/>
</div>

Seed uses [Copycat](https://github.com/snaplet/copycat) for its data generation functions, and all data generation is fully deterministic. That means if you use the same inputs, you'll always get the same data outputs. That makes seed great for consistent tests and development.

## Try out Seed

```bash
npx @snaplet/seed init
```

Learn more by reading our [documentation](https://docs.snaplet.dev/seed).


## AI-Generated Data

Use a Large Language Model (LLM) to generate examples for text-based entries. To use this feature, set up one of the following environment variables in your `.env` file:

```
OPENAI_API_KEY=<your_openai_api_key>
GROQ_API_KEY=<your_groq_api_key>
```

> Optionally, specify the AI model name with the `AI_MODEL_NAME` environment variable. Example: `AI_MODEL_NAME=gpt-4-mini`

The predicted data is saved in the file `.snaplet/dataExamples.json` and can be modified by the user.

Here is an example of a `dataExamples.json` file:

```
[
  {
    "input": "post title",
    "examples": [
      "Tips for Effective Time Management",
      ...
    ],
    "description": "This column is about storing the titles of the user-generated posts in the project."
  },
  ...
]
```

In the above example, one could modify the description and remove the examples. Running `npx @snaplet/seed sync` will then regenerate examples based on the updated description for that column.