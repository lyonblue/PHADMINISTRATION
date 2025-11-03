/**
 * Sistema de enrutamiento de secciones basado en React
 * Maneja la navegación entre secciones usando hash (#) en la URL
 * Protege la sección de administración para usuarios no autorizados
 */

(function(){
  const { useEffect } = React;

  /**
   * Muestra la sección correspondiente al hash de la URL
   * Oculta todas las secciones y muestra solo la activa
   * @param {string} hash - Hash de la URL (ej: '#inicio', '#noticias')
   */
  function showSection(hash){
    const targetHash = hash && document.querySelector(hash) ? hash : '#inicio';
    
    // Proteger sección de administración: solo admins pueden acceder
    if(targetHash === '#administracion'){
      const token = localStorage.getItem('accessToken');
      const userRole = localStorage.getItem('userRole');
      if(!token || userRole !== 'admin'){
        // Redirigir a inicio si no es admin
        window.location.hash = '#inicio';
        return;
      }
    }
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(sec=>sec.classList.remove('on'));
    // Mostrar la sección objetivo
    const target = document.querySelector(targetHash);
    if(target){
      target.classList.add('on');
    }
  }

  /**
   * Componente Router de React
   * Maneja los cambios de hash y actualiza la sección visible
   */
  function Router(){
    useEffect(()=>{
      // Mostrar sección inicial basada en el hash actual
      showSection(window.location.hash);
      
      // Escuchar cambios de hash (navegación)
      const onHash = ()=>{
        showSection(window.location.hash);
      };
      window.addEventListener('hashchange', onHash);
      
      // Cleanup: remover listener al desmontar
      return ()=>window.removeEventListener('hashchange', onHash);
    },[]);

    // Este componente no renderiza UI, solo controla la visibilidad de secciones
    return null;
  }

  // Inicializar React Router
  const rootEl = document.createElement('div');
  document.body.appendChild(rootEl);
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(Router));
})();
