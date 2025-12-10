# PostgreSQL Setup for CapRover

## POSTGRES_INITDB_ARGS Configuration

For CapRover's PostgreSQL one-click app, you typically don't need to set `POSTGRES_INITDB_ARGS` unless you have specific requirements.

### Option 1: Leave Empty (Recommended)

```env
POSTGRES_INITDB_ARGS=
```

Or simply don't add this variable at all - PostgreSQL will use defaults.

### Option 2: Set UTF-8 Encoding (If Needed)

If you want to explicitly set UTF-8 encoding:

```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=en_US.UTF-8
```

### Option 3: Custom Locale (If Needed)

For specific locale requirements:

```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=C
```

---

## Complete PostgreSQL One-Click App Environment Variables

When creating the PostgreSQL app in CapRover, here are the variables you might want to set:

### Required Variables

```env
# PostgreSQL root password (REQUIRED)
POSTGRES_PASSWORD=your_secure_postgres_password_here
```

### Optional Variables

```env
# Database name to create on first run (optional)
POSTGRES_DB=fantabuild

# Username for the database (optional, defaults to 'postgres')
POSTGRES_USER=postgres

# InitDB arguments (usually not needed)
POSTGRES_INITDB_ARGS=

# Data directory (usually not needed, CapRover handles this)
# PGDATA=/var/lib/postgresql/data
```

---

## Recommended Setup for Fanta Build

### Minimal Setup (Recommended)

```env
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=fantabuild
```

### With Custom User

```env
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_USER=fantabuild_user
POSTGRES_DB=fantabuild
```

**Note:** If you create a custom user, you'll need to use that user in your backend `DB_USER` environment variable.

---

## After PostgreSQL Installation

1. **Note the service name** - Usually `postgres` or `postgresql`
2. **Use in backend .env:**
   ```env
   DB_HOST=postgres.captain.local
   DB_PORT=5432
   DB_NAME=fantabuild
   DB_USER=postgres
   DB_PASSWORD=your_secure_password_here
   ```

3. **Run database migrations:**
   ```bash
   # Connect to PostgreSQL
   psql -h postgres.captain.local -U postgres -d fantabuild
   
   # Or via CapRover terminal
   docker exec -it srv-captain--postgres psql -U postgres -d fantabuild
   ```

4. **Run schemas:**
   ```sql
   \i /path/to/postgres-schema.sql
   \i /path/to/credits-schema.sql
   ```

---

## Common POSTGRES_INITDB_ARGS Options

### UTF-8 Encoding
```env
POSTGRES_INITDB_ARGS=--encoding=UTF8
```

### UTF-8 with Locale
```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=en_US.UTF-8
```

### Minimal Locale (C)
```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=C
```

### With Authentication
```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --auth-host=scram-sha-256
```

---

## For Fanta Build: Recommended Value

**For most cases, leave it empty or don't set it:**

```env
POSTGRES_INITDB_ARGS=
```

**Or if you want to be explicit about UTF-8:**

```env
POSTGRES_INITDB_ARGS=--encoding=UTF8
```

---

## Troubleshooting

### Database Creation Issues

If you have issues creating the database, try:

```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=C
```

### Character Encoding Issues

If you see encoding errors, use:

```env
POSTGRES_INITDB_ARGS=--encoding=UTF8 --locale=en_US.UTF-8
```

### Connection Issues

Make sure your backend uses:
- `DB_HOST=postgres.captain.local` (for CapRover one-click app)
- Correct `DB_USER` and `DB_PASSWORD`
- `DB_SSL=false` (for CapRover internal network)

---

## Quick Reference

**Minimum required:**
```env
POSTGRES_PASSWORD=your_password
```

**Recommended:**
```env
POSTGRES_PASSWORD=your_password
POSTGRES_DB=fantabuild
POSTGRES_INITDB_ARGS=
```

**With custom user:**
```env
POSTGRES_PASSWORD=your_password
POSTGRES_USER=fantabuild_user
POSTGRES_DB=fantabuild
POSTGRES_INITDB_ARGS=
```
