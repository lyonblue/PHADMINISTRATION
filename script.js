// Utilidades simples (demo sin backend)
const $ = (q) => document.querySelector(q);

// Año dinámico
$('#year').textContent = new Date().getFullYear();

// Menú móvil
const mobileMenu = $('#mobileMenu');
const menuBtn = $('#menuBtn');
menuBtn?.addEventListener('click', ()=>{
  mobileMenu.style.display = mobileMenu.style.display === 'block' ? 'none' : 'block';
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

// TESTIMONIOS (localStorage)
const TESTI_KEY = 'phpty_testimonios_v1';
const loadTesti = () => JSON.parse(localStorage.getItem(TESTI_KEY)||'[]');
const saveTesti = (arr) => localStorage.setItem(TESTI_KEY, JSON.stringify(arr));
const renderTesti = () => {
  const box = $('#testiList');
  box.innerHTML='';
  const data = loadTesti();
  if(!data.length){
    const empty = document.createElement('div');
    empty.className='subtle';
    empty.textContent='Aún no hay testimonios.';
    box.appendChild(empty);
    return;
  }
  data.slice().reverse().forEach(t=>{
    const item = document.createElement('div');
    item.className='testimonial';
    item.innerHTML = `<div class="stars">${'★'.repeat(t.stars)}${'☆'.repeat(5-t.stars)}</div>
                      <p>${t.msg}</p>
                      <div class="subtle">— ${t.name}</div>`;
    box.appendChild(item);
  });
};
renderTesti();

$('#testiForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('#tName').value.trim();
  const stars = parseInt($('#tStars').value,10);
  const msg = $('#tMsg').value.trim();
  if(!name || !msg) return;
  const list = loadTesti();
  list.push({name, stars, msg, at: Date.now()});
  saveTesti(list);
  e.target.reset();
  renderTesti();
  alert('¡Gracias por tu opinión! (Guardado local en este navegador)');
});

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