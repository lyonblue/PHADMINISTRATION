/**
 * Utilidades compartidas para el frontend
 * Funciones comunes reutilizables para evitar código duplicado
 */

/**
 * Hace una petición fetch a la API con manejo de errores consistente
 * @param {string} endpoint - Endpoint de la API (ej: '/news', '/me')
 * @param {Object} options - Opciones de fetch (method, body, headers, etc.)
 * @param {boolean} requireAuth - Si es true, agrega automáticamente el token de autorización
 * @returns {Promise<Object>} Datos de la respuesta o lanza error
 */
async function apiRequest(endpoint, options = {}, requireAuth = false) {
  const API_URL = 'http://localhost:4000';
  
  // Configurar headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Agregar token si se requiere autenticación
  if (requireAuth) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No hay sesión activa');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Hacer la petición
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });
  
  // Manejar errores HTTP
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `Error ${response.status}: ${response.statusText}` }));
    throw new Error(error.error || `Error ${response.status}`);
  }
  
  // Parsear y retornar respuesta
  return await response.json();
}

/**
 * Muestra un mensaje de error al usuario de forma consistente
 * @param {string|HTMLElement} target - Elemento donde mostrar el mensaje o selector CSS
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'error' (rojo) o 'success' (verde)
 */
function showMessage(target, message, type = 'error') {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return;
  
  element.textContent = message;
  element.style.color = type === 'success' ? 'green' : 'red';
  element.classList.remove('ok', 'err');
  element.classList.add(type === 'success' ? 'ok' : 'err');
}

/**
 * Muestra un mensaje temporal (toast) al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'info'
 * @param {number} duration - Duración en milisegundos (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Crear elemento toast
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  
  // Agregar animación CSS si no existe
  if (!document.getElementById('toastStyles')) {
    const style = document.createElement('style');
    style.id = 'toastStyles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Remover después de la duración
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} true si el email es válido
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida si una contraseña cumple con los requisitos de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {boolean} true si la contraseña es segura
 */
function isStrongPassword(password) {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

/**
 * Formatea una fecha a formato legible en español
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
function formatDate(date, options = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  });
}

/**
 * Limpia el estado de edición del nombre
 * @param {HTMLElement} displayName - Elemento que muestra el nombre
 * @param {HTMLElement} editableName - Input editable
 * @param {HTMLElement} editBtn - Botón de editar
 * @param {HTMLElement} saveBtn - Botón de guardar
 * @param {HTMLElement} cancelBtn - Botón de cancelar
 */
function resetNameEditState(displayName, editableName, editBtn, saveBtn, cancelBtn) {
  if (displayName) displayName.style.display = 'block';
  if (editableName) editableName.style.display = 'none';
  if (editBtn) editBtn.style.display = 'inline-block';
  if (saveBtn) saveBtn.style.display = 'none';
  if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Activa el estado de edición del nombre
 * @param {HTMLElement} displayName - Elemento que muestra el nombre
 * @param {HTMLElement} editableName - Input editable
 * @param {HTMLElement} editBtn - Botón de editar
 * @param {HTMLElement} saveBtn - Botón de guardar
 * @param {HTMLElement} cancelBtn - Botón de cancelar
 */
function activateNameEditState(displayName, editableName, editBtn, saveBtn, cancelBtn) {
  if (displayName) displayName.style.display = 'none';
  if (editableName) {
    editableName.style.display = 'block';
    editableName.value = displayName?.textContent || '';
    editableName.focus();
  }
  if (editBtn) editBtn.style.display = 'none';
  if (saveBtn) saveBtn.style.display = 'inline-block';
  if (cancelBtn) cancelBtn.style.display = 'inline-block';
}

