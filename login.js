// ==================== CONFIGURACIÓN Y VARIABLES ====================
const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');

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

// ==================== VALIDACIÓN EN TIEMPO REAL ====================

// Validación en tiempo real del correo electrónico
// IMPORTANTE: Esta validación se ejecuta mientras el usuario escribe
emailInput.addEventListener('input', ()=>{
  const ok = isValidEmail(emailInput.value.trim());
  emailInput.classList.toggle('input-valid', ok);
  emailInput.classList.toggle('input-invalid', !ok && emailInput.value.length>0);
  if(emailInput.value.length > 0){
    emailHint.textContent = ok ? 'Correo válido ✓' : 'Ingresa un correo válido (ej: usuario@dominio.com)';
    emailHint.classList.toggle('ok', ok);
    emailHint.classList.toggle('err', !ok);
  } else {
    emailHint.textContent = '';
  }
});

// ==================== MANEJO DEL FORMULARIO DE LOGIN ====================

/**
 * Handler para el evento de submit del formulario de login
 * IMPORTANTE: Esta función puede ser llamada múltiples veces, por lo que 
 * removemos el listener anterior antes de agregar uno nuevo para evitar duplicados
 */
let loginFormHandler = null;

/**
 * Inicializa el handler del formulario de login
 * IMPORTANTE: Esta función previene listeners duplicados removiendo el anterior antes de agregar uno nuevo
 */
function initLoginForm() {
  // Remover listener anterior si existe para evitar duplicados
  if (loginFormHandler && form) {
    form.removeEventListener('submit', loginFormHandler);
  }
  
  // Crear nuevo handler y guardarlo
  loginFormHandler = async (e) => {
  e.preventDefault();
  msg.textContent = '';
  
  const email = emailInput.value.trim();
  const password = document.getElementById('pass').value;
  
  // Validar email antes de enviar
  if(!isValidEmail(email)){
    msg.style.color = 'red';
    msg.textContent = 'Correo inválido';
    return;
  }
  
  try {
    console.log('🔄 Intentando conectar a:', `${API_URL}/auth/login`);
    
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    console.log('📡 Respuesta recibida:', res.status, res.statusText);
    
    // Verificar si la respuesta es JSON válido
    let data;
    const contentType = res.headers.get('content-type');
    if(contentType && contentType.includes('application/json')){
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Respuesta inválida del servidor: ${text}`);
    }
    
    if(!res.ok){
      throw new Error(data.error || 'Error al iniciar sesión');
    }
    
    // Guardar token de acceso
    if(data.accessToken){
      localStorage.setItem('accessToken', data.accessToken);
      console.log('✅ Token guardado en localStorage');
    } else {
      console.error('❌ No se recibió accessToken en la respuesta');
    }
    
    // Guardar rol si viene en la respuesta
    if(data.role){
      localStorage.setItem('userRole', data.role);
      console.log('✅ Rol guardado:', data.role);
    } else {
      console.warn('⚠️ No se recibió role en la respuesta');
    }
    
    // Verificar que se guardó correctamente
    const savedToken = localStorage.getItem('accessToken');
    if(!savedToken){
      throw new Error('Error: No se pudo guardar el token');
    }
    
    msg.style.color = 'green';
    msg.textContent = 'Acceso concedido ✅';
    
    // Redirigir al index con hash para forzar recarga
    setTimeout(() => {
      // Usar replace para evitar que el historial del navegador interfiera
      window.location.replace('index.html#inicio');
    }, 500);
    
  } catch (error){
    console.error('❌ Error completo:', error);
    msg.style.color = 'red';
    
    if(error.name === 'TypeError' && error.message.includes('Failed to fetch')){
      msg.textContent = 'No se puede conectar al servidor. Verifica: 1) Backend corriendo (npm run dev) 2) Puerto 4000 disponible 3) No bloqueado por firewall ❌';
      console.error('💡 Consejos:', {
        'Backend corriendo?': 'Verifica en otra pestaña: http://localhost:4000/health',
        'Error completo': error.message
      });
    } else if(error.message){
      msg.textContent = error.message;
    } else {
      msg.textContent = 'Error al iniciar sesión. Revisa la consola (F12) para más detalles ❌';
    }
  }
  };
  
  // Agregar el nuevo listener al formulario
  if (form) {
    form.addEventListener('submit', loginFormHandler);
  }
}

// Inicializar el formulario cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoginForm);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  initLoginForm();
}
