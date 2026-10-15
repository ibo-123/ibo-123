#!/bin/bash
echo "🔄 Setting up test database..."
cd /home/andalus/project/Habesha_Freight/backend
NODE_ENV=test npx knex migrate:latest
echo "✅ Migrations completed"
