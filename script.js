// Prije objave upišite poslovni WhatsApp broj (samo znamenke, npr. 3859XXXXXXXX).
const WHATSAPP_NUMBER = "";
// E-mail naručivanje treba povezati s uslugom za obrasce ili backendom prije javne objave.
const ORDER_EMAIL = "";
const form = document.getElementById('order-form');
const status = document.getElementById('status');
document.getElementById('year').textContent = new Date().getFullYear();
const menu = document.querySelector('.menu');
const nav = document.querySelector('.header nav');
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Zatvori izbornik':'Otvori izbornik')});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
function orderText(){const d=new FormData(form);return ['Upit / narudžba — Zagreb Firma Kava','',`Ime i prezime: ${d.get('name')}`,`Telefon: ${d.get('phone')}`,`E-mail: ${d.get('email')||'Nije naveden'}`,`Kupac: ${d.get('type')}`,`Proizvod / vrsta kapsula: ${d.get('product')}`,`Broj pakiranja: ${d.get('quantity')}`,`Napomena: ${d.get('message')||'Nema'}`].join('\n')}
function whatsapp(withForm=true){if(withForm&&!form.reportValidity())return;if(!WHATSAPP_NUMBER){status.textContent='WhatsApp još nije povezan. Prije objave upišite poslovni broj u script.js.';return}window.open(`https://wa.me/${WHATSAPP_NUMBER}${withForm?'?text='+encodeURIComponent(orderText()):''}`,'_blank','noopener,noreferrer')}
document.getElementById('wa-form').addEventListener('click',()=>whatsapp(true));document.getElementById('wa-quick').addEventListener('click',()=>whatsapp(false));
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const body=orderText();if(ORDER_EMAIL){window.location.href=`mailto:${encodeURIComponent(ORDER_EMAIL)}?subject=${encodeURIComponent('Upit / narudžba — Zagreb Firma Kava')}&body=${encodeURIComponent(body)}`;status.textContent='Otvorit će se vaša e-mail aplikacija s pripremljenom narudžbom. Pritisnite Pošalji.'}else{status.textContent='Obrazac je ispravno ispunjen, ali još nije povezan s e-mail uslugom. Prije stvarnih narudžbi treba konfigurirati servis za obrasce. WhatsApp također treba povezati poslovnim brojem.'}});
