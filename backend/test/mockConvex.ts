// Tiny in-memory mocks for Convex ctx.db & ctx.storage used by our unit tests.

type Row = Record<string, any>;
type TableName =
  | "users" | "donors" | "userInDonor" | "recievers" | "donations" | "claims"
  | "reviews" | "responses" | "charities" | "individuals";

export function makeTables(initial: Partial<Record<TableName, Row[]>> = {}) {
  const tables: Record<TableName, Row[]> = {
    users: [], donors: [], userInDonor: [], recievers: [], donations: [],
    claims: [], reviews: [], responses: [], charities: [], individuals: [],
    ...initial,
  } as any;

  // give each row an _id if missing
  for (const t of Object.keys(tables) as TableName[]) {
    tables[t] = tables[t].map((r, i) => ({ _id: r._id ?? `${t}:${i}`, ...r }));
  }
  return tables;
}

function chainWithIndex(rows: Row[]) {
  return {
    first: async () => rows[0] ?? null,
    unique: async () => rows[0] ?? null,
    collect: async () => rows.slice(),
    filter: (fn: (q: any) => any) => {
      // This is a no-op stub used only in reviews.ts for .filter(q => q.eq(...))
      // Our tests don’t use this path; listReviewsForDonor would need a richer stub.
      return chainWithIndex(rows);
    }
  };
}

export function makeDb(tables: Record<string, Row[]>) {
  return {
    // SELECT
    query: (table: TableName) => ({
      withIndex: (_: string, pred: (q: any) => any) => {
        // Our code uses pred like: q.eq("field", value)
        // Simple matcher that returns a filtered list based on a single equality
        let field = ""; let value: any;
        const q = {
          eq: (f: string, v: any) => { field = f; value = v; return null; }
        };
        pred(q as any);
        const rows = tables[table].filter(r => String(r[field]) === String(value));
        return chainWithIndex(rows);
      },
      collect: async () => tables[table].slice(),
      filter: (fn: (q: any) => any) => chainWithIndex(tables[table])
    }),

    get: async (id: any) => {
      const [table] = String(id).split(":") as [TableName];
      return tables[table]?.find(r => String(r._id) === String(id)) ?? null;
    },

    // INSERT/PATCH/DELETE
    insert: async (table: TableName, row: Row) => {
      const _id = row._id ?? `${table}:${tables[table].length + 1}`;
      const final = { _id, ...row };
      tables[table].push(final);
      return _id as any;
    },

    patch: async (id: any, updates: Row) => {
      const [table] = String(id).split(":") as [TableName];
      const list = tables[table];
      const idx = list.findIndex(r => String(r._id) === String(id));
      if (idx >= 0) list[idx] = { ...list[idx], ...updates };
    },

    delete: async (id: any) => {
      const [table] = String(id).split(":") as [TableName];
      const list = tables[table];
      const idx = list.findIndex(r => String(r._id) === String(id));
      if (idx >= 0) list.splice(idx, 1);
    },
  };
}

export function makeStorage() {
  return {
    getUrl: async (id: any) => `https://example.test/storage/${id}`,
    generateUploadUrl: async () => "https://example.test/upload"
  };
}
