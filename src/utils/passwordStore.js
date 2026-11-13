// Wachtwoord voor boekrecepten, onthouden op dit apparaat (localStorage)
// of alleen voor deze sessie (sessionStorage).
const KEY = "kmj-book-password";

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getPassword() {
  return safe(() => sessionStorage.getItem(KEY) || localStorage.getItem(KEY));
}

export function setPassword(password, remember) {
  safe(() => {
    sessionStorage.setItem(KEY, password);
    if (remember) localStorage.setItem(KEY, password);
  });
}

export function forgetPassword() {
  safe(() => {
    sessionStorage.removeItem(KEY);
    localStorage.removeItem(KEY);
  });
}
