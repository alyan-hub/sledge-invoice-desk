
# Sledge Invoice Desk

A small invoice approval application built with Next.js, TypeScript, PostgreSQL, and Prisma.

The application provides a simple workspace for reviewing invoices, identifying possible duplicates, and recording approval or rejection decisions.

## Features

- Three invoice queues: Processing, Needs Review, and Approved / Rejected
- Invoice details with vendor, amount, dates, and description
- Possible duplicate detection based on vendor name and invoice number
- Approve and reject actions with confirmation
- Persisted review decisions in PostgreSQL
- REST API for listing, retrieving, and updating invoices
- Responsive interface with loading and error feedback

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL
- Prisma ORM 7

## Requirements

- Node.js 20.19+ (a compatible Node.js 24 release also works)
- npm
- PostgreSQL

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the database

Create a PostgreSQL database named `sledge_invoice_desk`.

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sledge_invoice_desk"
```

Replace `YOUR_PASSWORD` with your local PostgreSQL password.

Do not commit the `.env` file.

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Apply database migrations

```bash
npm run db:migrate
```

### 5. Seed sample invoices

```bash
npm run db:seed
```

The seed script inserts five sample invoices, including a duplicate invoice pair.

### 6. Start the development server

```bash
npm run dev
```

Open http://localhost:3000.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply existing migrations |
| `npm run db:seed` | Insert sample invoices |
| `npm run db:studio` | Open Prisma Studio |

## Invoice Workflow

Invoices use one of four statuses:

| Status | Meaning |
| --- | --- |
| `PROCESSING` | Invoice is in the initial processing queue |
| `NEEDS_REVIEW` | Invoice is ready for an approval decision |
| `APPROVED` | Invoice has been approved |
| `REJECTED` | Invoice has been rejected |

Only invoices in `NEEDS_REVIEW` can be approved or rejected.

The API performs a conditional database update to prevent two competing review requests from overwriting each other.

Approved and rejected invoices cannot be reviewed again through the current API.

The application does not automatically move invoices from `PROCESSING` to `NEEDS_REVIEW`. These statuses are provided in the seeded dataset to demonstrate the three queues.

## Database Schema

The `Invoice` model contains:

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | UUID string | Primary key |
| `invoiceNumber` | String | Vendor invoice reference |
| `vendorName` | String | Invoice issuer |
| `vendorEmail` | Optional string | Vendor contact |
| `amount` | Decimal(12,2) | Invoice amount |
| `currency` | String | Currency code |
| `issueDate` | Date | Invoice issue date |
| `dueDate` | Date | Payment due date |
| `description` | Optional string | Invoice description |
| `status` | InvoiceStatus | Workflow status |
| `reviewedAt` | Optional timestamp | Time of approval or rejection |
| `createdAt` | Timestamp | Record creation time |
| `updatedAt` | Timestamp | Last modification time |

Indexes are defined on `status` and the combination of `vendorName` and `invoiceNumber`.

## Duplicate Detection

Invoices are flagged as possible duplicates when their vendor names and invoice numbers match.

The invoice list normalizes both values by trimming surrounding whitespace and converting them to lowercase.

Duplicate invoices remain separate database records with different IDs.

The application warns reviewers about possible duplicates rather than automatically deleting or rejecting them.

## REST API

### List invoices

`GET /api/invoices`

Returns all invoices.

Optional status filter:

`GET /api/invoices?status=NEEDS_REVIEW`

Response:

```json
{
  "data": [],
  "total": 0
}
```

Each invoice includes an `isDuplicate` flag.

An invalid status returns HTTP `400`.

### Get invoice details

`GET /api/invoices/:id`

Returns an invoice with duplicate information, including `duplicateInvoiceIds`.

A missing invoice returns HTTP `404`.

### Approve or reject an invoice

`PATCH /api/invoices/:id`

Request body:

```json
{
  "status": "APPROVED"
}
```

Alternatively:

```json
{
  "status": "REJECTED"
}
```

Possible responses:

- `200` — Review decision saved
- `400` — Invalid JSON or status
- `404` — Invoice not found
- `409` — Invoice is not in `NEEDS_REVIEW`
- `500` — Unexpected server error

Successful review decisions update both `status` and `reviewedAt`.

## Verification

Run the production build:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Manual checks include:

- Switching between invoice status tabs
- Opening invoice details
- Identifying the seeded duplicate invoices
- Approving an invoice
- Rejecting an invoice
- Confirming that decisions persist after refresh
- Rejecting invalid API status values
- Preventing a second decision on an already reviewed invoice

## Project Structure

```text
prisma/
  migrations/
  schema.prisma
  seed.ts

src/
  app/
    api/
      invoices/
        route.ts
        [id]/
          route.ts
    invoices/
      [id]/
        page.tsx
    page.tsx
  components/
    invoices/
      ReviewActions.tsx
  lib/
    prisma.ts
```

## Scope and Limitations

This is a focused invoice approval demo rather than a full accounts payable platform.

Authentication, role-based access, file uploads, payment processing, and audit-history records are outside the current scope.

Duplicate detection provides a review warning, not an automatic enforcement rule.

## License

Created as a technical take-home assignment for Sledge.
