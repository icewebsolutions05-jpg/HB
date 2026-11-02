/* Reservation flow: details > seating > review > payment plan > confirmed.
   Frontend demo: nothing is stored or sent, and the payment step is simulated.
   HB.reservations(root) wires the flow up inside `root`: the page itself, or the view the homepage router injects. */
window.HB = window.HB || {};
window.HB.reservations = function(root){

  var PRICE = '\u20A6xxxx';
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-step]'));
  var bar    = root.querySelectorAll('#progBar li');
  var label  = root.querySelector('#' + 'progLabel');
  var titles = ['Your details','Seating','Review','Payment plan','Done'];
  var cur = 0, guests = 2, planId = '';

  var $ = function(id){ return root.querySelector('#' + id); };
  var nameEl=$('fName'), phoneEl=$('fPhone'), emailEl=$('fEmail'), dateEl=$('fDate'), timeEl=$('fTime');

  var plans = [
    {id:'full',     title:'Pay in full',            desc:'Settle the whole amount now and you are done.',                 amt:PRICE},
    {id:'deposit',  title:'Pay a deposit',          desc:'Pay part now to hold your spot, the rest when you arrive.',     amt:PRICE + ' now'},
    {id:'split',    title:'Pay in 2 instalments',   desc:'Split the total into two payments, one today and one later.',   amt:PRICE + ' today'},
    {id:'transfer', title:'Bank transfer',          desc:'Get the account details and pay from your banking app.',        amt:PRICE}
  ];

  /* ---------- helpers ---------- */
  function iso(d){ return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2); }
  function fmtTime(h, m){ return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h >= 12 ? 'PM' : 'AM'); }
  function prettyDate(v){
    var p = v.split('-'); var d = new Date(+p[0], +p[1]-1, +p[2]);
    return d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  }
  function guestText(n){ return n + (n === 1 ? ' guest' : ' guests'); }
  function area(){ return root.querySelector('input[name="area"]:checked').value; }

  function setErr(key, msg){
    var f = root.querySelector('[data-f="' + key + '"]');
    var input = f.querySelector('input,select');
    var e = f.querySelector('.field__err');
    f.classList.toggle('bad', !!msg);
    if(msg){ e.textContent = msg; e.hidden = false; input.setAttribute('aria-invalid', 'true'); }
    else { e.hidden = true; input.removeAttribute('aria-invalid'); }
  }
  function focusFirstBad(form){
    var b = form.querySelector('.bad input, .bad select'); if(b) b.focus();
  }

  /* ---------- step switching ---------- */
  function show(n, back){
    cur = n;
    panels.forEach(function(p, i){
      var on = i === n;
      p.hidden = !on;
      p.classList.remove('is-in', 'back');
      if(on){ void p.offsetWidth; p.classList.add('is-in'); if(back) p.classList.add('back'); }
    });
    for(var i = 0; i < bar.length; i++) bar[i].classList.toggle('on', i <= Math.min(n, 3));
    label.textContent = n < 4 ? 'Step ' + (n+1) + ' of 4: ' + titles[n] : 'All done';
    if(n === 4) for(var j = 0; j < bar.length; j++) bar[j].classList.add('on');
    var h = panels[n].querySelector('h2');
    if(h) h.focus({preventScroll:true});
    var top = $('rcard').getBoundingClientRect().top + window.pageYOffset - 150;
    window.scrollTo({top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth'});
  }

  Array.prototype.forEach.call(root.querySelectorAll('[data-back]'), function(b){
    b.addEventListener('click', function(){ show(cur - 1, true); });
  });

  /* ---------- step 1: details ---------- */
  function checkDetails(){
    var ok = true, n = nameEl.value.trim(), p = phoneEl.value.trim(), e = emailEl.value.trim();
    var digits = p.replace(/\D/g, '');
    if(n.length < 2){ setErr('name', 'Enter your first name.'); ok = false; } else setErr('name', '');
    if(!/^[+\d][\d\s\-()]*$/.test(p) || digits.length < 10 || digits.length > 14){ setErr('phone', 'Enter a valid phone number, for example 0801 234 5678.'); ok = false; } else setErr('phone', '');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)){ setErr('email', 'Enter a valid email address, for example name@email.com.'); ok = false; } else setErr('email', '');
    return ok;
  }
  root.querySelector('[data-step="0"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(checkDetails()) show(1); else focusFirstBad(this);
  });
  [nameEl, phoneEl, emailEl].forEach(function(el){
    el.addEventListener('input', function(){ if(el.closest('.bad')) checkDetails(); });
  });

  /* ---------- step 2: seating ---------- */
  var today = new Date(), max = new Date(); max.setDate(max.getDate() + 90);
  dateEl.min = iso(today); dateEl.max = iso(max);

  function buildTimes(){
    var keep = timeEl.value, now = new Date(), isToday = dateEl.value === iso(now);
    var cutoff = now.getHours() * 60 + now.getMinutes() + 60;      // need at least an hour's notice today
    var html = '<option value="" disabled selected>Choose a time</option>', free = 0;
    for(var h = 9; h <= 22; h++){
      [0, 30].forEach(function(m){
        if(h === 22 && m === 30) return;                              // last booking 10:00 PM
        var off = isToday && (h * 60 + m) < cutoff;
        if(!off) free++;
        html += '<option value="' + h + ':' + (m ? '30' : '00') + '"' + (off ? ' disabled' : '') + '>' + fmtTime(h, m) + '</option>';
      });
    }
    timeEl.innerHTML = html;
    if(keep){ var o = timeEl.querySelector('option[value="' + keep + '"]'); if(o && !o.disabled) timeEl.value = keep; }
    $('tNote').textContent = (isToday && !free) ? 'No times left today. Pick another date.' : 'Open 9:00 AM to 11:00 PM. Last booking 10:00 PM.';
  }
  buildTimes();
  dateEl.addEventListener('change', function(){ buildTimes(); if(dateEl.closest('.bad')) checkSeating(); });
  timeEl.addEventListener('change', function(){ if(timeEl.closest('.bad')) checkSeating(); });

  function drawGuests(){
    $('gOut').textContent = guestText(guests);
    $('gMinus').disabled = guests <= 1;
    $('gPlus').disabled  = guests >= 20;
  }
  $('gMinus').addEventListener('click', function(){ if(guests > 1){ guests--; drawGuests(); } });
  $('gPlus').addEventListener('click',  function(){ if(guests < 20){ guests++; drawGuests(); } });
  drawGuests();

  function checkSeating(){
    var ok = true, d = dateEl.value;
    if(!d){ setErr('date', 'Choose a date.'); ok = false; }
    else if(d < dateEl.min){ setErr('date', 'Choose today or a later date.'); ok = false; }
    else if(d > dateEl.max){ setErr('date', 'We take bookings up to 90 days ahead.'); ok = false; }
    else setErr('date', '');
    if(!timeEl.value){ setErr('time', 'Choose a time.'); ok = false; } else setErr('time', '');
    return ok;
  }
  root.querySelector('[data-step="1"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!checkSeating()){ focusFirstBad(this); return; }
    fillSummary($('sumReview'));
    show(2);
  });

  /* ---------- step 3: review ---------- */
  function row(dl, k, v){
    var d = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd');
    a.textContent = k; b.textContent = v; d.appendChild(a); d.appendChild(b); dl.appendChild(d);
  }
  function fillSummary(dl, extra){
    dl.innerHTML = '';
    row(dl, 'Name',    nameEl.value.trim());
    row(dl, 'Phone',   phoneEl.value.trim());
    row(dl, 'Email',   emailEl.value.trim());
    row(dl, 'Seating', area());
    row(dl, 'Guests',  String(guests));
    row(dl, 'Date',    prettyDate(dateEl.value));
    row(dl, 'Time',    timeEl.options[timeEl.selectedIndex].text);
    if(extra) row(dl, extra[0], extra[1]);
  }
  root.querySelector('[data-step="2"]').addEventListener('submit', function(ev){
    ev.preventDefault(); show(3);
  });

  /* ---------- step 4: payment plan ---------- */
  var plansEl = $('plans');
  plans.forEach(function(p){
    var l = document.createElement('label'); l.className = 'opt';
    l.innerHTML = '<input type="radio" name="plan" value="' + p.id + '">' +
      '<span class="opt__body"><span class="opt__dot" aria-hidden="true"></span>' +
      '<span class="opt__text"><span class="opt__title"></span><span class="opt__desc"></span></span>' +
      '<span class="opt__amt"></span></span>';
    l.querySelector('.opt__title').textContent = p.title;
    l.querySelector('.opt__desc').textContent  = p.desc;
    l.querySelector('.opt__amt').textContent   = p.amt;
    l.querySelector('input').addEventListener('change', function(){ planId = p.id; $('ePlan').hidden = true; });
    plansEl.appendChild(l);
  });

  function planName(){ for(var i = 0; i < plans.length; i++) if(plans[i].id === planId) return plans[i].title; return ''; }
  function makeRef(){
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = 'HB-';
    for(var i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    return r;
  }

  root.querySelector('[data-step="3"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!planId){
      var e = $('ePlan'); e.textContent = 'Choose a payment plan to continue.'; e.hidden = false;
      plansEl.querySelector('input').focus(); return;
    }
    var btn = $('payBtn'); btn.disabled = true; btn.textContent = 'Processing payment...';
    setTimeout(function(){
      btn.disabled = false; btn.textContent = 'Make payment now';
      $('doneSub').textContent = 'Thank you, ' + nameEl.value.trim() + '. Show this reference when you arrive.';
      $('refCode').textContent = makeRef();
      fillSummary($('sumDone'), ['Payment plan', planName()]);
      show(4);
    }, reduce ? 300 : 1500);
  });

  /* ---------- start over ---------- */
  $('again').addEventListener('click', function(){
    Array.prototype.forEach.call(root.querySelectorAll('form'), function(f){ f.reset(); });
    planId = ''; guests = 2; drawGuests(); buildTimes();
    ['name','phone','email','date','time'].forEach(function(k){ setErr(k, ''); });
    show(0, true);
  });
};
