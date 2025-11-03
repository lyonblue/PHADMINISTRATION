/**
 * Sistema de Chatbot
 * Chatbot simple para atención al cliente en la esquina inferior derecha
 */

(function() {
  'use strict';

  // Elementos del DOM
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotContainer = document.getElementById('chatbotContainer');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotSuggestionsToggle = document.getElementById('chatbotSuggestionsToggle');

  // Estado del chatbot
  let isOpen = false;
  let suggestionsOpen = false;

  /**
   * Abre el chatbot
   */
  function openChatbot() {
    isOpen = true;
    chatbotContainer.classList.add('open');
    chatbotToggle.classList.add('active');
    
    // Cerrar sugerencias al abrir (el usuario puede abrirlas si quiere)
    suggestionsOpen = false;
    hideQuickSuggestions();
    
    chatbotInput.focus();
    
    // Hacer scroll al final de los mensajes
    setTimeout(() => {
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }, 100);
  }

  /**
   * Cierra el chatbot
   */
  function closeChatbot() {
    isOpen = false;
    suggestionsOpen = false;
    chatbotContainer.classList.remove('open');
    chatbotToggle.classList.remove('active');
    hideQuickSuggestions();
  }

  /**
   * Agrega un mensaje al chat
   * @param {string} text - Texto del mensaje
   * @param {string} sender - 'user' o 'bot'
   */
  function addMessage(text, sender = 'bot') {
    if (!text.trim()) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-message-avatar';
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    const messageContent = document.createElement('div');
    messageContent.className = 'chatbot-message-content';
    
    // Permitir saltos de línea en los mensajes (convierte \n en <br>)
    messageContent.innerHTML = text.split('\n').map(line => line.trim() ? line : '<br>').join('<br>');

    const timeDiv = document.createElement('div');
    timeDiv.className = 'chatbot-message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('es-PA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    contentDiv.appendChild(messageContent);
    contentDiv.appendChild(timeDiv);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatbotMessages.appendChild(messageDiv);

    // Scroll al final
    setTimeout(() => {
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }, 100);
  }

  /**
   * Muestra el indicador de "escribiendo..."
   */
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message bot';
    typingDiv.id = 'chatbotTyping';

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-message-avatar';
    avatar.textContent = '🤖';

    const typingContent = document.createElement('div');
    typingContent.className = 'chatbot-typing';
    typingContent.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);
    chatbotMessages.appendChild(typingDiv);

    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  /**
   * Oculta el indicador de "escribiendo..."
   */
  function hideTyping() {
    const typing = document.getElementById('chatbotTyping');
    if (typing) {
      typing.remove();
    }
  }

  /**
   * Sugerencias rápidas que se muestran al usuario
   */
  const quickSuggestions = [
    { text: '¿Qué servicios ofrecen?', key: 'servicios', action: 'navigate' },
    { text: '¿Cómo los contacto?', key: 'contacto' },
    { text: '¿Cuánto cuesta?', key: 'precio' },
    { text: '¿Qué es una PH?', key: 'ph' },
    { text: 'Ver testimonios', key: 'testimonios', action: 'navigate' },
    { text: 'Solicitar propuesta', key: 'propuesta', action: 'navigate' }
  ];

  /**
   * Navega a una sección específica de la página
   * @param {string} sectionId - ID de la sección (sin #)
   */
  function navigateToSection(sectionId) {
    if (typeof window !== 'undefined' && window.location) {
      window.location.hash = `#${sectionId}`;
      // Cerrar el chatbot después de navegar
      setTimeout(() => {
        closeChatbot();
      }, 300);
    }
  }

  /**
   * Toggle del dropdown de sugerencias
   */
  function toggleSuggestions() {
    suggestionsOpen = !suggestionsOpen;
    const suggestionsContainer = document.getElementById('chatbotSuggestions');
    
    if (!suggestionsContainer || !chatbotSuggestionsToggle) return;
    
    if (suggestionsOpen) {
      // Cargar sugerencias si no están cargadas
      if (suggestionsContainer.children.length === 0) {
        loadSuggestions();
      }
      suggestionsContainer.classList.add('show');
      chatbotSuggestionsToggle.classList.add('active');
    } else {
      suggestionsContainer.classList.remove('show');
      chatbotSuggestionsToggle.classList.remove('active');
    }
  }

  /**
   * Carga las sugerencias en el contenedor
   */
  function loadSuggestions() {
    const suggestionsContainer = document.getElementById('chatbotSuggestions');
    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = '';
    quickSuggestions.forEach(suggestion => {
      const btn = document.createElement('button');
      btn.className = 'chatbot-suggestion-btn';
      btn.textContent = suggestion.text;
      btn.addEventListener('click', () => {
        // Cerrar el dropdown de sugerencias
        suggestionsOpen = false;
        suggestionsContainer.classList.remove('show');
        if (chatbotSuggestionsToggle) {
          chatbotSuggestionsToggle.classList.remove('active');
        }
        
        // Si tiene acción de navegación, ejecutarla directamente
        if (suggestion.action === 'navigate') {
          const sectionMap = {
            'servicios': 'servicios',
            'testimonios': 'testimonios',
            'propuesta': 'propuesta'
          };
          const sectionId = sectionMap[suggestion.key];
          if (sectionId) {
            addMessage(`Te llevo a ${suggestion.text.toLowerCase()}...`, 'bot');
            setTimeout(() => {
              navigateToSection(sectionId);
            }, 800);
            return;
          }
        }
        
        // Para otras sugerencias, enviar el mensaje automáticamente
        chatbotInput.value = suggestion.text;
        sendMessage();
      });
      suggestionsContainer.appendChild(btn);
    });
  }

  /**
   * Muestra las sugerencias rápidas (para compatibilidad con código anterior)
   */
  function showQuickSuggestions() {
    if (!suggestionsOpen) {
      toggleSuggestions();
    }
  }

  /**
   * Oculta las sugerencias rápidas
   */
  function hideQuickSuggestions() {
    if (suggestionsOpen) {
      toggleSuggestions();
    }
  }

  /**
   * Procesa el mensaje del usuario y genera una respuesta
   * @param {string} userMessage - Mensaje del usuario
   * @returns {Promise<string>} Respuesta del bot
   */
  async function processMessage(userMessage) {
    const message = userMessage.toLowerCase().trim();

    // Respuestas predefinidas según palabras clave
    if (message.includes('hola') || message.includes('buenos días') || message.includes('buenas tardes') || message.includes('buenas noches')) {
      return '¡Hola! 👋 Bienvenido a PH PTY Administration. Somos especialistas en administración de propiedades horizontales en Panamá. ¿En qué puedo ayudarte hoy? Puedes hacer preguntas sobre nuestros servicios, contacto, precios o cualquier otra información.';
    }

    if (message.includes('servicio') || message.includes('administración') || message.includes('ofrecen') || message.includes('qué hacen') || message.includes('ver servicios')) {
      setTimeout(() => {
        navigateToSection('servicios');
      }, 1500);
      return 'Ofrecemos servicios completos de administración de PH:\n\n✅ Administración integral (procesos, personal, proveedores)\n✅ Gestión financiera y contable (cobros, estados de cuenta)\n✅ Supervisión de mantenimiento (seguridad, limpieza, ascensores, piscina, jardinería)\n✅ Atención a la comunidad (gestión de quejas y solicitudes)\n✅ Asesoría legal y normativa (nos regimos bajo la Ley 284 de Propiedad Horizontal)\n✅ Apoyo en asambleas\n\n📋 Todos nuestros servicios cumplen estrictamente con la Ley 284. Puedes conocer más sobre esta ley en: https://www.miviot.gob.pa/promulgan-ley-284-que-reforma-integralmente-la-propiedad-horizontal-en-panama/\n\nTe llevo a la sección de servicios para más detalles.';
    }

    if (message.includes('contacto') || message.includes('teléfono') || message.includes('whatsapp') || message.includes('cómo contacto')) {
      return '📱 Puedes contactarnos de varias formas:\n\n• WhatsApp: +507 6378-1316\n• Formulario de propuesta en la página (botón "📄 Solicita una propuesta")\n• Correo electrónico (a través del formulario)\n\nEstamos disponibles para atenderte. ¡No dudes en escribirnos! 💬';
    }

    if (message.includes('precio') || message.includes('costo') || message.includes('cuánto') || message.includes('tarifa') || message.includes('honorario')) {
      return '💰 Nuestros precios son personalizados según:\n\n• Tamaño de tu PH (número de unidades)\n• Servicios requeridos\n• Necesidades específicas\n\nTe invitamos a solicitar una propuesta sin compromiso usando el formulario en nuestra página o contactándonos directamente por WhatsApp. Analizamos tu caso y te damos una cotización detallada. 📄';
    }

    if (message.includes('ph') || message.includes('propiedad horizontal') || message.includes('qué es ph') || message.includes('que es una ph')) {
      return '🏢 Una Propiedad Horizontal (PH) es un régimen jurídico donde varias unidades (apartamentos, casas, locales) pertenecen a diferentes propietarios, pero comparten áreas comunes y servicios.\n\nNuestro trabajo es administrar todo esto: desde las finanzas hasta el mantenimiento, asegurando que todo funcione correctamente y que los residentes tengan tranquilidad. 🛡️\n\n¿Tienes alguna pregunta específica sobre administración de PH?';
    }

    if (message.includes('registro') || message.includes('registrarse') || message.includes('crear cuenta') || message.includes('cómo me registro')) {
      return '📝 Para registrarte:\n\n1. Haz clic en "Iniciar sesión" en el menú superior\n2. Luego selecciona "Crear cuenta"\n3. Completa el formulario con tus datos\n4. ¡Listo! Ya podrás iniciar sesión y acceder a todas las funcionalidades\n\nSi ya tienes cuenta, solo haz clic en "Iniciar sesión". Es rápido y sencillo. ✨';
    }

    if (message.includes('testimonio') || message.includes('opinión') || message.includes('reseña') || message.includes('comentario') || message.includes('ver testimonios')) {
      setTimeout(() => {
        navigateToSection('testimonios');
      }, 1500);
      return '⭐ Te llevo a la sección de testimonios donde puedes leer las experiencias de otros propietarios y también dejar tu propia calificación si eres cliente. 📋';
    }

    if (message.includes('noticia') || message.includes('actualización') || message.includes('novedad') || message.includes('ver noticias')) {
      setTimeout(() => {
        navigateToSection('noticias');
      }, 1500);
      return '📰 Te llevo a la sección de noticias donde compartimos información importante sobre administración de PH, consejos útiles y novedades.';
    }

    if (message.includes('propuesta') || message.includes('cotización') || message.includes('solicitar') || message.includes('ver propuesta')) {
      setTimeout(() => {
        navigateToSection('propuesta');
      }, 1500);
      return '📄 Te llevo al formulario de propuesta donde puedes solicitar una cotización personalizada. Completa el formulario con la información de tu PH y te contactaremos pronto. También puedes escribirnos directamente por WhatsApp al +507 6378-1316. 📱';
    }

    if (message.includes('horario') || message.includes('disponible') || message.includes('atención') || message.includes('cuándo')) {
      return '⏰ Estamos disponibles para atenderte:\n\n• Por WhatsApp: +507 6378-1316 (cualquier momento)\n• Formulario de contacto: 24/7\n• Email: a través del formulario\n\nNuestro equipo responderá tu consulta lo más pronto posible. 🚀';
    }

    if (message.includes('empresa') || message.includes('quiénes son') || message.includes('sobre ustedes')) {
      return '🏢 PH PTY Administration es una empresa especializada en administración de propiedades horizontales en Panamá.\n\n📋 Nuestra misión: Administrar con responsabilidad y transparencia los recursos de cada PH para garantizar el bienestar de los residentes.\n\n🎯 Nuestros valores: Transparencia, Eficiencia, Seguridad y Cercanía.\n\nPuedes conocer más sobre nosotros en la sección "Quiénes Somos" de la página. 👥';
    }

    if (message.includes('gracias') || message.includes('muchas gracias') || message.includes('perfecto')) {
      return '¡De nada! 😊 Me alegra haber podido ayudarte. Si tienes más preguntas, estaré aquí para ayudarte. También puedes contactarnos directamente por WhatsApp al +507 6378-1316. ¡Que tengas un excelente día! 🌟';
    }

    if (message.includes('adiós') || message.includes('chao') || message.includes('hasta luego') || message.includes('nos vemos')) {
      return '¡Hasta luego! 👋 Fue un placer ayudarte. Si necesitas algo más, aquí estaré. ¡Que tengas un excelente día! 🌟';
    }

    if (message.includes('ayuda') || message.includes('help') || message.includes('no entiendo')) {
      return '¡Por supuesto! 🤝 Puedo ayudarte con:\n\n• Información sobre nuestros servicios\n• Cómo contactarnos\n• Precios y propuestas\n• Registro en la plataforma\n• Información sobre PH\n• Y mucho más...\n\n¿Qué te gustaría saber? También puedes usar los botones de sugerencias rápidas para preguntas comunes. 💬';
    }

    // Respuesta por defecto con sugerencias
    return 'Entiendo tu consulta. 🤔 Para brindarte información más precisa, te recomiendo:\n\n• Contactarnos por WhatsApp: +507 6378-1316\n• Completar el formulario de propuesta\n• Revisar la sección específica en nuestra página\n\n¿Hay algo específico sobre nuestros servicios, precios o contacto que pueda ayudarte? También puedes usar las sugerencias rápidas. 💬';
  }

  /**
   * Maneja el envío de mensajes
   */
  async function sendMessage() {
    const userMessage = chatbotInput.value.trim();
    
    if (!userMessage || !isOpen) return;

    // Ocultar sugerencias
    hideQuickSuggestions();

    // Agregar mensaje del usuario
    addMessage(userMessage, 'user');
    
    // Limpiar input
    chatbotInput.value = '';
    chatbotSend.disabled = true;

    // Mostrar "escribiendo..."
    showTyping();

    // Simular delay de respuesta (más realista)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Ocultar "escribiendo..."
    hideTyping();

    // Obtener respuesta
    const botResponse = await processMessage(userMessage);
    
    // Agregar respuesta del bot
    addMessage(botResponse, 'bot');

    // No mostrar sugerencias automáticamente - el usuario puede abrirlas manualmente si quiere

    // Habilitar botón de nuevo
    chatbotSend.disabled = false;
    chatbotInput.focus();
  }

  // Event Listeners
  chatbotToggle?.addEventListener('click', () => {
    if (isOpen) {
      closeChatbot();
    } else {
      openChatbot();
    }
  });

  chatbotClose?.addEventListener('click', closeChatbot);

  chatbotSend?.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
  });

  chatbotInput?.addEventListener('keydown', (e) => {
    // Enviar mensaje al presionar Enter (sin Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatbotInput.value.trim()) {
        sendMessage();
      }
    }
  });

  // Botón de toggle de sugerencias
  chatbotSuggestionsToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSuggestions();
  });

  // Cerrar al hacer click fuera del chatbot (opcional)
  document.addEventListener('click', (e) => {
    if (isOpen && 
        chatbotContainer && 
        !chatbotContainer.contains(e.target) && 
        !chatbotToggle?.contains(e.target)) {
      // No cerrar automáticamente al hacer click fuera para mejor UX
      // closeChatbot();
    }
  });

  // Inicializar estado del input
  chatbotInput?.addEventListener('input', (e) => {
    const hasValue = chatbotInput.value.trim().length > 0;
    chatbotSend.disabled = !hasValue;
    // No cerrar sugerencias automáticamente - el usuario puede mantenerlas abiertas
  });

  // Inicializar estado del botón send
  if (chatbotSend) {
    chatbotSend.disabled = true;
  }

})();

