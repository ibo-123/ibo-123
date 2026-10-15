#!/bin/bash
echo "🔄 Setting up test database..."
export NODE_ENV=test
export TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/habesha_freight_test

# Enable extensions
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d habesha_freight_test -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || echo "Extension already exists"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d habesha_freight_test -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" 2>/dev/null || echo "Extension already exists"

# Run migrations
npx knex migrate:latest --env test

if [ $? -eq 0 ]; then
    echo "✅ Test database setup complete!"
else
    echo "❌ Migration failed"
    exit 1
fi
