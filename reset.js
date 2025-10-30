const form = document.getElementById('resetForm');
const msg = document.getElementById('msg');
const emailInputR = document.getElementById('email');
function isValidEmailR(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
emailInputR.addEventListener('input', ()=>{
  const ok = isValidEmailR(emailInputR.value.trim());
  emailInputR.classList.toggle('input-valid', ok);
  emailInputR.classList.toggle('input-invalid', !ok && emailInputR.value.length>0);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  const email = emailInputR.value.trim();
  if(!isValidEmailR(email)){
    msg.style.color = 'red'; msg.textContent = 'Correo inválido'; return;
  }
  try {
    const res = await fetch('http://localhost:4000/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if(!res.ok){
      const err = await res.json().catch(()=>({error:'Error enviando correo'}));
      throw new Error(err.error || 'Error enviando correo');
    }
    msg.style.color = 'green';
    msg.textContent = 'Si el correo existe, recibirás instrucciones.';
    form.reset();
  } catch (e){
    msg.style.color = 'red';
    msg.textContent = e.message || 'Error enviando correo';
  }
});


