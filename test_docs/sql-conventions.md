# SQL Coding Conventions

A comprehensive specification for SQL Server development. These conventions ensure consistency, readability, and maintainability across all database projects.

---

## Category 1: Naming Conventions

### 1.1 — General Identifier Casing

- **snake_case (lowercase with underscores)** for all identifiers:
  - Tables, columns, schemas, constraints, indexes, parameters
- **UPPERCASE** for all SQL keywords:
  - `SELECT`, `FROM`, `WHERE`, `JOIN`, `CREATE`, `ALTER`, `BEGIN`, `END`, etc.
- **Exceptions:**
  - Stored procedures and functions use **PascalCase**
  - Triggers use **PascalCase** after `tr` prefix

```sql
-- Yes
SELECT
  id,
  first_name,
  last_name
FROM hr.employee
WHERE is_active = 1;

-- No
SELECT
  EmployeeId,
  FirstName,
  LastName
FROM HR.Employee
WHERE IsActive = 1;
```

### 1.2 — Table Names

- **Singular nouns** (the table represents the entity, not the collection)
- **No prefixes** like `tbl_`

```sql
-- Yes
employee
order_detail
audit_log

-- No
employees
tbl_employee
t_order_details
```

### 1.3 — Primary Key Naming

- **Format:** `id`
- Always the first column in the table definition

```sql
-- Yes
CREATE TABLE hr.employee
(
  id INT NOT NULL,
  first_name VARCHAR(50),
  ...
);

-- No
CREATE TABLE hr.employee
(
  employee_id INT NOT NULL,
  emp_id INT NOT NULL,
  ...
);
```

### 1.4 — Foreign Key Column Naming

- **Default:** `{referenced_table}_id`
- **Exception:** Use role-based naming when it clarifies the relationship

```sql
-- Standard reference
CREATE TABLE sales.order
(
  id INT NOT NULL,
  customer_id INT NOT NULL     -- references customer.id
);

-- Role-based for clarity
CREATE TABLE hr.employee
(
  id INT NOT NULL,
  department_id INT NOT NULL,  -- references department.id
  manager_id INT NOT NULL,     -- references employee.id (self-reference)
  hired_by_id INT NOT NULL     -- references employee.id (different role)
);
```

### 1.5 — Constraint Naming

- **Always use named constraints** (never rely on system-generated names)
- **Define constraints inline in CREATE TABLE** whenever possible
- Use ALTER TABLE only when necessary (e.g., circular references, post-migration additions)

| Constraint Type | Pattern | Example |
|-----------------|---------|---------|
| Primary Key | `pk_{table}` | `pk_employee` |
| Foreign Key | `fk_{table}_{column}` | `fk_employee_department_id` |
| Unique | `uq_{table}_{column(s)}` | `uq_employee_email` |
| Check | `ck_{table}_{column}` | `ck_employee_salary` |
| Default | `df_{table}_{column}` | `df_employee_is_active` |

```sql
-- Yes: Inline named constraints
CREATE TABLE hr.employee
(
  id INT NOT NULL,
  department_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  salary DECIMAL(12,2) NOT NULL,
  is_active BIT NOT NULL,
  CONSTRAINT pk_employee PRIMARY KEY (id),
  CONSTRAINT fk_employee_department_id FOREIGN KEY (department_id) REFERENCES hr.department(id),
  CONSTRAINT uq_employee_email UNIQUE (email),
  CONSTRAINT ck_employee_salary CHECK (salary >= 0),
  CONSTRAINT df_employee_is_active DEFAULT (1) FOR is_active
);

-- No: Unnamed or ALTER TABLE when avoidable
CREATE TABLE hr.employee
(
  id INT NOT NULL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  ...
);
```

### 1.6 — Index Naming

| Index Type | Pattern | Example |
|------------|---------|---------|
| Clustered | `ix_{table}_clustered` | `ix_employee_clustered` |
| Non-clustered | `ix_{table}_{column(s)}` | `ix_employee_last_name` |
| Unique index | `ux_{table}_{column(s)}` | `ux_employee_email` |
| Filtered | `ix_{table}_{column(s)}_filtered` | `ix_employee_is_active_filtered` |

Note: Clustered indexes on non-PK columns are rare but follow this pattern when needed.

```sql
-- Non-clustered
CREATE NONCLUSTERED INDEX ix_employee_last_name 
ON hr.employee(last_name);

-- Unique index
CREATE UNIQUE INDEX ux_employee_email 
ON hr.employee(email);

-- Filtered index
CREATE NONCLUSTERED INDEX ix_employee_is_active_filtered 
ON hr.employee(department_id)
WHERE is_active = 1;
```

### 1.7 — View Naming

- **No prefixes** (no `vw_`, `v_`, etc.)
- **Use plural form** of the entity to distinguish from the table
- **Use descriptive names** when multiple views exist, especially for filtered views

```sql
-- Table
CREATE TABLE hr.employee (...);

-- Views (plural, descriptive)
CREATE VIEW hr.employees AS ...
CREATE VIEW hr.active_employees AS ...
CREATE VIEW hr.terminated_employees AS ...

-- No
CREATE VIEW hr.vw_employee AS ...
CREATE VIEW hr.employee_view AS ...
```

### 1.8 — Stored Procedure Naming

- **Format:** `{Action}{Entity}[{Detail}]` in **PascalCase**
- **No prefix** (no `usp_`, `sp_`, etc.)
- Deliberately deviates from snake_case to visually distinguish procedures as callable actions

```sql
-- Yes
CREATE PROCEDURE hr.AddEmployee ...
CREATE PROCEDURE hr.GetEmployeeById ...
CREATE PROCEDURE hr.DeactivateEmployee ...
CREATE PROCEDURE sales.ProcessOrderRefund ...

-- No
CREATE PROCEDURE hr.usp_add_employee AS ...
CREATE PROCEDURE hr.add_employee AS ...
CREATE PROCEDURE hr.Employee_Add AS ...
```

### 1.9 — Function Naming

- **Format:** `{Action}{Entity}[{Detail}]` in **PascalCase** (same as procedures)

```sql
-- Yes
CREATE FUNCTION hr.GetEmployeeFullName(@id INT) ...
CREATE FUNCTION sales.CalculateOrderTotal(@order_id INT) ...

-- No
CREATE FUNCTION hr.fn_get_employee_full_name(@id INT) ...
```

### 1.10 — Parameter Naming

- **snake_case with `@` prefix**
- Match column names when the parameter represents a column value

```sql
-- Yes
CREATE PROCEDURE hr.AddEmployee
  @first_name VARCHAR(50),
  @last_name VARCHAR(50),
  @department_id INT,
  @is_active BIT = 1
AS
BEGIN
  ...
END;

-- No
CREATE PROCEDURE hr.AddEmployee
  @FirstName VARCHAR(50),
  @p_first_name VARCHAR(50),
  @fname VARCHAR(50)
AS
BEGIN
  ...
END;
```

### 1.11 — Trigger Naming

- **Format:** `tr{Before|After}{Table}{Action}` in **PascalCase** (after `tr` prefix)
- Include timing (`Before`/`After`) for cross-platform consistency with MySQL/PostgreSQL
- Use triggers sparingly — powerful but potentially dangerous if misused

```sql
-- Yes
CREATE TRIGGER hr.trAfterEmployeeInsert
ON hr.employee
AFTER INSERT
AS
BEGIN
  ...
END;

CREATE TRIGGER hr.trAfterEmployeeUpdate
ON hr.employee
AFTER UPDATE
AS
BEGIN
  ...
END;

-- No
CREATE TRIGGER hr.tr_employee_insert AS ...
CREATE TRIGGER hr.employee_trigger AS ...
```

### 1.12 — Schema Naming

- **Single word preferred**, snake_case lowercase if multiple words needed
- Short, descriptive names representing functional areas
- Avoid `dbo` for application objects — reserve for system or legacy objects

```sql
-- Yes (single word preferred)
CREATE SCHEMA hr;
CREATE SCHEMA sales;
CREATE SCHEMA audit;
CREATE SCHEMA lookup;

-- Acceptable (snake_case if needed)
CREATE SCHEMA data_import;
CREATE SCHEMA third_party;

-- No
CREATE TABLE dbo.employee (...);
CREATE SCHEMA HumanResources;
CREATE SCHEMA DataImport;
```

---

## Category 2: Formatting

### 2.1 — Indentation

- **Use spaces** for indentation (not tabs)
- **2 spaces** equals one level of indentation

```sql
-- Yes (2 spaces per level)
CREATE PROCEDURE hr.GetEmployeeById
  @id INT
AS
BEGIN
  SET NOCOUNT ON;

  SELECT
    id,
    first_name,
    last_name
  FROM hr.employee
  WHERE id = @id;
END;
```

### 2.2 — BEGIN/END Block Style (Allman Bracing)

- **Allman style** — `BEGIN` and `END` on their own lines
- `BEGIN` aligned with the opening statement
- Content inside indented one level (2 spaces)

```sql
-- Yes (Allman style)
IF @id IS NOT NULL
BEGIN
  UPDATE hr.employee
  SET is_active = 0
  WHERE id = @id;
END
ELSE
BEGIN
  RAISERROR('Invalid employee ID', 16, 1);
END;

-- No (K&R style / inline)
IF @id IS NOT NULL BEGIN
  UPDATE hr.employee
  SET is_active = 0;
END;
```

### 2.3 — SELECT Column Listing

- **Short queries:** multiple columns allowed on one line
- **FROM always on a new line**
- **80 character limit** — if SELECT line exceeds 80 characters, restructure to one column per line
- **Always trailing commas** (never leading)

```sql
-- Yes (short query, under 80 chars)
SELECT id, first_name, last_name, email
FROM hr.employee
WHERE is_active = 1;

-- Yes (exceeds 80 chars, restructured)
SELECT
  id,
  first_name,
  last_name,
  email,
  department_id,
  hire_date,
  termination_date,
  is_active
FROM hr.employee
WHERE is_active = 1;

-- No (wrapping mid-line instead of restructuring)
SELECT id, first_name, last_name, email, department_id,
  hire_date, termination_date, is_active
FROM hr.employee;

-- No (leading commas)
SELECT
  id
  , first_name
  , last_name
FROM hr.employee;
```

### 2.4 — Clause Placement

- **Major clauses on their own line:** `FROM`, `WHERE`, `JOIN`, `GROUP BY`, `HAVING`, `ORDER BY`
- Clause keywords aligned at the same indentation level as `SELECT`

```sql
-- Yes
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1
ORDER BY last_name ASC;

-- Yes (longer query)
SELECT
  e.id,
  e.first_name,
  e.last_name,
  d.name AS department_name
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id
WHERE e.is_active = 1
GROUP BY e.id, e.first_name, e.last_name, d.name
HAVING COUNT(*) > 1
ORDER BY e.last_name ASC;

-- No (clauses on same line)
SELECT id, first_name FROM hr.employee WHERE is_active = 1 ORDER BY last_name;
```

### 2.5 — JOIN Formatting

- **JOIN type on its own line**, aligned with `FROM`
- **ON clause on the same line as JOIN** (if short)
- If ON clause is complex or exceeds 80 characters, break to next line indented

```sql
-- Yes (simple ON, same line)
SELECT e.id, e.first_name, d.name AS department_name
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id
WHERE e.is_active = 1;

-- Yes (complex ON, break to new line)
SELECT o.id, c.name
FROM sales.order AS o
JOIN sales.customer AS c
  ON c.id = o.customer_id AND c.region_id = o.region_id
WHERE o.status = 'pending';
```

### 2.6 — WHERE Clause Formatting

- **Simple condition:** stays on same line as `WHERE`
- **Multiple conditions:** each condition on its own line, `AND`/`OR` at the beginning of the line
- Conditions indented one level from `WHERE`

```sql
-- Yes (simple)
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1;

-- Yes (multiple conditions)
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1
  AND department_id = 5
  AND hire_date >= '2020-01-01';

-- Yes (with OR grouping)
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1
  AND (department_id = 5 OR department_id = 6)
  AND hire_date >= '2020-01-01';

-- No (AND/OR at end of line)
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1 AND
  department_id = 5 AND
  hire_date >= '2020-01-01';
```

### 2.7 — Table Aliases

- **Single table queries:** never use alias
- **Multi-table queries:** always use short, meaningful aliases
- **Always use the `AS` keyword** for aliases
- Aliases should be lowercase, typically 1-3 characters based on table name

```sql
-- Yes (single table, no alias)
SELECT id, first_name, last_name
FROM hr.employee
WHERE is_active = 1;

-- Yes (multi-table, use AS keyword)
SELECT e.id, e.first_name, d.name AS department_name
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id;

-- No (single table with alias)
SELECT e.id, e.first_name, e.last_name
FROM hr.employee AS e
WHERE e.is_active = 1;

-- No (missing AS keyword)
SELECT e.id, d.name
FROM hr.employee e
JOIN hr.department d ON d.id = e.department_id;
```

### 2.8 — Column Aliases

- **Always use `AS` keyword** for column aliases
- Column aliases in snake_case

```sql
-- Yes
SELECT
  e.first_name AS first_name,
  e.last_name AS last_name,
  d.name AS department_name,
  CONCAT(e.first_name, ' ', e.last_name) AS full_name
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id;

-- No (missing AS keyword)
SELECT
  e.first_name first_name,
  d.name department_name
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id;
```

### 2.9 — INSERT Statement Formatting

- **Column list on same line as `INSERT INTO`** if short (under 80 chars)
- **VALUES on its own line**
- If column list exceeds 80 characters, break to one column per line
- Always explicitly list columns (never rely on implicit column order)
- **Exception:** When performing many sequential INSERTs, columns and values may exceed 80 characters

```sql
-- Yes (short column list)
INSERT INTO hr.employee (first_name, last_name, email, is_active)
VALUES ('John', 'Doe', 'jdoe@example.com', 1);

-- Yes (long column list, restructured)
INSERT INTO hr.employee
(
  first_name,
  last_name,
  email,
  department_id,
  hire_date,
  is_active
)
VALUES
(
  'John',
  'Doe',
  'jdoe@example.com',
  5,
  '2024-01-15',
  1
);

-- Yes (bulk inserts, exception allows longer lines)
INSERT INTO hr.employee (first_name, last_name, email, department_id, hire_date, is_active)
VALUES ('John', 'Doe', 'jdoe@example.com', 5, '2024-01-15', 1);

INSERT INTO hr.employee (first_name, last_name, email, department_id, hire_date, is_active)
VALUES ('Jane', 'Smith', 'jsmith@example.com', 3, '2024-01-16', 1);

-- No (implicit columns)
INSERT INTO hr.employee
VALUES (1, 'John', 'Doe', 'jdoe@example.com', 5, '2024-01-15', 1);
```

### 2.10 — UPDATE Statement Formatting

- **SET on its own line** after `UPDATE`
- **One column assignment per line** if multiple columns, indented one level
- **Short updates (single column):** SET and assignment can stay on same line
- WHERE clause on its own line

```sql
-- Yes (single column)
UPDATE hr.employee
SET is_active = 0
WHERE id = 123;

-- Yes (multiple columns)
UPDATE hr.employee
SET
  first_name = 'John',
  last_name = 'Smith',
  email = 'jsmith@example.com',
  modified_at = GETDATE()
WHERE id = 123;

-- Yes (with FROM clause)
UPDATE e
SET
  e.department_id = d.id,
  e.modified_at = GETDATE()
FROM hr.employee AS e
JOIN hr.department AS d ON d.name = 'Engineering'
WHERE e.id = 123;

-- No (multiple assignments on one line)
UPDATE hr.employee
SET first_name = 'John', last_name = 'Smith', email = 'jsmith@example.com'
WHERE id = 123;
```

### 2.11 — DELETE Statement Formatting

- **FROM on same line as DELETE**
- **JOIN and WHERE each on their own line**
- Always include a WHERE clause (or explicit comment if intentionally deleting all rows)

```sql
-- Yes
DELETE FROM hr.employee
WHERE id = 123;

-- Yes (with join)
DELETE FROM e
FROM hr.employee AS e
JOIN hr.department AS d ON d.id = e.department_id
WHERE d.name = 'Archived';

-- Yes (intentional full delete, commented)
-- Intentionally deleting all rows from staging table
DELETE FROM staging.import_record;

-- No (WHERE on same line)
DELETE FROM hr.employee WHERE id = 123;

-- No (missing WHERE without explanation)
DELETE FROM hr.employee;
```

### 2.12 — CREATE TABLE Formatting

- **Opening parenthesis on its own line**
- **Each column on its own line**, indented one level
- **Constraints at the end**, after all columns
- **Closing parenthesis on its own line**

```sql
-- Yes
CREATE TABLE hr.employee
(
  id INT NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  department_id INT NOT NULL,
  hire_date DATE NOT NULL,
  is_active BIT NOT NULL,
  CONSTRAINT pk_employee PRIMARY KEY (id),
  CONSTRAINT fk_employee_department_id FOREIGN KEY (department_id) REFERENCES hr.department(id),
  CONSTRAINT uq_employee_email UNIQUE (email)
);

-- No (opening paren on same line)
CREATE TABLE hr.employee (
  id INT NOT NULL,
  ...
);

-- No (inline unnamed constraints)
CREATE TABLE hr.employee
(
  id INT NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  ...
);
```

### 2.13 — Stored Procedure / Function Formatting

- **Parameters each on their own line**, indented one level
- **AS on its own line**
- **BEGIN/END in Allman style**
- **SET NOCOUNT ON** as first statement inside BEGIN (for procedures)

```sql
-- Yes
CREATE PROCEDURE hr.GetEmployeesByDepartment
  @department_id INT,
  @is_active BIT = 1
AS
BEGIN
  SET NOCOUNT ON;

  SELECT id, first_name, last_name
  FROM hr.employee
  WHERE department_id = @department_id
    AND is_active = @is_active;
END;

-- Yes (function)
CREATE FUNCTION hr.GetEmployeeFullName
(
  @first_name VARCHAR(50),
  @last_name VARCHAR(50)
)
RETURNS VARCHAR(101)
AS
BEGIN
  RETURN @first_name + ' ' + @last_name;
END;

-- No (parameters on same line)
CREATE PROCEDURE hr.GetEmployeesByDepartment @department_id INT, @is_active BIT = 1
AS
BEGIN
  ...
END;
```

### 2.14 — CASE Expression Formatting

- **CASE on its own line** (or inline for simple expressions)
- **WHEN/THEN each indented one level**
- **ELSE indented same level as WHEN**
- **END on its own line**, aligned with CASE

```sql
-- Yes (multi-line)
SELECT
  id,
  first_name,
  CASE
    WHEN is_active = 1 THEN 'Active'
    WHEN is_active = 0 THEN 'Inactive'
    ELSE 'Unknown'
  END AS status
FROM hr.employee;

-- Yes (simple inline, short)
SELECT
  id,
  CASE WHEN is_active = 1 THEN 'Yes' ELSE 'No' END AS active_flag
FROM hr.employee;
```

### 2.15 — Subquery Formatting

- **Opening parenthesis on same line** as the context
- **Subquery content indented one level**
- **Closing parenthesis on its own line**

```sql
-- Yes (in WHERE clause)
SELECT id, first_name, last_name
FROM hr.employee
WHERE department_id IN (
  SELECT id
  FROM hr.department
  WHERE is_active = 1
);

-- Yes (as derived table)
SELECT e.id, e.first_name, d.active_count
FROM hr.employee AS e
JOIN (
  SELECT department_id, COUNT(*) AS active_count
  FROM hr.employee
  WHERE is_active = 1
  GROUP BY department_id
) AS d ON d.department_id = e.department_id;
```

### 2.16 — CTE (Common Table Expression) Formatting

- **WITH on its own line**
- **CTE name and AS on same line**, opening parenthesis on its own line
- **CTE query indented one level**
- **Multiple CTEs separated by comma** at end of closing parenthesis

```sql
-- Yes (single CTE)
WITH active_employees AS
(
  SELECT id, first_name, last_name, department_id
  FROM hr.employee
  WHERE is_active = 1
)
SELECT e.id, e.first_name, d.name AS department_name
FROM active_employees AS e
JOIN hr.department AS d ON d.id = e.department_id;

-- Yes (multiple CTEs)
WITH active_employees AS
(
  SELECT id, first_name, last_name, department_id
  FROM hr.employee
  WHERE is_active = 1
),
department_counts AS
(
  SELECT department_id, COUNT(*) AS employee_count
  FROM hr.employee
  WHERE is_active = 1
  GROUP BY department_id
)
SELECT e.id, e.first_name, dc.employee_count
FROM active_employees AS e
JOIN department_counts AS dc ON dc.department_id = e.department_id;
```

### 2.17 — Blank Lines and Spacing

- **One blank line** between major statement blocks
- **No blank line** between closely related clauses (SELECT, FROM, WHERE, etc.)
- **One blank line** after `SET NOCOUNT ON;` in procedures
- **No trailing whitespace** on any line

```sql
-- Yes
CREATE PROCEDURE hr.GetEmployeeReport
  @department_id INT
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @today DATE = GETDATE();

  SELECT id, first_name, last_name
  FROM hr.employee
  WHERE department_id = @department_id
    AND is_active = 1;

  SELECT COUNT(*) AS total_count
  FROM hr.employee
  WHERE department_id = @department_id;
END;
```

---

## Category 3: Structure & Best Practices

### 3.1 — Schema Usage

- **Always use schemas** — never place application objects in `dbo`
- **Always qualify table references** with schema name
- Group related objects logically

```sql
-- Yes
CREATE TABLE hr.employee (...);
SELECT id, first_name FROM hr.employee;

-- No
CREATE TABLE dbo.employee (...);
SELECT id, first_name FROM employee;
```

### 3.2 — Transaction Handling

- **Always use explicit transactions** for multi-statement operations
- **BEGIN TRANSACTION on its own line**
- **COMMIT/ROLLBACK on their own lines**
- Use TRY/CATCH for error handling with transactions

```sql
BEGIN TRANSACTION;

BEGIN TRY
  UPDATE hr.employee
  SET is_active = 0
  WHERE id = @id;

  INSERT INTO audit.change_log (table_name, record_id, action)
  VALUES ('employee', @id, 'deactivate');

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

### 3.3 — Error Handling

- **Always use TRY/CATCH** in stored procedures
- **THROW** to re-raise errors
- **RAISERROR** for custom error messages
- Capture error details when logging

```sql
CREATE PROCEDURE hr.DeactivateEmployee
  @id INT
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE hr.employee
    SET is_active = 0
    WHERE id = @id;

    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;

    DECLARE @error_message NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @error_severity INT = ERROR_SEVERITY();
    DECLARE @error_state INT = ERROR_STATE();

    RAISERROR(@error_message, @error_severity, @error_state);
  END CATCH;
END;
```

### 3.4 — NULL Handling

- **Be explicit about NULLability** — always specify `NULL` or `NOT NULL`
- **Use `IS NULL` / `IS NOT NULL`** for comparisons (never `= NULL`)
- **Use `COALESCE`** over `ISNULL` for portability

```sql
-- Yes
CREATE TABLE hr.employee
(
  id INT NOT NULL,
  middle_name VARCHAR(50) NULL,
  termination_date DATE NULL,
  is_active BIT NOT NULL
);

SELECT id, first_name
FROM hr.employee
WHERE termination_date IS NULL;

SELECT id, COALESCE(middle_name, '') AS middle_name
FROM hr.employee;

-- No
WHERE termination_date = NULL;
```

### 3.5 — Data Type Preferences

| Use Case | Preferred Type | Avoid |
|----------|----------------|-------|
| Primary keys | `INT` or `BIGINT` | `UNIQUEIDENTIFIER` (unless necessary) |
| Boolean | `BIT` | `INT`, `CHAR(1)` |
| Currency/financial | `DECIMAL(12,2)` | `FLOAT`, `MONEY` |
| Date only | `DATE` | `DATETIME` |
| Date and time | `DATETIME2` | `DATETIME` |
| Short strings | `VARCHAR(n)` | `CHAR(n)` |
| Long text | `VARCHAR(MAX)` | `TEXT` (deprecated) |

### 3.6 — Comments and Documentation

- **Use block comments `/* */`** for procedure/function headers
- **Use line comments `--`** for inline explanations
- **Comment non-obvious logic**, not every line

```sql
/*
  Returns all active employees for a given department.
  
  Parameters:
    @department_id - ID of the department to filter by
    @include_contractors - Include contractor employees (default: 0)
*/
CREATE PROCEDURE hr.GetEmployeesByDepartment
  @department_id INT,
  @include_contractors BIT = 0
AS
BEGIN
  SET NOCOUNT ON;

  SELECT id, first_name, last_name
  FROM hr.employee
  WHERE department_id = @department_id
    AND is_active = 1
    -- Contractors have employee_type = 2
    AND (@include_contractors = 1 OR employee_type != 2);
END;
```

### 3.7 — Temporary Tables vs Table Variables vs CTEs

- **CTEs** — prefer for readability and single-use derived results
- **Temp tables (`#table`)** — use for larger datasets, multiple references, or when indexes needed
- **Table variables (`@table`)** — use for small datasets (<1000 rows)
- **Avoid global temp tables (`##table`)** unless specifically required

### 3.8 — SELECT * Usage

- **Never use `SELECT *`** in production code, stored procedures, or views
- **Always explicitly list columns**
- **Exception:** `SELECT *` is acceptable inside `EXISTS`

```sql
-- Yes (in EXISTS)
SELECT id, first_name
FROM hr.employee AS e
WHERE EXISTS (
  SELECT *
  FROM sales.order AS o
  WHERE o.customer_id = e.id
);

-- No (production code)
SELECT *
FROM hr.employee;
```

### 3.9 — ORDER BY Usage

- **Always use column names**, never ordinal positions
- **Be explicit about sort direction** — always specify `ASC` or `DESC`

```sql
-- Yes
SELECT id, first_name, last_name
FROM hr.employee
ORDER BY last_name ASC, first_name ASC;

-- No
SELECT id, first_name, last_name
FROM hr.employee
ORDER BY 3, 2;
```

### 3.10 — Avoiding Cursors

- **Avoid cursors** whenever possible — prefer set-based operations
- **If unavoidable**, use `LOCAL FAST_FORWARD` for read-only forward traversal
- Always explicitly close and deallocate cursors

### 3.11 — Use of NOLOCK and Query Hints

- **Avoid `NOLOCK`** in production code — risk of dirty reads
- **Use query hints sparingly** and only when performance testing justifies
- **Comment any hint usage** explaining why it's needed

```sql
-- Yes (hint with justification)
SELECT id, first_name, last_name
FROM hr.employee WITH (NOLOCK)  -- Acceptable for reporting, dirty reads OK
WHERE is_active = 1;
```

### 3.12 — UNION vs UNION ALL

- **Prefer `UNION ALL`** when duplicates are acceptable or impossible
- **Use `UNION`** only when duplicate elimination is explicitly required

### 3.13 — Stored Procedure Output and Return Values

- **Use OUTPUT parameters** for returning single values
- **Use RETURN** only for status codes (0 = success, non-zero = error)
- **Use result sets** for returning tabular data

### 3.14 — Dynamic SQL

- **Avoid dynamic SQL** when possible
- **When necessary, use `sp_executesql`** with parameterization
- **Validate/whitelist** any dynamic object names

```sql
-- Yes (parameterized dynamic SQL)
IF @column_name NOT IN ('first_name', 'last_name', 'email')
BEGIN
  RAISERROR('Invalid column name', 16, 1);
  RETURN;
END;

DECLARE @sql NVARCHAR(MAX);
DECLARE @params NVARCHAR(MAX);

SET @sql = N'
  SELECT id, first_name, last_name, email
  FROM hr.employee
  WHERE ' + QUOTENAME(@column_name) + N' = @value;
';

SET @params = N'@value NVARCHAR(100)';

EXEC sp_executesql @sql, @params, @value = @search_value;

-- No (SQL injection risk)
SET @sql = 'SELECT * FROM hr.employee WHERE ' + @column_name + ' = ''' + @search_value + '''';
EXEC (@sql);
```

### 3.15 — Identity Columns and Key Generation

- **Use `IDENTITY`** for auto-incrementing surrogate keys on transactional tables
- **Use `SCOPE_IDENTITY()`** to retrieve the last inserted identity value — never `@@IDENTITY`
- **Specify seed and increment explicitly** (`IDENTITY(1,1)`)
- **Lookup tables:** Use `INT NOT NULL` without `IDENTITY` — IDs are manually specified

```sql
-- Transactional table (auto-increment)
CREATE TABLE hr.employee
(
  id INT IDENTITY(1,1) NOT NULL,
  ...
);

-- Lookup table (manual IDs)
CREATE TABLE lookup.state
(
  id INT NOT NULL,
  code CHAR(2) NOT NULL,
  name VARCHAR(50) NOT NULL,
  CONSTRAINT pk_state PRIMARY KEY (id)
);

INSERT INTO lookup.state (id, code, name)
VALUES
(1, 'PA', 'Pennsylvania'),
(2, 'NY', 'New York');
```

### 3.16 — Semicolon Usage

- **Always terminate statements with semicolons**
- Required before `WITH` (CTE), `THROW`, `MERGE`

```sql
-- Yes
SET NOCOUNT ON;

DECLARE @id INT = 1;

SELECT id, first_name, last_name
FROM hr.employee
WHERE id = @id;

-- No
SET NOCOUNT ON

DECLARE @id INT = 1

SELECT id, first_name, last_name
FROM hr.employee
WHERE id = @id
```

---

## Category 4: Anti-Patterns

Avoid these common mistakes:

| Anti-Pattern | Why It's Bad | Instead |
|--------------|--------------|---------|
| `SELECT *` | Breaks on schema changes, returns unnecessary data | Explicitly list columns |
| `@@IDENTITY` | Returns wrong value if triggers exist | Use `SCOPE_IDENTITY()` |
| Cursors for set-based work | Slow, resource-intensive | Use set-based operations |
| String concatenation in dynamic SQL | SQL injection vulnerability | Use `sp_executesql` with parameters |
| `NOLOCK` everywhere | Dirty reads, inconsistent data | Use only with justification and comment |
| Implicit column order in INSERT | Breaks on schema changes | Always list columns explicitly |
| Deprecated types (`TEXT`, `NTEXT`, `IMAGE`) | Deprecated, limited functionality | Use `VARCHAR(MAX)`, `NVARCHAR(MAX)`, `VARBINARY(MAX)` |
| Implicit NULLability | Unclear intent, varies by settings | Always specify `NULL` or `NOT NULL` |
| `sp_` prefix on procedures | Reserved for system procedures, performance hit | Use PascalCase action-based names |
| `FLOAT`/`REAL` for money | Precision loss | Use `DECIMAL(p,s)` |
| Ordinal positions in ORDER BY | Fragile, unclear | Use column names |
| Nested views (views on views) | Hard to debug, performance issues | Use CTEs or flatten logic |
| Functions on indexed columns in WHERE | Kills index usage (non-sargable) | Refactor to keep column clean |
| `DISTINCT` to hide join problems | Masks duplicate root cause | Fix the join logic |
| Unqualified column names in JOINs | Ambiguous, breaks on schema changes | Always use table alias prefix |
| Large `IN` lists (100+ values) | Poor performance, hard to maintain | Use JOINs with temp table or table variable |
| Implicit type conversions | Performance hit, unexpected results | Ensure matching types |
| `BETWEEN` for datetime with time | Misses end boundary records | Use `>= AND <` pattern |
| Unnamed constraints | Hard to manage, system-generated names | Always name constraints |
| `UNION` when `UNION ALL` works | Unnecessary sort overhead | Use `UNION ALL` when duplicates OK |
| Missing `SET NOCOUNT ON` | Extra network traffic, breaks some ORMs | Always include in procedures |

---

## Quick Reference

### Naming Summary

| Object | Convention | Example |
|--------|------------|---------|
| Table | snake_case, singular | `employee`, `order_detail` |
| Column | snake_case | `first_name`, `is_active` |
| Primary Key | `id` | `id` |
| Foreign Key | `{table}_id` or role-based | `department_id`, `manager_id` |
| Schema | snake_case, prefer single word | `hr`, `sales`, `data_import` |
| View | plural, no prefix | `employees`, `active_employees` |
| Stored Procedure | PascalCase, action-based | `AddEmployee`, `GetEmployeeById` |
| Function | PascalCase, action-based | `CalculateOrderTotal` |
| Trigger | `tr{Before\|After}{Table}{Action}` | `trAfterEmployeeInsert` |
| Constraint | `{type}_{table}[_{column}]` | `pk_employee`, `fk_employee_department_id` |
| Index | `ix_{table}_{column}` | `ix_employee_last_name` |

### Formatting Summary

- **Indentation:** 2 spaces
- **Keywords:** UPPERCASE
- **Identifiers:** lowercase snake_case (except procedures/functions/triggers)
- **BEGIN/END:** Allman style (own lines)
- **Commas:** Trailing, never leading
- **Line length:** 80 characters, restructure if exceeded
- **Semicolons:** Always terminate statements