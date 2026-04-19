document.addEventListener('DOMContentLoaded',()=>{
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if(toggle){
    toggle.addEventListener('click',()=>{
      if(nav.style.display==='flex') nav.style.display='none';
      else nav.style.display='flex';
      nav.style.flexDirection='column';
    });
  }

  const form = document.getElementById('newsletter');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const email = form.querySelector('input[name=email]').value;
      if(!email.includes('@')){
        alert('Please enter a valid email');
        return;
      }
      alert('Thanks! You are now signed to the Hexistenz crypt (placeholder).');
      form.reset();
    });
  }
});
