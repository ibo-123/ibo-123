
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://driver-tracking-app-m64o.onrender.com";

console.log("🌐 API URL:", API_URL);

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

export const registerUser = async (userData) => {
  const url = `${API_URL}/api/auth/register`;

  console.log("📝 Register request:", url);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(userData),
  });

  const contentType =
    response.headers.get("content-type");

  console.log(
    "📡 Register status:",
    response.status
  );

  console.log(
    "📡 Register content-type:",
    contentType
  );

  /*
  |--------------------------------------------------------------------------
  | Make sure response is JSON
  |--------------------------------------------------------------------------
  */

  if (!contentType?.includes("application/json")) {
    const text = await response.text();

    console.error(
      "❌ Register returned HTML:",
      text.substring(0, 300)
    );

    throw new Error(
      `Server returned ${response.status} instead of JSON`
    );
  }

  const data = await response.json();

  console.log(
    "📦 Register response:",
    data
  );

  /*
  |--------------------------------------------------------------------------
  | Handle backend errors
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Registration failed"
    );
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

export const loginUser = async (
  email,
  password
) => {
  const url = `${API_URL}/api/auth/login`;

  console.log(
    "🔐 Login request:",
    url
  );

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email,
      password,
    }),
  });

  const contentType =
    response.headers.get("content-type");

  console.log(
    "📡 Login status:",
    response.status
  );

  console.log(
    "📡 Login content-type:",
    contentType
  );

  /*
  |--------------------------------------------------------------------------
  | Make sure response is JSON
  |--------------------------------------------------------------------------
  */

  if (!contentType?.includes("application/json")) {
    const text = await response.text();

    console.error(
      "❌ Login returned HTML:",
      text.substring(0, 300)
    );

    throw new Error(
      `Server returned ${response.status} instead of JSON`
    );
  }

  const data = await response.json();

  console.log(
    "📦 Login response:",
    data
  );

  /*
  |--------------------------------------------------------------------------
  | Handle backend errors
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login failed"
    );
  }

  return data;
};