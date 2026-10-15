const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const testUri = process.env.MONGO_URI_TEST;

test("MongoDB lifecycle suite requires MONGO_URI_TEST", { skip: !testUri && "MONGO_URI_TEST is required." }, async () => {
  assert.ok(testUri, "MONGO_URI_TEST is required.");
  assert.notEqual(testUri, process.env.MONGO_URI, "MONGO_URI_TEST must not be the normal MONGO_URI.");
  await mongoose.connect(testUri);
  try {
    const databaseName = mongoose.connection.name;
    assert.match(databaseName, /test/i, "MONGO_URI_TEST must target a clearly isolated test database.");
    // The full lifecycle suite intentionally uses this real database. Codeforces is
    // stubbed at the HTTP boundary; MongoDB is never mocked or replaced in memory.
  } finally {
    await mongoose.disconnect();
  }
});
