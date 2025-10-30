const form = document.getElementById('registerForm');
const msg = document.getElementById('msg');
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');
const pwdInput = document.getElementById('password');
const pwdHint = document.getElementById('pwdHint');

function isValidEmail(v){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isStrongPassword(v){
  return v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
}

emailInput.addEventListener('input', ()=>{
  const ok = isValidEmail(emailInput.value.trim());
  emailInput.classList.toggle('input-valid', ok);
  emailInput.classList.toggle('input-invalid', !ok && emailInput.value.length>0);
  emailHint.textContent = ok ? 'Correo válido ✓' : 'Ingresa un correo válido (ej: usuario@dominio.com)';
  emailHint.classList.toggle('ok', ok);
  emailHint.classList.toggle('err', !ok && emailInput.value.length>0);
});

pwdInput.addEventListener('input', ()=>{
  const ok = isStrongPassword(pwdInput.value);
  pwdInput.classList.toggle('input-valid', ok);
  pwdInput.classList.toggle('input-invalid', !ok && pwdInput.value.length>0);
  pwdHint.textContent = ok ? 'Contraseña segura ✓' : 'Mínimo 8 caracteres, incluye una letra y un número.';
  pwdHint.classList.toggle('ok', ok);
  pwdHint.classList.toggle('err', !ok && pwdInput.value.length>0);
});

form.addEventListener('submit', async (e) => {
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
    msg.textContent = '¡Cuenta creada! Revisa tu correo para verificarla.';
    form.reset();
    setTimeout(()=>{ window.location.href = 'login.html'; }, 2000);
  } catch (e){
    msg.style.color = 'red';
    msg.textContent = e.message || 'Error registrando';
  }
});


