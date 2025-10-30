const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');

const API_URL = 'http://localhost:4000';

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Validación en tiempo real del correo
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

form.addEventListener('submit', async (e) => {
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
    }
    
    // Guardar rol si viene en la respuesta
    if(data.role){
      localStorage.setItem('userRole', data.role);
    }
    
    msg.style.color = 'green';
    msg.textContent = 'Acceso concedido ✅';
    
    // Redirigir al index
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
    
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
});
