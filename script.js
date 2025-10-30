// Utilidades simples (demo sin backend)
const $ = (q) => document.querySelector(q);

// Configuración de API
const API_URL = 'http://localhost:4000';

// Año dinámico
$('#year').textContent = new Date().getFullYear();

// Menú móvil
const mobileMenu = $('#mobileMenu');
const menuBtn = $('#menuBtn');
menuBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
  mobileMenu.style.display='none';
}));

// BLOG (ejemplos)
const blogSeed = [
  {title:'Tips para mantener las áreas comunes en buen estado', meta:'Consejos prácticos', text:'Guía rápida para prolongar la vida útil de ascensores, bombas y zonas sociales.'},
  {title:'¿Qué hacer en caso de morosidad en un PH?', meta:'Gestión financiera', text:'Buenas prácticas para reducir la mora y fortalecer la cultura de pago.'},
  {title:'Cambios en la Ley de Propiedad Horizontal en Panamá', meta:'Aspectos legales', text:'Resumen de ajustes recientes y su impacto en las Juntas Directivas.'},
];
const blogList = $('#blogList');
blogSeed.forEach(p=>{
  const el = document.createElement('article');
  el.className='card';
  el.innerHTML = `<h3>${p.title}</h3><div class="meta">${p.meta}</div><p>${p.text}</p>`;
  blogList.appendChild(el);
});

// TESTIMONIOS (Backend API)
let selectedRating = 0;

// Manejar estrellas clickeables
function initStarRating(){
  const stars = document.querySelectorAll('.star');
  const starValue = $('#starValue');
  
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updateStars();
      if(starValue) starValue.textContent = `${selectedRating} de 5`;
    });
    
    star.addEventListener('mouseenter', () => {
      highlightStars(index + 1);
    });
  });
  
  const starsContainer = document.querySelector('.stars-container');
  if(starsContainer){
    starsContainer.addEventListener('mouseleave', () => {
      updateStars();
    });
  }
}

function highlightStars(rating){
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if(index < rating){
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function updateStars(){
  highlightStars(selectedRating);
  const starValue = $('#starValue');
  if(starValue){
    if(selectedRating > 0){
      starValue.textContent = `${selectedRating} de 5`;
    } else {
      starValue.textContent = '';
    }
  }
}

// Cargar testimonios desde el backend
async function loadTestimonials(){
  const box = $('#testiList');
  if(!box) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json'
    };
    if(token){
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_URL}/testimonials`, {
      headers,
      credentials: 'include'
    });
    
    if(!res.ok){
      const errorData = await res.json().catch(()=>({error:'Error desconocido'}));
      throw new Error(errorData.error || 'Error cargando testimonios');
    }
    
    const data = await res.json();
    box.innerHTML = '';
    
  if(!data.length){
    const empty = document.createElement('div');
      empty.className = 'subtle';
      empty.textContent = 'Aún no hay testimonios.';
    box.appendChild(empty);
    return;
  }
    
    data.reverse().forEach(t => {
    const item = document.createElement('div');
      item.className = 'testimonial';
      item.dataset.testimonialId = t.id;
      const starsHTML = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
      
      // Avatar del usuario o default
      const userName = t.user_name || 'Usuario';
      const initial = userName[0]?.toUpperCase() || 'U';
      const avatarSrc = t.avatar_url || getDefaultAvatar(initial);
      const defaultAvatar = getDefaultAvatar(initial);
      
      // Botón eliminar solo si es el dueño
      const deleteBtn = t.is_owner ? `<button class="testimonial-delete" data-id="${t.id}" title="Eliminar mi testimonio">×</button>` : '';
      
      item.innerHTML = `
        <div class="testimonial-header">
          <img src="${avatarSrc}" alt="${userName}" class="testimonial-avatar" onerror="this.onerror=null; this.src='${defaultAvatar}'" />
          <div class="testimonial-author">
            <div class="stars">${starsHTML}</div>
            <div class="subtle">— ${userName}</div>
          </div>
          ${deleteBtn}
        </div>
        <p class="testimonial-message">${t.message}</p>
      `;
    box.appendChild(item);
      
      // Agregar event listener al botón eliminar
      if(t.is_owner){
        const deleteButton = item.querySelector('.testimonial-delete');
        deleteButton?.addEventListener('click', () => deleteTestimonial(t.id, item));
      }
    });
  } catch (error){
    console.error('Error cargando testimonios:', error);
    box.innerHTML = `<div class="subtle" style="color:red">Error cargando testimonios: ${error.message || 'Error desconocido'}</div>`;
  }
}

// Eliminar testimonio
async function deleteTestimonial(testimonialId, element){
  if(!confirm('¿Estás seguro de que quieres eliminar tu testimonio?')){
    return;
  }
  
  const token = localStorage.getItem('accessToken');
  if(!token){
    alert('No hay sesión activa');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/testimonials/${testimonialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if(!res.ok){
      const error = await res.json().catch(()=>({error:'Error desconocido'}));
      throw new Error(error.error || 'Error eliminando testimonio');
    }
    
    // Eliminar del DOM
    element.remove();
    await loadTestimonials(); // Recargar para actualizar is_owner de otros
  } catch (error){
    console.error('Error eliminando testimonio:', error);
    alert('Error al eliminar testimonio: ' + error.message);
  }
}

// Verificar autenticación y mostrar/ocultar formulario
function checkTestimonialAuth(){
  const token = localStorage.getItem('accessToken');
  const form = $('#testiForm');
  const prompt = $('#testiLoginPrompt');
  
  if(token && currentUser){
    // Usuario logueado: mostrar formulario
    if(form) form.style.display = 'grid';
    if(prompt) prompt.style.display = 'none';
    initStarRating();
  } else {
    // Usuario no logueado: mostrar prompt
    if(form) form.style.display = 'none';
    if(prompt) prompt.style.display = 'block';
  }
}

// Enviar testimonio
$('#testiForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const token = localStorage.getItem('accessToken');
  if(!token || !currentUser){
    alert('Por favor, inicia sesión para dejar un testimonio.');
    return;
  }
  
  if(selectedRating === 0){
    alert('Por favor, selecciona una calificación con las estrellas.');
    return;
  }
  
  const msg = $('#tMsg').value.trim();
  if(!msg){
    alert('Por favor, escribe tu testimonio.');
    return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Publicando...';
  
  try {
    const res = await fetch(`${API_URL}/testimonials`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        rating: selectedRating,
        message: msg
      })
    });
    
    if(!res.ok){
      const error = await res.json().catch(()=>({error:'Error desconocido'}));
      throw new Error(error.error || 'Error publicando testimonio');
    }
    
  e.target.reset();
    selectedRating = 0;
    updateStars();
    await loadTestimonials();
    alert('¡Gracias por tu opinión!');
  } catch (error){
    console.error('Error:', error);
    alert('Error al publicar testimonio: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Cargar testimonios al iniciar
loadTestimonials();

// SUSCRIPCIÓN (localStorage)
const SUB_KEY = 'phpty_subs_v1';
const subs = JSON.parse(localStorage.getItem(SUB_KEY)||'[]');
$('#subForm')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const email = $('#subEmail').value.trim();
  const ph = $('#subPH').value.trim();
  subs.push({email, ph, at: new Date().toISOString()});
  localStorage.setItem(SUB_KEY, JSON.stringify(subs));
  $('#subMsg').textContent = '¡Listo! Te suscribiste correctamente (demostración).';
  e.target.reset();
});

// CONSULTA RÁPIDA (solo muestra)
$('#qForm')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = $('#qName').value.trim();
  const text = $('#qText').value.trim();
  $('#qMsg').textContent = `Gracias, ${name}. Hemos recibido tu consulta: "${text}" (demostración)`;
  e.target.reset();
});

// PROPUESTA (solo muestra)
$('#propForm')?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const name = $('#pName').value.trim();
  const email = $('#pEmail').value.trim();
  const phone = $('#pPhone').value.trim();
  const ph = $('#pPH').value.trim();
  const scope = $('#pScope').value.trim();
  $('#propMsg').textContent = `¡Gracias, ${name}! Te contactaremos a ${email} / ${phone} con la propuesta para "${ph}". (demostración)`;
  e.target.reset();
});

//mostrar secciones: ahora lo maneja React (ver app-routing.js)

// Gestión de usuario logueado
// (API_URL ya está definido arriba)

function getDefaultAvatar(initial){
  return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23b90f1a"/%3E%3Ctext x="20" y="27" font-size="20" fill="white" text-anchor="middle" font-family="Arial"%3E${(initial || 'U').toUpperCase()}%3C/text%3E%3C/svg%3E`;
}

function updateUserUI(user){
  const userName = $('#userName');
  const userAvatar = $('#userAvatar');
  const dropdownAvatar = $('#dropdownAvatar');
  const editableName = $('#editableName');
  const displayName = $('#displayName');
  const saveNameBtn = $('#saveNameBtn');
  const cancelNameBtn = $('#cancelNameBtn');
  const editNameBtn = $('#editNameBtn');
  
  const fullName = user.full_name || user.email || 'Usuario';
  const initial = (user.full_name?.[0] || user.email?.[0] || 'U').toUpperCase();
  const avatarSrc = user.avatar_url || getDefaultAvatar(initial);
  
  if(userName) userName.textContent = fullName;
  if(userAvatar){
    userAvatar.src = avatarSrc;
    userAvatar.onerror = function(){ this.src = getDefaultAvatar(initial); };
  }
  if(dropdownAvatar){
    dropdownAvatar.src = avatarSrc;
    dropdownAvatar.onerror = function(){ this.src = getDefaultAvatar(initial); };
  }
  if(displayName){
    displayName.textContent = fullName;
  }
  if(editableName){
    editableName.value = user.full_name || '';
    updateOriginalName(user.full_name || '');
  }
  
  // Asegurar que esté en modo visualización (no edición)
  exitEditMode();
}

function enterEditMode(){
  const displayName = $('#displayName');
  const editableName = $('#editableName');
  const editNameBtn = $('#editNameBtn');
  const saveNameBtn = $('#saveNameBtn');
  const cancelNameBtn = $('#cancelNameBtn');
  
  if(displayName) displayName.style.display = 'none';
  if(editableName){
    editableName.style.display = 'block';
    editableName.focus();
    editableName.select();
  }
  if(editNameBtn) editNameBtn.style.display = 'none';
  if(saveNameBtn) saveNameBtn.style.display = 'block';
  if(cancelNameBtn) cancelNameBtn.style.display = 'block';
}

function exitEditMode(){
  const displayName = $('#displayName');
  const editableName = $('#editableName');
  const editNameBtn = $('#editNameBtn');
  const saveNameBtn = $('#saveNameBtn');
  const cancelNameBtn = $('#cancelNameBtn');
  
  if(displayName) displayName.style.display = 'inline';
  if(editableName) editableName.style.display = 'none';
  if(editNameBtn) editNameBtn.style.display = 'block';
  if(saveNameBtn) saveNameBtn.style.display = 'none';
  if(cancelNameBtn) cancelNameBtn.style.display = 'none';
}

let currentUser = null;

async function loadUserProfile(){
  const token = localStorage.getItem('accessToken');
  console.log('🔍 Verificando sesión...', { token: token ? 'Token existe' : 'No hay token' });
  
  if(!token){
    console.log('⚠️ No hay token, mostrando botón de login');
    const userMenu = $('#userMenu');
    const loginLink = $('#loginLink');
    if(userMenu) userMenu.style.display = 'none';
    if(loginLink) loginLink.style.display = 'inline-flex';
    return;
  }
  
  try {
    console.log('📡 Obteniendo perfil del usuario...');
    const res = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    console.log('📥 Respuesta del servidor:', res.status, res.statusText);
    
    if(!res.ok){
      console.error('❌ Token inválido o expirado');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      const userMenu = $('#userMenu');
      const loginLink = $('#loginLink');
      if(userMenu) userMenu.style.display = 'none';
      if(loginLink) loginLink.style.display = 'inline-flex';
      return;
    }
    
    const user = await res.json();
    console.log('✅ Usuario cargado:', user.email, user.full_name);
    currentUser = user;
    
    const userMenu = $('#userMenu');
    const loginLink = $('#loginLink');
    
    console.log('🎨 Elementos del DOM:', { userMenu: !!userMenu, loginLink: !!loginLink });
    
    if(userMenu && loginLink){
      userMenu.style.display = 'flex';
      loginLink.style.display = 'none';
      updateUserUI(user);
      checkTestimonialAuth(); // Verificar autenticación para testimonios
      console.log('✅ UI actualizada correctamente');
    } else {
      console.error('❌ No se encontraron elementos del DOM:', { userMenu: !!userMenu, loginLink: !!loginLink });
      // Intentar de nuevo en un momento
      setTimeout(loadUserProfile, 500);
    }
  } catch (error){
    console.error('❌ Error cargando perfil:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    const userMenu = $('#userMenu');
    const loginLink = $('#loginLink');
    if(userMenu) userMenu.style.display = 'none';
    if(loginLink) loginLink.style.display = 'inline-flex';
    checkTestimonialAuth(); // Verificar autenticación para testimonios
  }
}

// Función de logout
$('#logoutBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
  const token = localStorage.getItem('accessToken');
  
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
  } catch (error){
    console.error('Error en logout:', error);
  }
  
  // Limpiar datos locales
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userRole');
  
  // Actualizar UI
  const userMenu = $('#userMenu');
  const loginLink = $('#loginLink');
  if(userMenu) userMenu.style.display = 'none';
  if(loginLink) loginLink.style.display = 'inline-flex';
  
  // Recargar página
  window.location.reload();
});

// Toggle dropdown
const userTrigger = $('#userTrigger');
const userDropdown = $('#userDropdown');

userTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  userDropdown?.classList.toggle('open');
});

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', (e) => {
  if(userDropdown && !userDropdown.contains(e.target) && !userTrigger?.contains(e.target)){
    userDropdown.classList.remove('open');
  }
});

// Editar nombre
const editableName = $('#editableName');
const saveNameBtn = $('#saveNameBtn');
const cancelNameBtn = $('#cancelNameBtn');
const editNameBtn = $('#editNameBtn');
const displayName = $('#displayName');
const originalName = { value: '' };

// Activar modo edición al hacer click en el lápiz
editNameBtn?.addEventListener('click', () => {
  enterEditMode();
});

// Cancelar edición
cancelNameBtn?.addEventListener('click', () => {
  if(editableName){
    editableName.value = originalName.value;
  }
  exitEditMode();
});

// Guardar nombre al hacer click en el botón
saveNameBtn?.addEventListener('click', async () => {
  const newName = editableName.value.trim();
  if(!newName){
    alert('El nombre no puede estar vacío');
    return;
  }
  
  if(newName === originalName.value){
    saveNameBtn.style.display = 'none';
    return;
  }
  
  const token = localStorage.getItem('accessToken');
  if(!token){
    alert('No hay sesión activa. Por favor, inicia sesión nuevamente.');
    return;
  }
  
  // Deshabilitar botón mientras se guarda
  saveNameBtn.disabled = true;
  saveNameBtn.textContent = 'Guardando...';
  
  try {
    console.log('💾 Guardando nombre:', newName);
    console.log('🌐 URL:', `${API_URL}/me`);
    console.log('🔑 Token:', token ? 'Token presente' : 'No hay token');
    
    const res = await fetch(`${API_URL}/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ full_name: newName })
    });
    
    console.log('📥 Respuesta:', res.status, res.statusText);
    
    if(res.ok){
      const updated = await res.json();
      currentUser = updated;
      originalName.value = updated.full_name;
      exitEditMode();
      updateUserUI(updated);
      console.log('✅ Nombre actualizado:', updated.full_name);
    } else {
      const error = await res.json().catch(()=>({error:'Error desconocido'}));
      console.error('❌ Error del servidor:', error);
      alert('Error al guardar nombre: ' + (error.error || 'Error desconocido'));
    }
  } catch (error){
    console.error('❌ Error completo:', error);
    if(error.name === 'TypeError' && error.message.includes('Failed to fetch')){
      alert('No se puede conectar al servidor. Verifica:\n1) Backend corriendo (npm run dev en backend/)\n2) Puerto 4000 disponible\n3) URL correcta: ' + API_URL);
    } else {
      alert('Error de conexión: ' + (error.message || 'Error desconocido'));
    }
  } finally {
    saveNameBtn.disabled = false;
    saveNameBtn.textContent = 'Guardar';
  }
});

// Guardar nombre original cuando se carga el usuario
function updateOriginalName(name){
  originalName.value = name || '';
  if(editableName){
    editableName.value = name || '';
  }
}

// Cambiar avatar
const avatarInput = $('#avatarInput');
avatarInput?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  
  // Validar que sea imagen
  if(!file.type.startsWith('image/')){
    alert('Por favor selecciona una imagen');
    return;
  }
  
  // Validar tamaño (max 2MB)
  if(file.size > 2 * 1024 * 1024){
    alert('La imagen debe pesar menos de 2MB');
    return;
  }
  
  // Convertir a base64
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target.result;
    const token = localStorage.getItem('accessToken');
    
    // Reducir tamaño de imagen si es muy grande (comprimir a 200x200)
    let finalBase64 = base64;
    if(base64.length > 100000){ // Si es mayor a ~100KB
      // Crear imagen pequeña
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        ctx?.drawImage(img, 0, 0, 200, 200);
        finalBase64 = canvas.toDataURL('image/jpeg', 0.8);
        await uploadAvatar(finalBase64, token);
      };
      img.src = base64;
      return;
    }
    
    await uploadAvatar(finalBase64, token);
  };
  
  async function uploadAvatar(base64Data, token){
    try {
      console.log('📤 Subiendo avatar...');
      const res = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ avatar_url: base64Data })
      });
      
      if(res.ok){
        const updated = await res.json();
        currentUser = updated;
        updateUserUI(updated);
        // Recargar testimonios para actualizar avatares
        await loadTestimonials();
        console.log('✅ Avatar actualizado');
      } else {
        const error = await res.json().catch(()=>({error:'Error desconocido'}));
        console.error('❌ Error del servidor:', error);
        alert('Error al subir la imagen: ' + (error.error || 'Error desconocido'));
      }
    } catch (error){
      console.error('❌ Error actualizando avatar:', error);
      alert('Error de conexión: ' + (error.message || 'Error desconocido'));
    }
  }
  
  reader.readAsDataURL(file);
});

// Cambiar contraseña
const changePasswordBtn = $('#changePasswordBtn');
changePasswordBtn?.addEventListener('click', () => {
  // Cerrar dropdown
  userDropdown?.classList.remove('open');
  
  // Mostrar modal
  showPasswordModal();
});

function showPasswordModal(){
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Cambiar contraseña</h2>
      <form id="passwordForm">
        <div class="form-group">
          <label>Contraseña actual</label>
          <input type="password" id="currentPassword" placeholder="Tu contraseña actual" />
          <p class="subtle" style="margin-top:4px">O deja en blanco para usar el método de recuperación</p>
        </div>
        <div class="form-group">
          <label>Nueva contraseña</label>
          <input type="password" id="newPassword" placeholder="Mínimo 8 caracteres" required />
        </div>
        <div class="form-group">
          <label>Confirmar nueva contraseña</label>
          <input type="password" id="confirmPassword" placeholder="Repite la contraseña" required />
        </div>
        <div style="display:flex; gap:8px; margin-top:16px">
          <button type="submit" class="btn">Cambiar</button>
          <button type="button" class="btn" style="background:var(--muted)" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        </div>
        <p id="passwordMsg" style="margin-top:12px"></p>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPass = modal.querySelector('#currentPassword')?.value || '';
    const newPass = modal.querySelector('#newPassword')?.value || '';
    const confirmPass = modal.querySelector('#confirmPassword')?.value || '';
    const msg = modal.querySelector('#passwordMsg');
    
    if(newPass !== confirmPass){
      msg.style.color = 'red';
      msg.textContent = 'Las contraseñas no coinciden';
      return;
    }
    
    if(newPass.length < 8){
      msg.style.color = 'red';
      msg.textContent = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    
    try {
      // Si hay contraseña actual, usar endpoint de cambio directo
      if(currentPass){
        const res = await fetch(`${API_URL}/me/change-password`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });
        
        if(!res.ok){
          const data = await res.json();
          throw new Error(data.error || 'Error cambiando contraseña');
        }
        
        msg.style.color = 'green';
        msg.textContent = '✅ Contraseña cambiada exitosamente';
        setTimeout(() => modal.remove(), 2000);
      } else {
        // Usar método de recuperación (enviar email)
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser?.email })
        });
        
        msg.style.color = 'orange';
        msg.textContent = 'Se envió un enlace a tu correo para cambiar la contraseña. Revisa tu bandeja de entrada.';
      }
    } catch (error){
      msg.style.color = 'red';
      msg.textContent = error.message || 'Error cambiando contraseña';
    }
  });
}

// Cargar perfil al iniciar
// Cargar perfil cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM cargado, verificando sesión...');
  loadUserProfile();
  checkTestimonialAuth(); // Verificar autenticación inicialmente
});

// También intentar cuando la página esté completamente cargada (por si acaso)
window.addEventListener('load', () => {
  console.log('🌐 Página completamente cargada, verificando sesión...');
  // Solo intentar si aún no se ha cargado el perfil
  const userMenu = $('#userMenu');
  if(userMenu && userMenu.style.display === 'none'){
    loadUserProfile();
  }
  checkTestimonialAuth(); // Verificar autenticación
});
