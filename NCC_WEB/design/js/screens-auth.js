function loginCard(extra = "") {
  return `${extra}
    <div><p class="kicker">NCC_DSA</p><h1>Welcome back</h1><p class="secondary">Sign in with your email and password.</p></div>
    <form class="stack">
      ${field({ label: "Email", type: "email", value: extra ? "ibrahim.kedir@ncc.edu" : "", placeholder: "you@ncc.edu", id: "login-email" })}
      ${field({ label: "Password", type: "password", id: "login-pass", placeholder: "Password" })}
      ${btn("Log in", { nav: "dashboard", block: true })}
    </form>
    <p>New here? <a data-nav="register" href="#register">Create an account</a></p>`;
}

addScreen({
  id: "login", order: 400, group: "04 Authentication", title: "Login",
  links: [["Success", "dashboard"], ["Invalid credentials", "login-error"], ["Loading", "login-loading"], ["Server error", "login-server"], ["Create account", "register"], ["Admin login", "admin-login"]],
  render: () => authLayout(loginCard()),
});

addScreen({
  id: "login-error", order: 410, group: "04 Authentication", title: "Invalid credentials",
  links: [["Login", "login"]],
  render: () => authLayout(loginCard(`<div class="callout danger" role="alert"><strong>Invalid credentials</strong>The email or password is incorrect.</div>`)),
});

addScreen({
  id: "login-loading", order: 420, group: "04 Authentication", title: "Login loading",
  links: [["Success", "dashboard"]],
  render: () => authLayout(`<div><p class="kicker">NCC_DSA</p><h1>Welcome back</h1></div>
    ${field({ label: "Email", type: "email", value: "ibrahim.kedir@ncc.edu", disabled: true })}
    ${field({ label: "Password", type: "password", value: "secret", disabled: true })}
    ${btn("Signing in", { loading: true, block: true, disabled: true })}`),
});

addScreen({
  id: "login-server", order: 430, group: "04 Authentication", title: "Server error",
  links: [["Login", "login"]],
  render: () => authLayout(loginCard(`<div class="callout danger" role="alert"><strong>Something went wrong</strong>We couldn't sign you in. Try again in a moment.</div>`)),
});

addScreen({
  id: "admin-login", order: 440, group: "04 Authentication", title: "Admin login",
  note: "Same sign-in screen. This account lands on the admin dashboard.",
  links: [["Admin dashboard", "admin-dashboard"], ["Student login", "login"]],
  render: () => authLayout(`<div><p class="kicker">NCC_DSA</p><h1>Welcome back</h1><p class="secondary">Sign in with your email and password.</p></div>
    ${field({ label: "Email", type: "email", value: "marta.alemu@ncc.edu" })}
    ${field({ label: "Password", type: "password", value: "password" })}
    ${btn("Log in", { nav: "admin-dashboard", block: true })}
    <p class="caption">Administrator accounts open the admin shell after a successful sign-in.</p>`),
});

addScreen({
  id: "register", order: 450, group: "04 Authentication", title: "Register",
  links: [["Invalid form", "register-invalid"], ["Existing account", "register-exists"], ["Success", "register-success"], ["Login", "login"]],
  render: () => authLayout(`<div><p class="kicker">NCC_DSA</p><h1>Create your account</h1><p class="secondary">Use the email your instructors already know.</p></div>
    <form class="stack">
      ${field({ label: "Name", placeholder: "Your name" })}
      ${field({ label: "Email", type: "email", placeholder: "you@ncc.edu" })}
      ${field({ label: "Password", type: "password" })}
      ${field({ label: "Confirm password", type: "password" })}
      ${btn("Create account", { nav: "register-success", block: true })}
    </form>
    <p>Already registered? <a data-nav="login" href="#login">Log in</a></p>`),
});

addScreen({
  id: "register-invalid", order: 460, group: "04 Authentication", title: "Invalid registration",
  links: [["Register", "register"]],
  render: () => authLayout(`<div><h1>Create your account</h1></div>
    <div class="callout danger" role="alert"><strong>Check the form</strong>Fix the highlighted fields and try again.</div>
    ${field({ label: "Name", value: "", error: "Enter your name." })}
    ${field({ label: "Email", type: "email", value: "ibrahim", error: "Enter a valid email address." })}
    ${field({ label: "Password", type: "password", value: "short", error: "Use at least 8 characters." })}
    ${field({ label: "Confirm password", type: "password", value: "other", error: "Passwords do not match." })}
    ${btn("Create account", { block: true, disabled: true })}`),
});

addScreen({
  id: "register-exists", order: 470, group: "04 Authentication", title: "Existing account",
  links: [["Login", "login"]],
  render: () => authLayout(`<div><h1>Create your account</h1></div>
    ${field({ label: "Name", value: "Ibrahim Kedir" })}
    ${field({ label: "Email", type: "email", value: "ibrahim.kedir@ncc.edu", error: "An account with this email already exists." })}
    ${field({ label: "Password", type: "password", value: "password" })}
    ${field({ label: "Confirm password", type: "password", value: "password" })}
    <p><a data-nav="login" href="#login">Log in instead</a></p>`),
});

addScreen({
  id: "register-success", order: 480, group: "04 Authentication", title: "Registration success",
  links: [["Login", "login"]],
  render: () => authLayout(`<div class="status-panel"><span class="badge badge-ok"><i></i>Account created</span><h1>You're registered</h1><p class="secondary">Sign in to open your dashboard.</p>${btn("Log in", { nav: "login" })}</div>`),
});

addScreen({
  id: "session-expired", order: 490, group: "04 Authentication", title: "Session expired",
  links: [["Login", "login"]],
  render: () => authLayout(`<div class="status-panel"><h1>Session expired</h1><p class="secondary">Sign in again to continue.</p>${btn("Log in", { nav: "login" })}</div>`),
});

addScreen({
  id: "unauthorized", order: 495, group: "04 Authentication", title: "Unauthorized",
  links: [["Login", "login"]],
  render: () => authLayout(`<div class="status-panel"><h1>Sign in required</h1><p class="secondary">Your session is missing or no longer valid.</p>${btn("Log in", { nav: "login" })}</div>`),
});
