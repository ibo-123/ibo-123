# Test health endpoint
curl http://localhost:5000/health

# Test achievements endpoint
curl http://localhost:5000/api/achievements

# Test with authentication
curl -H "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGMzMjI5MDEwOWQ2MWIxNDM1MzlkZiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDg3ODc3NSwiZXhwIjoxNzcxNDgzNTc1fQ.VN3OkYfs9vOGXCWy9T2kLRijE7IhuorYdiNRElYTqwM" http://localhost:5000/api/users/me

# Test specific endpoints
curl "http://localhost:5000/api/achievements?category=NCC&limit=5"

# Test POST request
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'