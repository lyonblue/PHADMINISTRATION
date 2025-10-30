// React-based section router (sin JSX)
(function(){
  const { useEffect } = React;

  function showSection(hash){
    const targetHash = hash && document.querySelector(hash) ? hash : '#inicio';
    document.querySelectorAll('.section').forEach(sec=>sec.classList.remove('on'));
    const target = document.querySelector(targetHash);
    if(target){
      target.classList.add('on');
    }
  }

  function Router(){
    useEffect(()=>{
      showSection(window.location.hash);
      const onHash = ()=>{
        showSection(window.location.hash);
      };
      window.addEventListener('hashchange', onHash);
      return ()=>window.removeEventListener('hashchange', onHash);
    },[]);

    // Mejorar UX: si clic en nav ancla, permitir comportamiento por defecto (hashchange)
    // No renderiza UI; solo controla secciones
    return null;
  }

  const rootEl = document.createElement('div');
  document.body.appendChild(rootEl);
  const root = ReactDOM.createRoot(rootEl);
  root.render(React.createElement(Router));
})();


