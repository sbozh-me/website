# Umami Journeys Bug Report - PostgreSQL 13 Incompatibility

> GitHub Issue: https://github.com/umami-software/umami/issues/NEW

## Bug Description

Journeys feature fails with PostgreSQL 13 despite documentation stating PostgreSQL 12.14+ is supported.

## Environment

- **Umami version:** 3.0.3
- **Database:** PostgreSQL 13 (tested with both `postgis/postgis:13-master` and `postgres:13-alpine`)
- **Deployment:** Docker

## Error Messages

When accessing Journeys:

```
PrismaClientKnownRequestError: Invalid `prisma.$queryRawUnsafe()` invocation:

Raw query failed. Code: `42601`. Message: `syntax error at or near "event"`
    at async p (.next/server/chunks/[root-of-the-server]__873d243e._.js:1:4475)
    at async u (.next/server/chunks/[root-of-the-server]__873d243e._.js:1:7649) {
  code: 'P2010',
  meta: [Object],
  clientVersion: '6.19.0'
}
```

Also encountered:

```
TypeError: Cannot read properties of undefined (reading 'dateRange')
    at g (.next/server/chunks/[root-of-the-server]__e72b30ae._.js:1859:308809)
```

## Steps to Reproduce

1. Deploy Umami 3.0.3 with PostgreSQL 13
2. Add a website and collect some analytics data
3. Navigate to Journeys feature
4. Observe the error

## Expected Behavior

According to [installation docs](https://umami.is/docs/install):

> A database. Umami supports PostgreSQL (minimum v12.14) databases.

Journeys should work with PostgreSQL 13.

## Actual Behavior

Journeys feature throws syntax errors on PostgreSQL 13.

## Workaround

Switching to `postgres:15-alpine` resolves the issue.

## Suggestion

Either:
1. Fix the SQL queries to be compatible with PostgreSQL 12.14+ as documented
2. Update documentation to specify that certain features (Journeys, Segments) require PostgreSQL 15+

## References

- Detailed commit with investigation: https://github.com/sbozh-me/website/commit/60cdfb86e298d9d9d10f7d871572ad4d041e067e
- Possibly related: #3732
