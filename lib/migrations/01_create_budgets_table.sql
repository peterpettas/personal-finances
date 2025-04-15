CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  "categoryId" VARCHAR(50),
  amount DOUBLE PRECISION,
  month VARCHAR(50),
  createdat VARCHAR(50) DEFAULT CURRENT_TIMESTAMP,
  updatedat VARCHAR(50) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("categoryId", month)
); 