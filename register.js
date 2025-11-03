// ==================== CONFIGURACIÓN Y VARIABLES ====================
const form = document.getElementById('registerForm');
const msg = document.getElementById('msg');
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');
const pwdInput = document.getElementById('password');
const pwdHint = document.getElementById('pwdHint');

const API_URL = 'http://localhost:4000';

// ==================== FUNCIONES UTILITARIAS ====================

/**
 * Valida si un correo electrónico tiene un formato válido
 * @param {string} v - El correo electrónico a validar
 * @returns {boolean} - true si el correo es válido, false en caso contrario
 */
function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Valida si una contraseña cumple con los requisitos de seguridad
 * @param {string} v - La contraseña a validar
 * @returns {boolean} - true si la contraseña es segura, false en caso contrario
 * Requisitos: Mínimo 8 caracteres, debe incluir al menos una letra y un número
 */
function isStrongPassword(v){
  return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

// ==================== VALIDACIÓN EN TIEMPO REAL ====================

// Validación en tiempo real del correo electrónico
emailInput.addEventListener('input', ()=>{
  const ok = isValidEmail(emailInput.value.trim());
  emailInput.classList.toggle('input-valid', ok);
  emailInput.classList.toggle('input-invalid', !ok && emailInput.value.length>0);
  emailHint.textContent = ok ? 'Correo válido ✓' : 'Ingresa un correo válido (ej: usuario@dominio.com)';
  emailHint.classList.toggle('ok', ok);
  emailHint.classList.toggle('err', !ok && emailInput.value.length>0);
});

// Validación en tiempo real de la contraseña
pwdInput.addEventListener('input', ()=>{
  const ok = isStrongPassword(pwdInput.value);
  pwdInput.classList.toggle('input-valid', ok);
  pwdInput.classList.toggle('input-invalid', !ok && pwdInput.value.length>0);
  pwdHint.textContent = ok ? 'Contraseña segura ✓' : 'Mínimo 8 caracteres, incluye una letra y un número.';
  pwdHint.classList.toggle('ok', ok);
  pwdHint.classList.toggle('err', !ok && pwdInput.value.length>0);
});

// ==================== MANEJO DEL FORMULARIO DE REGISTRO ====================

/**
 * Handler para el evento de submit del formulario de registro
 * IMPORTANTE: Esta función puede ser llamada múltiples veces, por lo que 
 * removemos el listener anterior antes de agregar uno nuevo para evitar duplicados
 */
let registerFormHandler = null;

/**
 * Inicializa el handler del formulario de registro
 * IMPORTANTE: Esta función previene listeners duplicados removiendo el anterior antes de agregar uno nuevo
 */
function initRegisterForm() {
  // Remover listener anterior si existe para evitar duplicados
  if (registerFormHandler && form) {
    form.removeEventListener('submit', registerFormHandler);
  }
  
  // Crear nuevo handler y guardarlo
  registerFormHandler = async (e) => {
  e.preventDefault();
  msg.textContent = '';
  const fullName = document.getElementById('fullName').value.trim();
  const email = emailInput.value.trim();
  const password = pwdInput.value;
  const password2 = document.getElementById('password2').value;
  if(!isValidEmail(email)){
    msg.style.color = 'red'; msg.textContent = 'Correo inválido'; return;
  }
  if(!isStrongPassword(password)){
    msg.style.color = 'red'; msg.textContent = 'La contraseña no cumple los requisitos'; return;
  }
  if(password !== password2){
    msg.style.color = 'red';
    msg.textContent = 'Las contraseñas no coinciden';
    return;
  }
  try {
    const res = await fetch('http://localhost:4000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    });
    if(!res.ok){
      const err = await res.json().catch(()=>({error:'Error registrando'}));
      throw new Error(err.error || 'Error registrando');
    }
    
    msg.style.color = 'green';
    msg.textContent = '¡Cuenta creada exitosamente! Serás redirigido al inicio de sesión...';
    form.reset();
    setTimeout(()=>{ window.location.href = 'login.html'; }, 2000);
  } catch (e){
    msg.style.color = 'red';
    msg.textContent = e.message || 'Error registrando';
  }
  };
  
  // Agregar el nuevo listener al formulario
  if (form) {
    form.addEventListener('submit', registerFormHandler);
  }
}

// Inicializar el formulario cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRegisterForm);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  initRegisterForm();
}


