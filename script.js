/**
 * Script principal de la aplicación frontend
 * Maneja toda la lógica del cliente:
 * - Gestión de noticias (público y administración)
 * - Autenticación y gestión de perfil de usuario
 * - Testimonios
 * - Panel de administración (usuarios, noticias, testimonios, estadísticas)
 */

// ==================== UTILIDADES ====================

/**
 * Selector rápido para un elemento del DOM
 * @param {string} q - Selector CSS
 * @returns {Element|null} Primer elemento que coincida o null
 */
const $ = (q) => document.querySelector(q);

/**
 * Selector rápido para múltiples elementos del DOM
 * @param {string} q - Selector CSS
 * @returns {NodeList} Lista de elementos que coincidan
 */
const $$ = (q) => document.querySelectorAll(q);

// ==================== CONFIGURACIÓN ====================

/** URL base de la API del backend */
const API_URL = 'http://localhost:4000';

/**
 * Función helper para escapar HTML y prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado seguro para HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== INICIALIZACIÓN BÁSICA ====================

// Actualizar año en el footer dinámicamente
const yearEl = $('#year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

// Menú móvil: toggle al hacer click en el botón
const mobileMenu = $('#mobileMenu');
const menuBtn = $('#menuBtn');
menuBtn?.addEventListener('click', () => {
  mobileMenu?.classList.toggle('open');
});
// Cerrar menú móvil al hacer click en cualquier enlace
$$('#mobileMenu a')?.forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.style.display = 'none';
  });
});

// ==================== SISTEMA DE NOTICIAS ====================

/** Almacena las noticias cargadas para evitar recargas innecesarias */
let newsData = [];

/**
 * Carga las noticias públicas desde la API
 * Las noticias son visibles para todos los usuarios sin autenticación
 */
async function loadNews() {
  const newsList = $('#newsList');
  const newsEmpty = $('#newsEmpty');
  const newsCarousel = $('#newsCarousel');
  
  if (!newsList) return;
  
  try {
    const cacheBuster = Date.now();
    const res = await fetch(`${API_URL}/news?_=${cacheBuster}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    newsData = Array.isArray(data) ? data : [];
    
    if (newsData.length === 0) {
      if (newsCarousel) newsCarousel.style.display = 'none';
      if (newsEmpty) {
        newsEmpty.style.display = 'block';
        newsEmpty.textContent = 'Aún no hay noticias publicadas.';
      }
      return;
    }
    
    if (newsCarousel) newsCarousel.style.display = 'flex';
    if (newsEmpty) newsEmpty.style.display = 'none';
    
    renderNewsCarousel();
    
  } catch (error) {
    console.error('Error cargando noticias:', error);
    if (newsCarousel) newsCarousel.style.display = 'none';
    if (newsEmpty) {
      newsEmpty.style.display = 'block';
      newsEmpty.textContent = 'Error cargando noticias. Intenta más tarde.';
      newsEmpty.style.color = 'red';
    }
  }
}

/**
 * Renderiza el carrusel de noticias en la sección pública
 * Crea elementos HTML para cada noticia con imagen, título, subtítulo y descripción
 * Habilita click en cada noticia para abrir modal con detalles completos
 */
function renderNewsCarousel() {
  const newsList = $('#newsList');
  if (!newsList || !newsData.length) return;
  
  newsList.innerHTML = '';
  
  newsData.forEach((news, index) => {
    const item = document.createElement('div');
    item.className = 'news-item';
    
    const date = new Date(news.created_at).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Cargar todas las imágenes de forma lazy para mejor rendimiento
    item.innerHTML = `
      <img src="${escapeHtml(news.image_url)}" alt="${escapeHtml(news.title)}" class="news-item-image" loading="lazy" />
      <div class="news-item-content">
        <h3 class="news-item-title">${escapeHtml(news.title)}</h3>
        <p class="news-item-subtitle">${escapeHtml(news.subtitle)}</p>
        <p class="news-item-description">${escapeHtml(news.description)}</p>
        <div class="news-item-meta">
          ${news.author_name ? `Por ${escapeHtml(news.author_name)} • ` : ''}${date}
        </div>
      </div>
    `;
    
    // Agregar click para abrir modal
    item.addEventListener('click', () => {
      openNewsModal(news);
    });
    
    // Agregar indicador visual de que es clickeable
    item.style.cursor = 'pointer';
    item.title = 'Click para ver más detalles';
    
    newsList.appendChild(item);
  });
  
  // Ocultar botones de navegación y indicador ya que todas las noticias son visibles
  const prevBtn = $('#newsPrevBtn');
  const nextBtn = $('#newsNextBtn');
  const indicator = $('#newsIndicator');
  
  if (prevBtn) prevBtn.style.display = 'none';
  if (nextBtn) nextBtn.style.display = 'none';
  if (indicator) indicator.style.display = 'none';
}

// ==================== ADMINISTRACIÓN DE NOTICIAS ====================

/**
 * Carga las noticias en el panel de administración
 * Requiere autenticación con token de administrador
 * Muestra lista con opciones para eliminar noticias
 */
async function loadAdminNews() {
  const list = $('#adminNewsList');
  if (!list) return;
  
  list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">Cargando noticias...</p>';
  
  try {
    const cacheBuster = Date.now();
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      list.innerHTML = '<p style="color:red; text-align:center; padding:20px;">No hay sesión activa.</p>';
      return;
    }
    
    const res = await fetch(`${API_URL}/news?_=${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    
    const news = await res.json();
    const newsArray = Array.isArray(news) ? news : [];
    
    list.innerHTML = '';
    
    if (newsArray.length === 0) {
      list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">No hay noticias publicadas.</p>';
      return;
    }
    
    // Renderizar lista de noticias
    newsArray.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'admin-list-item';
      
      const date = new Date(item.created_at).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      div.innerHTML = `
        <div class="admin-list-item-content">
          <h4>${escapeHtml(item.title || 'Sin título')}</h4>
          <p class="subtle">${escapeHtml(item.subtitle || '')} • ${date}</p>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn-delete" data-id="${item.id}">Eliminar</button>
        </div>
      `;
      
      list.appendChild(div);
      
      const deleteBtn = div.querySelector('.admin-btn-delete');
      deleteBtn?.addEventListener('click', () => {
        deleteAdminNews(item.id, div);
      });
    });
    
  } catch (error) {
    console.error('Error cargando noticias en admin:', error);
    list.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error: ${error.message}</p>`;
  }
}

/**
 * Elimina una noticia del sistema (solo administradores)
 * @param {string} newsId - ID de la noticia a eliminar
 * @param {HTMLElement} element - Elemento DOM de la noticia para removerlo de la UI
 */
async function deleteAdminNews(newsId, element) {
  if (!confirm('¿Estás seguro de eliminar esta noticia?')) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const res = await fetch(`${API_URL}/news/${newsId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error eliminando noticia');
    }
    
    element.remove();
    
    // Recargar noticias públicas también
    await loadNews();
    
    alert('✅ Noticia eliminada exitosamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

// ==================== FORMULARIO DE CREACIÓN DE NOTICIAS ====================

/**
 * Maneja el formulario para crear nuevas noticias
 * Incluye preview de imagen, validación y compresión de imágenes antes de enviar
 */
const adminNewsForm = $('#adminNewsForm');
if (adminNewsForm) {
  // Preview de imagen
  const imageInput = $('#adminNewsImage');
  const previewDiv = $('#adminNewsImagePreview');
  const previewImg = $('#adminNewsPreviewImg');
  
  imageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImg.src = event.target.result;
        previewDiv.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Envío del formulario
  adminNewsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const title = $('#adminNewsTitle').value.trim();
    const subtitle = $('#adminNewsSubtitle').value.trim();
    const description = $('#adminNewsDescription').value.trim();
    const imageFile = imageInput?.files[0];
    
    if (!imageFile) {
      alert('Por favor selecciona una imagen');
      return;
    }
    
    const submitBtn = adminNewsForm.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Publicar Noticia';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando...';
    
    try {
      // Comprimir imagen
      const imageUrl = await compressImageFile(imageFile);
      
      // Enviar noticia
      const res = await fetch(`${API_URL}/news`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          subtitle,
          description,
          image_url: imageUrl
        })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || error.details || 'Error publicando noticia');
      }
      
      // Limpiar formulario
      adminNewsForm.reset();
      previewDiv.style.display = 'none';
      
      // Recargar listas
      await Promise.all([loadAdminNews(), loadNews()]);
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      alert('✅ Noticia publicada exitosamente');
      
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert('❌ Error: ' + error.message);
    }
  });
}

/**
 * Comprime una imagen antes de enviarla al servidor
 * Redimensiona si es muy grande y reduce la calidad para optimizar tamaño
 * @param {File} file - Archivo de imagen a comprimir
 * @returns {Promise<string>} Promise que resuelve con data URL de la imagen comprimida (base64)
 * @throws {Error} Si la imagen es demasiado grande incluso después de compresión
 */
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        let quality = 0.7;
        if (file.size > 500000) quality = 0.6;
        if (file.size > 1000000) quality = 0.5;
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        if (dataUrl.length > 15000000) {
          reject(new Error('La imagen es demasiado grande. Por favor usa una imagen más pequeña.'));
          return;
        }
        
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}


// ==================== TABS DE ADMINISTRACIÓN ====================

/**
 * Maneja el sistema de tabs en el panel de administración
 * Permite cambiar entre: Noticias, Usuarios, Testimonios, Estadísticas
 */
const adminTabs = $$('.admin-tab');
adminTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Actualizar tabs
    adminTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Actualizar contenido
    $$('.admin-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const targetContent = $(`#admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Cargar datos según el tab
    if (tabName === 'news') {
      loadAdminNews();
    } else if (tabName === 'users') {
      loadAdminUsers();
    } else if (tabName === 'testimonials') {
      loadAdminTestimonials();
    } else if (tabName === 'stats') {
      loadAdminStats();
    }
  });
});

// Cargar datos iniciales si el tab de noticias está activo
if ($('.admin-tab.active[data-tab="news"]')) {
  loadAdminNews();
}

// ==================== GESTIÓN DE USUARIOS (ADMIN) ====================

/**
 * Maneja el formulario para crear nuevos usuarios desde el panel de administración
 * Los administradores pueden crear usuarios con roles específicos (admin o user)
 */
const adminCreateUserForm = $('#adminCreateUserForm');
if (adminCreateUserForm) {
  adminCreateUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const fullName = $('#adminUserName').value.trim();
    const email = $('#adminUserEmail').value.trim();
    const password = $('#adminUserPassword').value;
    const role = $('#adminUserRole').value;
    
    if (!fullName || !email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    if (password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    const submitBtn = adminCreateUserForm.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Crear Usuario';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando...';
    
    try {
      const res = await fetch(`${API_URL}/admin/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          skipVerification: true
        })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'Error creando usuario');
      }
      
      // Limpiar formulario
      adminCreateUserForm.reset();
      
      // Recargar lista de usuarios
      await loadAdminUsers();
      
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      alert('✅ Usuario creado exitosamente');
      
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert('❌ Error: ' + error.message);
    }
  });
}

// ==================== AUTENTICACIÓN Y PERFIL ====================

/**
 * Carga el perfil del usuario autenticado desde la API
 * Verifica si hay un token válido y actualiza la UI según el estado de autenticación
 * Si el usuario está autenticado, muestra el menú de usuario
 * Si no está autenticado, muestra el botón de login
 */
async function loadUserProfile() {
  const token = localStorage.getItem('accessToken');
  console.log('🔍 Verificando autenticación... Token presente:', !!token);
  
  if (!token) {
    // No hay token, mostrar botón de login
    console.log('❌ No hay token, mostrando botón de login');
    showLoginButton();
    return;
  }

  try {
    console.log('🔄 Intentando cargar perfil del usuario...');
    const res = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    console.log('📡 Respuesta del servidor:', res.status, res.statusText);

    if (!res.ok) {
      // Token inválido o expirado
      console.warn('⚠️ Token inválido o expirado. Limpiando localStorage...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      showLoginButton();
      return;
    }

    const user = await res.json();
    console.log('✅ Usuario autenticado:', user.email || user.full_name);
    
    // Guardar rol en localStorage si no está
    if (user.role) {
      localStorage.setItem('userRole', user.role);
    }
    
    // Mostrar menú de usuario
    showUserMenu(user);
    
    // Guardar datos para autocompletar formulario de propuesta
    currentUserData = user;
    fillProposalForm(user);
    
    // Mostrar enlace de administración si es admin
    checkAdminAccess(user.role);
    
    // Inicializar testimonios después de verificar autenticación
    initTestimonials();
    
  } catch (error) {
    console.error('❌ Error cargando perfil:', error);
    // En caso de error de red, verificar si hay token y si el backend está funcionando
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('💡 Error de conexión. Verifica que el backend esté corriendo en http://localhost:4000');
      // No limpiar el token en caso de error de red, puede ser temporal
      // Solo mostrar error pero no cambiar la UI si hay token
      return;
    }
    // En caso de otros errores, mostrar botón de login
    showLoginButton();
  }
}

/**
 * Muestra el botón de login y oculta el menú de usuario
 * Se llama cuando el usuario no está autenticado o la sesión ha expirado
 */
function showLoginButton() {
  const loginLink = $('#loginLink');
  const userMenu = $('#userMenu');
  const adminNavLink = $('#adminNavLink');
  
  if (loginLink) loginLink.style.display = 'block';
  if (userMenu) userMenu.style.display = 'none';
  if (adminNavLink) adminNavLink.style.display = 'none';
}

/**
 * Muestra el menú de usuario con avatar y nombre
 * @param {Object} user - Objeto con datos del usuario (full_name, email, avatar_url, role)
 */
function showUserMenu(user) {
  const loginLink = $('#loginLink');
  const userMenu = $('#userMenu');
  const userAvatar = $('#userAvatar');
  const userName = $('#userName');
  const dropdownAvatar = $('#dropdownAvatar');
  const displayName = $('#displayName');
  
  if (loginLink) loginLink.style.display = 'none';
  if (userMenu) userMenu.style.display = 'flex';
  
  // Cargar avatar
  const avatarUrl = user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.full_name || user.email) + '&background=B9111A&color=fff';
  
  if (userAvatar) {
    userAvatar.src = avatarUrl;
    userAvatar.alt = user.full_name || user.email;
  }
  
  if (dropdownAvatar) {
    dropdownAvatar.src = avatarUrl;
    dropdownAvatar.alt = user.full_name || user.email;
  }
  
  // Cargar nombre
  const name = user.full_name || user.email;
  if (userName) userName.textContent = name;
  if (displayName) displayName.textContent = name;
  
  // Inicializar eventos del menú
  initUserMenuEvents();
}

/**
 * Inicializa todos los eventos del menú de usuario:
 * - Toggle del dropdown
 * - Edición de avatar (subida de imagen)
 * - Edición de nombre completo
 * - Cambio de contraseña (modal con validación)
 * - Cierre del dropdown al hacer click fuera
 * 
 * IMPORTANTE: Esta función puede ser llamada múltiples veces (cuando se actualiza el nombre/avatar),
 * por lo que removemos todos los listeners anteriores antes de agregar nuevos para evitar duplicados
 */
// Referencias a handlers para poder removerlos
let userMenuHandlers = {
  triggerClick: null,
  documentClick: null,
  avatarChange: null,
  editNameClick: null,
  cancelNameClick: null,
  saveNameClick: null,
  changePasswordClick: null,
  modalCloseClick: null,
  cancelChangePasswordClick: null,
  modalOverlayClick: null,
  newPasswordInput: null,
  confirmPasswordInput: null,
  changePasswordSubmit: null
};

function initUserMenuEvents() {
  const userTrigger = $('#userTrigger');
  const userDropdown = $('#userDropdown');
  
  // Remover listeners anteriores si existen
  if (userMenuHandlers.triggerClick && userTrigger) {
    userTrigger.removeEventListener('click', userMenuHandlers.triggerClick);
  }
  if (userMenuHandlers.documentClick) {
    document.removeEventListener('click', userMenuHandlers.documentClick);
  }
  
  // Crear nuevos handlers y guardarlos
  userMenuHandlers.triggerClick = (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('open');
  };
  
  userMenuHandlers.documentClick = (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && !userTrigger?.contains(e.target)) {
      userDropdown.classList.remove('open');
    }
  };
  
  // Agregar nuevos listeners
  userTrigger?.addEventListener('click', userMenuHandlers.triggerClick);
  document.addEventListener('click', userMenuHandlers.documentClick);
  
  // Editar avatar
  const avatarInput = $('#avatarInput');
  
  // Remover listener anterior
  if (userMenuHandlers.avatarChange && avatarInput) {
    avatarInput.removeEventListener('change', userMenuHandlers.avatarChange);
  }
  
  // Crear y guardar nuevo handler
  userMenuHandlers.avatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const res = await fetch(`${API_URL}/me`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ avatar_url: base64 })
        });
        
        if (res.ok) {
          const updatedUser = await res.json();
          showUserMenu(updatedUser);
          alert('✅ Avatar actualizado');
        } else {
          alert('❌ Error al actualizar avatar');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };
  
  // Agregar nuevo listener
  avatarInput?.addEventListener('change', userMenuHandlers.avatarChange);
  
  // Editar nombre
  const editNameBtn = $('#editNameBtn');
  const saveNameBtn = $('#saveNameBtn');
  const cancelNameBtn = $('#cancelNameBtn');
  const displayName = $('#displayName');
  const editableName = $('#editableName');
  
  // Remover listeners anteriores
  if (userMenuHandlers.editNameClick && editNameBtn) {
    editNameBtn.removeEventListener('click', userMenuHandlers.editNameClick);
  }
  if (userMenuHandlers.cancelNameClick && cancelNameBtn) {
    cancelNameBtn.removeEventListener('click', userMenuHandlers.cancelNameClick);
  }
  if (userMenuHandlers.saveNameClick && saveNameBtn) {
    saveNameBtn.removeEventListener('click', userMenuHandlers.saveNameClick);
  }
  
  // Crear y guardar handlers
  userMenuHandlers.editNameClick = () => {
    if (displayName && editableName) {
      editableName.value = displayName.textContent || '';
      displayName.style.display = 'none';
      editableName.style.display = 'block';
      editNameBtn.style.display = 'none';
      saveNameBtn.style.display = 'inline-block';
      cancelNameBtn.style.display = 'inline-block';
      editableName.focus();
    }
  };
  
  userMenuHandlers.cancelNameClick = () => {
    if (displayName && editableName) {
      displayName.style.display = 'block';
      editableName.style.display = 'none';
      editNameBtn.style.display = 'inline-block';
      saveNameBtn.style.display = 'none';
      cancelNameBtn.style.display = 'none';
    }
  };
  
  userMenuHandlers.saveNameClick = async () => {
    if (!editableName || !displayName) return;
    
    const newName = editableName.value.trim();
    if (!newName) {
      alert('El nombre no puede estar vacío');
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ full_name: newName })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        
        // Restaurar estado visual antes de actualizar
        if (displayName && editableName && editNameBtn && saveNameBtn && cancelNameBtn) {
          displayName.style.display = 'block';
          editableName.style.display = 'none';
          editNameBtn.style.display = 'inline-block';
          saveNameBtn.style.display = 'none';
          cancelNameBtn.style.display = 'none';
        }
        
        // Actualizar el menú con los nuevos datos
        showUserMenu(updatedUser);
        alert('✅ Nombre actualizado');
      } else {
        alert('❌ Error al actualizar nombre');
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };
  
  // Agregar nuevos listeners
  editNameBtn?.addEventListener('click', userMenuHandlers.editNameClick);
  cancelNameBtn?.addEventListener('click', userMenuHandlers.cancelNameClick);
  saveNameBtn?.addEventListener('click', userMenuHandlers.saveNameClick);
  
  // Cambiar contraseña
  const changePasswordBtn = $('#changePasswordBtn');
  const changePasswordModal = $('#changePasswordModal');
  const changePasswordForm = $('#changePasswordForm');
  const currentPasswordInput = $('#currentPasswordInput');
  const newPasswordInput = $('#newPasswordInput');
  const confirmPasswordInput = $('#confirmPasswordInput');
  const passwordHint = $('#passwordHint');
  const confirmPasswordHint = $('#confirmPasswordHint');
  const changePasswordMsg = $('#changePasswordMsg');
  const cancelChangePasswordBtn = $('#cancelChangePasswordBtn');
  const changePasswordModalClose = $('#changePasswordModalClose');
  
  // Remover listeners anteriores de cambio de contraseña
  if (userMenuHandlers.changePasswordClick && changePasswordBtn) {
    changePasswordBtn.removeEventListener('click', userMenuHandlers.changePasswordClick);
  }
  if (userMenuHandlers.modalCloseClick && changePasswordModalClose) {
    changePasswordModalClose.removeEventListener('click', userMenuHandlers.modalCloseClick);
  }
  if (userMenuHandlers.cancelChangePasswordClick && cancelChangePasswordBtn) {
    cancelChangePasswordBtn.removeEventListener('click', userMenuHandlers.cancelChangePasswordClick);
  }
  if (userMenuHandlers.modalOverlayClick && changePasswordModal) {
    changePasswordModal.removeEventListener('click', userMenuHandlers.modalOverlayClick);
  }
  if (userMenuHandlers.newPasswordInput && newPasswordInput) {
    newPasswordInput.removeEventListener('input', userMenuHandlers.newPasswordInput);
  }
  if (userMenuHandlers.confirmPasswordInput && confirmPasswordInput) {
    confirmPasswordInput.removeEventListener('input', userMenuHandlers.confirmPasswordInput);
  }
  if (userMenuHandlers.changePasswordSubmit && changePasswordForm) {
    changePasswordForm.removeEventListener('submit', userMenuHandlers.changePasswordSubmit);
  }
  
  // Función para cerrar modal de cambio de contraseña
  const closeChangePasswordModal = () => {
    if (changePasswordModal) {
      changePasswordModal.style.opacity = '0';
      setTimeout(() => {
        changePasswordModal.style.display = 'none';
        document.body.style.overflow = '';
        changePasswordForm?.reset();
        if (changePasswordMsg) {
          changePasswordMsg.textContent = '';
          changePasswordMsg.classList.remove('ok', 'err');
        }
        if (passwordHint) passwordHint.classList.remove('ok', 'err');
        if (confirmPasswordHint) confirmPasswordHint.classList.remove('ok', 'err');
        if (newPasswordInput) newPasswordInput.classList.remove('input-valid', 'input-invalid');
        if (confirmPasswordInput) confirmPasswordInput.classList.remove('input-valid', 'input-invalid');
      }, 300);
    }
  };
  
  // Crear y guardar handlers de cambio de contraseña
  userMenuHandlers.changePasswordClick = () => {
    if (changePasswordModal) {
      changePasswordModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        changePasswordModal.style.opacity = '1';
        currentPasswordInput?.focus();
      }, 10);
    }
  };
  
  userMenuHandlers.modalCloseClick = closeChangePasswordModal;
  userMenuHandlers.cancelChangePasswordClick = closeChangePasswordModal;
  
  userMenuHandlers.modalOverlayClick = (e) => {
    if (e.target === changePasswordModal) {
      closeChangePasswordModal();
    }
  };
  
  // Validación en tiempo real de nueva contraseña
  // Función auxiliar para validar contraseña
  const validatePasswordMatch = () => {
    const newPass = newPasswordInput?.value || '';
    const confirmPass = confirmPasswordInput?.value || '';
    
    if (confirmPass.length > 0) {
      if (newPass === confirmPass && newPass.length >= 8) {
        confirmPasswordInput.classList.add('input-valid');
        confirmPasswordInput.classList.remove('input-invalid');
        if (confirmPasswordHint) {
          confirmPasswordHint.textContent = 'Las contraseñas coinciden ✓';
          confirmPasswordHint.classList.add('ok');
          confirmPasswordHint.classList.remove('err');
        }
      } else if (newPass !== confirmPass) {
        confirmPasswordInput.classList.remove('input-valid');
        confirmPasswordInput.classList.add('input-invalid');
        if (confirmPasswordHint) {
          confirmPasswordHint.textContent = 'Las contraseñas no coinciden';
          confirmPasswordHint.classList.remove('ok');
          confirmPasswordHint.classList.add('err');
        }
      }
    }
  };
  
  userMenuHandlers.newPasswordInput = () => {
    const password = newPasswordInput.value;
    if (password.length >= 8) {
      newPasswordInput.classList.add('input-valid');
      newPasswordInput.classList.remove('input-invalid');
      if (passwordHint) {
        passwordHint.textContent = 'Contraseña válida ✓';
        passwordHint.classList.add('ok');
        passwordHint.classList.remove('err');
      }
    } else if (password.length > 0) {
      newPasswordInput.classList.remove('input-valid');
      newPasswordInput.classList.add('input-invalid');
      if (passwordHint) {
        passwordHint.textContent = 'La contraseña debe tener al menos 8 caracteres';
        passwordHint.classList.remove('ok');
        passwordHint.classList.add('err');
      }
    } else {
      newPasswordInput.classList.remove('input-valid', 'input-invalid');
      if (passwordHint) {
        passwordHint.textContent = 'La contraseña debe tener al menos 8 caracteres';
        passwordHint.classList.remove('ok', 'err');
      }
    }
    
    // Validar confirmación si ya tiene valor
    if (confirmPasswordInput && confirmPasswordInput.value) {
      validatePasswordMatch();
    }
  };
  
  userMenuHandlers.confirmPasswordInput = validatePasswordMatch;
  
  // Envío del formulario
  userMenuHandlers.changePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!changePasswordMsg) return;
    changePasswordMsg.textContent = '';
    changePasswordMsg.classList.remove('ok', 'err');
    
    const currentPass = currentPasswordInput?.value || '';
    const newPass = newPasswordInput?.value || '';
    const confirmPass = confirmPasswordInput?.value || '';
    
    // Validaciones
    if (!currentPass) {
      changePasswordMsg.textContent = 'Por favor ingresa tu contraseña actual';
      changePasswordMsg.classList.add('err');
      currentPasswordInput?.focus();
      return;
    }
    
    if (newPass.length < 8) {
      changePasswordMsg.textContent = 'La nueva contraseña debe tener al menos 8 caracteres';
      changePasswordMsg.classList.add('err');
      newPasswordInput?.focus();
      return;
    }
    
    if (newPass !== confirmPass) {
      changePasswordMsg.textContent = 'Las contraseñas no coinciden';
      changePasswordMsg.classList.add('err');
      confirmPasswordInput?.focus();
      return;
    }
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        changePasswordMsg.textContent = 'No hay sesión activa';
        changePasswordMsg.classList.add('err');
        return;
      }
      
      const submitBtn = changePasswordForm?.querySelector('button[type="submit"]');
      const originalText = submitBtn?.textContent || 'Cambiar Contraseña';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Cambiando...';
      }
      
      const res = await fetch(`${API_URL}/me/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: currentPass,
          newPassword: newPass
        })
      });
      
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      
      if (res.ok) {
        changePasswordMsg.textContent = '✅ Contraseña cambiada exitosamente';
        changePasswordMsg.classList.add('ok');
        changePasswordMsg.classList.remove('err');
        
        // Limpiar formulario después de un breve delay
        setTimeout(() => {
          closeChangePasswordModal();
        }, 1500);
      } else {
        const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
        changePasswordMsg.textContent = '❌ ' + (error.error || 'Error al cambiar contraseña');
        changePasswordMsg.classList.add('err');
        changePasswordMsg.classList.remove('ok');
      }
    } catch (error) {
      changePasswordMsg.textContent = '❌ Error: ' + error.message;
      changePasswordMsg.classList.add('err');
      changePasswordMsg.classList.remove('ok');
    }
  };
  
  // Agregar todos los nuevos listeners
  changePasswordBtn?.addEventListener('click', userMenuHandlers.changePasswordClick);
  changePasswordModalClose?.addEventListener('click', userMenuHandlers.modalCloseClick);
  cancelChangePasswordBtn?.addEventListener('click', userMenuHandlers.cancelChangePasswordClick);
  changePasswordModal?.addEventListener('click', userMenuHandlers.modalOverlayClick);
  newPasswordInput?.addEventListener('input', userMenuHandlers.newPasswordInput);
  confirmPasswordInput?.addEventListener('input', userMenuHandlers.confirmPasswordInput);
  changePasswordForm?.addEventListener('submit', userMenuHandlers.changePasswordSubmit);
}

/**
 * Muestra u oculta el enlace al panel de administración según el rol del usuario
 * @param {string} role - Rol del usuario ('admin' o 'user')
 */
function checkAdminAccess(role) {
  const adminNavLink = $('#adminNavLink');
  if (adminNavLink && role === 'admin') {
    adminNavLink.style.display = 'block';
  } else if (adminNavLink) {
    adminNavLink.style.display = 'none';
  }
}

/**
 * Maneja el cierre de sesión del usuario
 * Limpia tokens del localStorage y redirige al inicio
 */
const logoutBtn = $('#logoutBtn');
logoutBtn?.addEventListener('click', async () => {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    }
    
    // Limpiar localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    
    // Recargar página para mostrar botón de login
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Limpiar de todas formas
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  }
});

// ==================== SISTEMA DE TESTIMONIOS ====================

/** Almacena la calificación seleccionada por el usuario (1-5 estrellas) */
let selectedRating = 0;

/**
 * Inicializa el sistema de testimonios
 * Muestra el formulario si el usuario está autenticado, sino muestra mensaje para iniciar sesión
 */
function initTestimonials() {
  loadTestimonials();
  
  const token = localStorage.getItem('accessToken');
  const testiForm = $('#testiForm');
  const testiLoginPrompt = $('#testiLoginPrompt');
  
  if (token) {
    if (testiForm) testiForm.style.display = 'block';
    if (testiLoginPrompt) testiLoginPrompt.style.display = 'none';
    initStarRating();
    initTestimonialForm();
  } else {
    if (testiForm) testiForm.style.display = 'none';
    if (testiLoginPrompt) testiLoginPrompt.style.display = 'block';
  }
}

/**
 * Carga los testimonios desde la API
 * Los testimonios son públicos, pero se muestra información adicional si el usuario está autenticado
 * Permite eliminar testimonios propios
 */
async function loadTestimonials() {
  const testiList = $('#testiList');
  if (!testiList) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(`${API_URL}/testimonials`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }
    
    const testimonials = await res.json();
    testiList.innerHTML = '';
    
    if (!Array.isArray(testimonials) || testimonials.length === 0) {
      testiList.innerHTML = '<p class="subtle">Aún no hay testimonios.</p>';
      return;
    }
    
    testimonials.forEach((testi) => {
      const div = document.createElement('div');
      div.className = 'testimonial';
      
      const avatarUrl = testi.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(testi.user_name || 'Usuario') + '&background=B9111A&color=fff';
      const date = new Date(testi.created_at).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += i <= testi.rating ? '★' : '☆';
      }
      
      div.innerHTML = `
        <div class="testimonial-header">
          <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(testi.user_name)}" class="testimonial-avatar" />
          <div class="testimonial-author">
            <strong>${escapeHtml(testi.user_name)}</strong>
            <span class="subtle">${date}</span>
          </div>
          ${testi.is_owner ? '<button class="testimonial-delete" data-id="' + testi.id + '">×</button>' : ''}
        </div>
        <div style="color: #ffc107; font-size: 16px; margin: 8px 0;">${stars}</div>
        <p class="testimonial-message">${escapeHtml(testi.message)}</p>
      `;
      
      testiList.appendChild(div);
      
      // Agregar event listener para eliminar si es el dueño
      if (testi.is_owner) {
        const deleteBtn = div.querySelector('.testimonial-delete');
        deleteBtn?.addEventListener('click', () => {
          deleteTestimonial(testi.id, div);
        });
      }
    });
  } catch (error) {
    console.error('Error cargando testimonios:', error);
    if (testiList) {
      testiList.innerHTML = '<p class="subtle" style="color:red;">Error cargando testimonios.</p>';
    }
  }
}

/**
 * Inicializa el sistema de calificación con estrellas
 * Permite seleccionar una calificación de 1 a 5 estrellas con efectos visuales
 */
function initStarRating() {
  const stars = $$('.star');
  const starValue = $('#starValue');
  
  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updateStars();
      if (starValue) starValue.textContent = `${selectedRating} de 5`;
    });
    
    star.addEventListener('mouseenter', () => {
      highlightStars(index + 1);
    });
  });
  
  const starsContainer = $('.stars-container');
  starsContainer?.addEventListener('mouseleave', () => {
    updateStars();
  });
}

function updateStars() {
  const stars = $$('.star');
  stars.forEach((star, index) => {
    if (index < selectedRating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function highlightStars(rating) {
  const stars = $$('.star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

/**
 * Inicializa el formulario de testimonios
 * IMPORTANTE: Previene listeners duplicados removiendo el anterior antes de agregar uno nuevo
 */
let testimonialFormHandler = null;

function initTestimonialForm() {
  const testiForm = $('#testiForm');
  if (!testiForm) return;
  
  // Remover listener anterior si existe para evitar duplicados
  if (testimonialFormHandler) {
    testiForm.removeEventListener('submit', testimonialFormHandler);
  }
  
  // Crear nuevo handler y guardarlo
  testimonialFormHandler = async (e) => {
    e.preventDefault();
    
    if (selectedRating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    
    const message = $('#tMsg').value.trim();
    if (!message) {
      alert('Por favor escribe tu testimonio');
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
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
          message
        })
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || 'Error publicando testimonio');
      }
      
      // Limpiar formulario
      testiForm.reset();
      selectedRating = 0;
      updateStars();
      $('#starValue').textContent = '';
      
      // Recargar testimonios
      await loadTestimonials();
      
      alert('✅ Testimonio publicado exitosamente');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };
  
  // Agregar el nuevo listener
  testiForm.addEventListener('submit', testimonialFormHandler);
}

/**
 * Elimina un testimonio del sistema (solo el autor puede eliminar el suyo)
 * @param {string} testiId - ID del testimonio a eliminar
 * @param {HTMLElement} element - Elemento DOM del testimonio para removerlo de la UI
 */
async function deleteTestimonial(testiId, element) {
  if (!confirm('¿Estás seguro de eliminar este testimonio?')) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const res = await fetch(`${API_URL}/testimonials/${testiId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error eliminando testimonio');
    }
    
    element.remove();
    alert('✅ Testimonio eliminado exitosamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

// ==================== FORMULARIO DE PROPUESTA ====================

/**
 * Almacena los datos del usuario para autocompletar el formulario
 */
let currentUserData = null;

/**
 * Inicializa el formulario de propuesta
 * Autocompleta los campos si el usuario está logeado (opcional)
 * Maneja el envío del formulario
 * NOTA: El formulario funciona perfectamente SIN autenticación
 */
function initProposalForm() {
  const propForm = $('#propForm');
  if (!propForm) {
    console.warn('⚠️ Formulario de propuesta no encontrado al inicializar');
    return;
  }

  console.log('✅ Formulario de propuesta encontrado e inicializado');

  // Intentar cargar datos del usuario si está logeado (esto es opcional)
  // Si no hay token o falla, el formulario sigue funcionando normalmente
  loadUserDataForProposal();

  // Remover listener anterior si existe para evitar duplicados
  const existingHandler = propForm._proposalSubmitHandler;
  if (existingHandler) {
    propForm.removeEventListener('submit', existingHandler);
  }

  // Crear el handler del submit
  async function handleProposalSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('✅ Formulario de propuesta - submit interceptado', e);
    
    const pName = $('#pName');
    const pEmail = $('#pEmail');
    const pPhone = $('#pPhone');
    const pPH = $('#pPH');
    const pScope = $('#pScope');
    const propMsg = $('#propMsg');
    const submitBtn = propForm.querySelector('button[type="submit"]');
    
    // Prevenir cualquier scroll o navegación
    window.scrollTo(0, document.querySelector('#propuesta')?.offsetTop || 0);
    
    if (!pName || !pEmail || !pPhone || !pPH || !pScope) {
      console.error('Campos del formulario no encontrados');
      return false;
    }
    
    const formData = {
      name: pName.value.trim(),
      email: pEmail.value.trim(),
      phone: pPhone.value.trim(),
      phName: pPH.value.trim(),
      scope: pScope.value.trim()
    };
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.phone || !formData.phName || !formData.scope) {
      if (propMsg) {
        propMsg.textContent = 'Por favor completa todos los campos.';
        propMsg.style.color = '#b90f1a';
      }
      return false;
    }
    
    // Deshabilitar botón y mostrar estado de carga
    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      try {
        // Validación adicional del scope antes de enviar
        if (formData.scope.length < 5) {
          if (propMsg) {
            propMsg.textContent = 'Por favor describe tus necesidades con más detalle (mínimo 5 caracteres).';
            propMsg.style.color = '#b90f1a';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
          return false;
        }
        
        // Iniciar timer para mostrar tiempo de envío
        const startTime = Date.now();
        
        const res = await fetch(`${API_URL}/contact/proposal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          // Mostrar detalles de validación si existen
          let errorMsg = data.error || 'Error al enviar la propuesta';
          if (data.details && Array.isArray(data.details)) {
            const detailMsgs = data.details.map(d => d.message || d.path).join(', ');
            errorMsg += ': ' + detailMsgs;
          }
          throw new Error(errorMsg);
        }
        
        // Éxito - Mostrar mensaje de confirmación destacado
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        if (propMsg) {
          propMsg.innerHTML = `
            <div style="background: #d1fae5; border: 2px solid #059669; border-radius: 8px; padding: 16px; margin-top: 12px; animation: slideIn 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 32px; animation: scaleIn 0.5s ease;">✅</div>
                <div style="flex: 1;">
                  <strong style="color: #059669; display: block; margin-bottom: 6px; font-size: 18px;">
                    ¡Solicitud enviada exitosamente!
                  </strong>
                  <div style="color: #065f46; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                    ${data.message || 'Tu solicitud ha sido recibida y enviada por correo electrónico. Te contactaremos pronto.'}
                  </div>
                  <div style="color: #047857; font-size: 13px; padding: 8px; background: rgba(5, 150, 105, 0.1); border-radius: 6px; border-left: 3px solid #059669;">
                    ✉️ <strong>Correos enviados:</strong><br>
                    • Notificación a nuestro equipo<br>
                    • Confirmación a tu email (${formData.email})<br>
                    <small style="opacity: 0.8;">Tiempo de envío: ${elapsedTime}s</small>
                  </div>
                </div>
              </div>
            </div>
            <style>
              @keyframes slideIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes scaleIn {
                from { transform: scale(0); }
                to { transform: scale(1); }
              }
            </style>
          `;
        }
        
        // Limpiar formulario después de un breve delay para que el usuario vea el mensaje
        setTimeout(() => {
          propForm.reset();
          
          // Si el usuario estaba logeado, restaurar sus datos
          if (currentUserData) {
            fillProposalForm(currentUserData);
          }
          
          // Limpiar mensaje después de 10 segundos
          if (propMsg) {
            setTimeout(() => {
              propMsg.innerHTML = '';
            }, 10000);
          }
        }, 500);
        
      } catch (error) {
        console.error('Error enviando propuesta:', error);
        if (propMsg) {
          propMsg.textContent = '❌ ' + (error.message || 'Error al enviar la propuesta. Por favor intenta de nuevo o contáctanos por WhatsApp.');
          propMsg.style.color = '#b90f1a';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    }
  }

  // Guardar referencia al handler para poder removerlo después
  propForm._proposalSubmitHandler = handleProposalSubmit;
  
  // Agregar listener al formulario
  propForm.addEventListener('submit', handleProposalSubmit);
  
  // También agregar listener al botón directamente para manejar el envío
  // Esto es necesario porque el botón tiene onclick="return false;" que previene el submit
  const submitBtn = propForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    // Remover el onclick inline que bloquea el submit
    submitBtn.removeAttribute('onclick');
    
    submitBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('✅ Botón de propuesta clickeado directamente');
      
      // Validar el formulario primero
      if (!propForm.checkValidity()) {
        propForm.reportValidity();
        return false;
      }
      
      // Crear un evento sintético de submit y ejecutar directamente el handler
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      console.log('🚀 Ejecutando envío de propuesta...');
      await handleProposalSubmit(submitEvent);
    });
  }
}

/**
 * Carga los datos del usuario si está logeado para autocompletar el formulario
 * Esta función es completamente opcional - el formulario funciona sin ella
 * Si no hay token o falla, simplemente retorna sin hacer nada
 */
async function loadUserDataForProposal() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    // Sin token = sin autenticación = formulario funciona normalmente sin autocompletar
    currentUserData = null;
    return;
  }

  try {
    const res = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!res.ok) {
      // Si falla la autenticación, simplemente continuamos sin autocompletar
      currentUserData = null;
      return;
    }

    const user = await res.json();
    currentUserData = user;
    
    // Autocompletar formulario solo si tenemos datos válidos
    fillProposalForm(user);
  } catch (error) {
    // Si hay cualquier error, simplemente ignoramos y el formulario funciona normalmente
    console.warn('No se pudieron cargar datos del usuario (esto es normal si no estás logueado):', error);
    currentUserData = null;
  }
}

/**
 * Autocompleta el formulario de propuesta con los datos del usuario
 * @param {Object} user - Datos del usuario (full_name, email)
 */
function fillProposalForm(user) {
  const pName = $('#pName');
  const pEmail = $('#pEmail');
  
  if (pName && user.full_name) {
    pName.value = user.full_name;
  }
  
  if (pEmail && user.email) {
    pEmail.value = user.email;
  }
}

// Los datos del usuario se actualizan automáticamente en loadUserProfile()

// ==================== CARGA INICIAL ====================

/**
 * Inicializa la página cargando todos los datos necesarios
 * Se ejecuta cuando el DOM está listo
 */
function initializePage() {
  // Cargar noticias
  loadNews();
  
  // Cargar perfil del usuario con un pequeño delay para asegurar que React esté listo
  setTimeout(() => {
    loadUserProfile();
  }, 100);
  
  // Cargar testimonios (sin autenticación) - después de verificar autenticación
  setTimeout(() => {
    initTestimonials();
  }, 200);
  
  // Inicializar formulario de propuesta
  initProposalForm();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  // DOM ya está listo, ejecutar inmediatamente pero después de que todo cargue
  setTimeout(initializePage, 50);
}

// Reinicializar formulario de propuesta cuando se muestre la sección
// Esto asegura que el formulario funcione incluso si se carga después
window.addEventListener('hashchange', function() {
  const hash = window.location.hash;
  if (hash === '#propuesta') {
    console.log('📍 Sección de propuesta detectada, verificando formulario...');
    // Pequeño delay para asegurar que React haya mostrado la sección
    setTimeout(() => {
      const propForm = $('#propForm');
      if (propForm && !propForm._proposalSubmitHandler) {
        console.log('🔄 Reinicializando formulario de propuesta...');
        initProposalForm();
      }
    }, 100);
  }
});

// Cargar noticias cuando se muestra la sección de noticias
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#noticias') {
    loadNews();
  }
  if (window.location.hash === '#testimonios') {
    loadTestimonials();
  }
});

// ==================== MODAL DE NOTICIAS ====================

/**
 * Abre el modal con los detalles completos de una noticia
 * @param {Object} news - Objeto con los datos de la noticia (title, subtitle, description, image_url, etc.)
 */
function openNewsModal(news) {
  const modal = $('#newsModal');
  const modalContent = $('#newsModalContent');
  
  if (!modal || !modalContent) return;
  
  const date = new Date(news.created_at).toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  modalContent.innerHTML = `
    <img src="${escapeHtml(news.image_url)}" alt="${escapeHtml(news.title)}" />
    <h1 class="news-modal-title">${escapeHtml(news.title)}</h1>
    <p class="news-modal-subtitle">${escapeHtml(news.subtitle)}</p>
    <div class="news-modal-description">${escapeHtml(news.description)}</div>
    <div class="news-modal-meta">
      ${news.author_name ? `Por <strong>${escapeHtml(news.author_name)}</strong> • ` : ''}${date}
    </div>
  `;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevenir scroll del body
  
  // Forzar recálculo de estilos y animar entrada
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
}

/**
 * Cierra el modal de noticias y restaura el scroll del body
 */
function closeNewsModal() {
  const modal = $('#newsModal');
  if (!modal) return;
  
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = ''; // Restaurar scroll
  }, 300);
}

// Event listeners para cerrar modal
const newsModalClose = $('#newsModalClose');
const newsModal = $('#newsModal');

newsModalClose?.addEventListener('click', closeNewsModal);

newsModal?.addEventListener('click', (e) => {
  // Cerrar si se hace click fuera del contenido
  if (e.target === newsModal || e.target.classList.contains('modal-overlay')) {
    closeNewsModal();
  }
});

// Cerrar con tecla ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && newsModal && newsModal.style.display !== 'none') {
    closeNewsModal();
  }
});

// ==================== ADMINISTRACIÓN (FUNCIONES ESPECÍFICAS) ====================

/**
 * Carga la lista de usuarios en el panel de administración
 * Permite cambiar roles y eliminar usuarios
 * Solo accesible para administradores
 */
async function loadAdminUsers() {
  const list = $('#adminUsersList');
  if (!list) return;
  
  list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">Cargando usuarios...</p>';
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      list.innerHTML = '<p style="color:red; text-align:center; padding:20px;">No hay sesión activa.</p>';
      return;
    }
    
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error ${res.status}`);
    }
    
    const users = await res.json();
    const usersArray = Array.isArray(users) ? users : [];
    
    list.innerHTML = '';
    
    if (usersArray.length === 0) {
      list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">No hay usuarios registrados.</p>';
      return;
    }
    
    // Renderizar lista de usuarios
    usersArray.forEach((user) => {
      const div = document.createElement('div');
      div.className = 'admin-list-item';
      
      const date = new Date(user.created_at).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const isVerified = user.email_verified_at ? '✅ Verificado' : '⚠️ Sin verificar';
      
      div.innerHTML = `
        <div class="admin-list-item-content">
          <h4>${escapeHtml(user.full_name || user.email || 'Sin nombre')}</h4>
          <p class="subtle">${escapeHtml(user.email)} • ${isVerified} • ${date}</p>
        </div>
        <div class="admin-list-item-actions">
          <select class="input" data-user-id="${user.id}" data-current-role="${user.role}" style="margin-right:8px; padding:6px 12px;">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>Usuario</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
          </select>
          <button class="admin-btn-delete" data-user-id="${user.id}" title="Eliminar usuario">🗑️</button>
        </div>
      `;
      
      list.appendChild(div);
      
      // Event listener para cambiar rol
      const select = div.querySelector('select');
      select?.addEventListener('change', async (e) => {
        const newRole = e.target.value;
        const userId = e.target.dataset.userId;
        const currentRole = e.target.dataset.currentRole;
        
        if (newRole === currentRole) return;
        
        if (!confirm(`¿Cambiar rol de "${user.full_name || user.email}" a ${newRole === 'admin' ? 'Administrador' : 'Usuario'}?`)) {
          e.target.value = currentRole;
          return;
        }
        
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            alert('No hay sesión activa');
            e.target.value = currentRole;
            return;
          }
          
          const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ role: newRole })
          });
          
          if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(error.error || 'Error cambiando rol');
          }
          
          e.target.dataset.currentRole = newRole;
          alert('✅ Rol actualizado exitosamente');
          
          // Recargar lista
          await loadAdminUsers();
        } catch (error) {
          e.target.value = currentRole;
          alert('❌ Error: ' + error.message);
        }
      });
      
      // Event listener para eliminar usuario
      const deleteBtn = div.querySelector('.admin-btn-delete');
      deleteBtn?.addEventListener('click', () => {
        deleteAdminUser(user.id, div, user);
      });
    });
    
  } catch (error) {
    console.error('Error cargando usuarios en admin:', error);
    list.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error: ${error.message}</p>`;
  }
}

/**
 * Elimina un usuario del sistema desde el panel de administración
 * @param {string} userId - ID del usuario a eliminar
 * @param {HTMLElement} element - Elemento DOM del usuario para removerlo de la UI
 * @param {Object} user - Datos del usuario (para mostrar en confirmación)
 */
async function deleteAdminUser(userId, element, user) {
  if (!confirm(`¿Estás seguro de eliminar al usuario "${user.full_name || user.email}"?\n\nEsta acción eliminará también sus noticias, testimonios y todos sus datos asociados.\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error eliminando usuario');
    }
    
    element.remove();
    
    // Recargar lista de usuarios
    await loadAdminUsers();
    
    // Actualizar estadísticas si están visibles
    const statsTab = $('#adminStats');
    if (statsTab && statsTab.classList.contains('active')) {
      await loadAdminStats();
    }
    
    alert('✅ Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Carga los testimonios en el panel de administración
 * Los administradores pueden ver y eliminar cualquier testimonio
 */
async function loadAdminTestimonials() {
  const list = $('#adminTestimonialsList');
  if (!list) return;
  
  list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">Cargando testimonios...</p>';
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      list.innerHTML = '<p style="color:red; text-align:center; padding:20px;">No hay sesión activa.</p>';
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const res = await fetch(`${API_URL}/testimonials`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }
    
    const testimonials = await res.json();
    const testimonialsArray = Array.isArray(testimonials) ? testimonials : [];
    
    list.innerHTML = '';
    
    if (testimonialsArray.length === 0) {
      list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--muted);">No hay testimonios publicados.</p>';
      return;
    }
    
    // Renderizar lista de testimonios
    testimonialsArray.forEach((testi) => {
      const div = document.createElement('div');
      div.className = 'admin-list-item';
      
      const date = new Date(testi.created_at).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += i <= testi.rating ? '★' : '☆';
      }
      
      div.innerHTML = `
        <div class="admin-list-item-content">
          <h4>${escapeHtml(testi.user_name || 'Usuario')} ${stars}</h4>
          <p class="subtle">${escapeHtml(testi.message || '').substring(0, 100)}${testi.message && testi.message.length > 100 ? '...' : ''} • ${date}</p>
        </div>
        <div class="admin-list-item-actions">
          <button class="admin-btn-delete" data-id="${testi.id}">Eliminar</button>
        </div>
      `;
      
      list.appendChild(div);
      
      const deleteBtn = div.querySelector('.admin-btn-delete');
      deleteBtn?.addEventListener('click', () => {
        deleteAdminTestimonial(testi.id, div);
      });
    });
    
  } catch (error) {
    console.error('Error cargando testimonios en admin:', error);
    list.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error: ${error.message}</p>`;
  }
}

/**
 * Elimina un testimonio desde el panel de administración
 * @param {string} testiId - ID del testimonio a eliminar
 * @param {HTMLElement} element - Elemento DOM del testimonio para removerlo de la UI
 */
async function deleteAdminTestimonial(testiId, element) {
  if (!confirm('¿Estás seguro de eliminar este testimonio?')) return;
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('No hay sesión activa');
      return;
    }
    
    const res = await fetch(`${API_URL}/testimonials/${testiId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error eliminando testimonio');
    }
    
    element.remove();
    
    // Recargar testimonios públicos también
    await loadTestimonials();
    
    alert('✅ Testimonio eliminado exitosamente');
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
}

/**
 * Carga las estadísticas generales del sistema:
 * - Total de usuarios
 * - Total de noticias publicadas
 * - Total de testimonios
 */
async function loadAdminStats() {
  const statsUsers = $('#statsUsers');
  const statsNews = $('#statsNews');
  const statsTestimonials = $('#statsTestimonials');
  
  if (!statsUsers || !statsNews || !statsTestimonials) return;
  
  statsUsers.textContent = '-';
  statsNews.textContent = '-';
  statsTestimonials.textContent = '-';
  
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      statsUsers.textContent = 'Error';
      statsNews.textContent = 'Error';
      statsTestimonials.textContent = 'Error';
      return;
    }
    
    const res = await fetch(`${API_URL}/admin/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }
    
    const stats = await res.json();
    
    if (statsUsers) statsUsers.textContent = stats.users || '0';
    if (statsNews) statsNews.textContent = stats.news || '0';
    if (statsTestimonials) statsTestimonials.textContent = stats.testimonials || '0';
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    if (statsUsers) statsUsers.textContent = 'Error';
    if (statsNews) statsNews.textContent = 'Error';
    if (statsTestimonials) statsTestimonials.textContent = 'Error';
  }
}
