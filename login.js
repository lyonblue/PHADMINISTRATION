// Simulación de credenciales locales
const USUARIO = "admin";
const CONTRASENA = "12345";

const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === USUARIO && pass === CONTRASENA) {
    msg.style.color = "green";
    msg.textContent = "Acceso concedido ✅";
    // Guardar estado simulado de sesión
    localStorage.setItem("logueado", "true");
    setTimeout(() => {
      window.location.href = "index.html"; // Redirige a la página principal
    }, 1000);
  } else {
    msg.style.color = "red";
    msg.textContent = "Usuario o contraseña incorrectos ❌";
  }
});
