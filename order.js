/* Order flow: details > menu > review > payment plan > confirmed.
   Frontend demo: nothing is stored or sent, and the payment step is simulated.
   HB.order(root) wires the flow up inside `root`: the page itself, or the view the homepage router injects.

   PRICES: every dish below has `price:null`, which shows the same "xxxx" placeholder the reservation page uses.
   Put a number (in naira) on each dish, e.g. price:4500, and the line totals, order total and the
   payment-plan amounts are all calculated for you. */
window.HB = window.HB || {};
window.HB.order = function(root){
  var MENU = [
    {id:'jollof',   name:'Party Jollof',        img:'menu1.jpg',  price:null, desc:'Smoky, tomato-rich party jollof, served with your choice of sides.'},
    {id:'egusi',    name:'Egusi Soup',          img:'menu2.jpg',  price:null, desc:'Rich melon-seed soup that serves two adults, with a swallow of your choice.'},
    {id:'owerri',   name:'Ofe Owerri',          img:'menu3.jpg',  price:null, desc:'Owerri-style soup loaded with snails, cow tail, goat meat, dry fish and stockfish.'},
    {id:'afang',    name:'Afang Soup',          img:'menu4.jpg',  price:null, desc:'Hearty afang leaf soup that serves two adults, with a swallow of your choice.'},
    {id:'seafood',  name:'Seafood Rice',        img:'menu5.jpg',  price:null, desc:'Rice cooked with calamari, crab, prawns and kpanla.'},
    {id:'catfish',  name:'Catfish Pepper Soup', img:'menu6.jpg',  price:null, desc:'A hot, aromatic pepper soup built around fresh catfish.'},
    {id:'asun',     name:'Asun',                img:'menu7.jpg',  price:null, desc:'Smoky, spicy peppered goat meat, grilled and tossed in pepper sauce.'},
    {id:'croaker',  name:'Grilled Croaker Fish',img:'menu8.jpg',  price:null, desc:'Whole croaker fish grilled until smoky and tender.'},
    {id:'rivers',   name:'Native Rivers Soup',  img:'menu9.jpg',  price:null, desc:'Rivers-style soup with crab, prawns, calamari and whole fish.'},
    {id:'coconut',  name:'Coconut Rice',        img:'menu10.jpg', price:null, desc:'Fragrant rice cooked in coconut, a sweet-savoury favourite.'},
    {id:'shawarma', name:'Chicken Shawarma',    img:'menu11.jpg', price:null, desc:'Tender chicken wrapped up with fresh veggies and sauce.'},
    {id:'moimoi',   name:'Moi Moi',             img:'menu12.jpg', price:null, desc:'Steamed bean pudding, soft and lightly spiced.'}
  ];
  var MAX_QTY = 20;

  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $      = function(id){ return root.querySelector('#' + id); };
  var panels = Array.prototype.slice.call(root.querySelectorAll('[data-ostep]'));
  var bar    = $('oProgBar').querySelectorAll('li');
  var label  = $('oProgLabel');
  var titles = ['Your details','Menu','Review','Payment plan','Done'];
  var cur = 0, planId = '', qty = {};            // qty: dish id -> how many (a dish is "selected" when it is in here)

  var nameEl = $('oName'), phoneEl = $('oPhone'), emailEl = $('oEmail');

  /* ---------- helpers ---------- */
  function money(n){ return n == null ? '\u20A6xxxx' : '\u20A6' + Math.round(n).toLocaleString('en-NG'); }
  function dishById(id){ for(var i = 0; i < MENU.length; i++) if(MENU[i].id === id) return MENU[i]; }
  function chosen(){ return MENU.filter(function(d){ return qty[d.id]; }); }
  function itemCount(){ return chosen().reduce(function(n, d){ return n + qty[d.id]; }, 0); }
  function orderTotal(){                         // null while any chosen dish has no price yet
    var t = 0, list = chosen();
    for(var i = 0; i < list.length; i++){ if(list[i].price == null) return null; t += list[i].price * qty[list[i].id]; }
    return t;
  }
  function itemsText(n){ return n + (n === 1 ? ' item' : ' items'); }

  function setErr(key, msg){
    var f = root.querySelector('[data-of="' + key + '"]');
    var input = f.querySelector('input,select');
    var e = f.querySelector('.field__err');
    f.classList.toggle('bad', !!msg);
    if(msg){ e.textContent = msg; e.hidden = false; if(input) input.setAttribute('aria-invalid', 'true'); }
    else { e.hidden = true; if(input) input.removeAttribute('aria-invalid'); }
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
    var top = $('ocard').getBoundingClientRect().top + window.pageYOffset - 150;
    window.scrollTo({top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth'});
  }
  Array.prototype.forEach.call(root.querySelectorAll('[data-oback]'), function(b){
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
  root.querySelector('[data-ostep="0"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(checkDetails()) show(1);
    else { var b = this.querySelector('.bad input'); if(b) b.focus(); }
  });
  [nameEl, phoneEl, emailEl].forEach(function(el){
    el.addEventListener('input', function(){ if(el.closest('.bad')) checkDetails(); });
  });

  /* ---------- step 2: menu (pick one or more) ---------- */
  var listEl = $('oMenu'), rows = {};
  MENU.forEach(function(d){
    var li = document.createElement('li'); li.className = 'mi';
    li.innerHTML =
      '<label class="mi__row"><input type="checkbox">' +
        '<span class="mi__img"><img alt="" loading="lazy"></span>' +
        '<span class="mi__text"><span class="opt__title"></span><span class="opt__desc"></span></span>' +
        '<span class="mi__price"></span><span class="mi__check" aria-hidden="true"></span></label>' +
      '<div class="mi__qty" hidden><span>Quantity</span>' +
        '<div class="stepper stepper--sm" role="group">' +
          '<button type="button" data-q="-1"></button><output aria-live="polite">1</output><button type="button" data-q="1"></button>' +
        '</div></div>';
    var img = li.querySelector('img');
    img.onerror = function(){ this.parentNode.classList.add('noimg'); this.remove(); };
    img.src = d.img;
    li.querySelector('.opt__title').textContent = d.name;
    li.querySelector('.opt__desc').textContent  = d.desc;
    li.querySelector('.mi__price').textContent  = money(d.price);
    var minus = li.querySelector('[data-q="-1"]'), plus = li.querySelector('[data-q="1"]');
    minus.innerHTML = '&minus;'; plus.textContent = '+';
    minus.setAttribute('aria-label', 'One fewer ' + d.name);
    plus.setAttribute('aria-label',  'One more ' + d.name);
    var box = li.querySelector('input');
    box.setAttribute('aria-label', d.name);
    box.addEventListener('change', function(){
      if(box.checked) qty[d.id] = 1; else delete qty[d.id];
      paintRow(d.id); paintPick();
    });
    [minus, plus].forEach(function(btn){
      btn.addEventListener('click', function(){
        var n = (qty[d.id] || 1) + (+btn.getAttribute('data-q'));
        qty[d.id] = Math.max(1, Math.min(MAX_QTY, n));
        paintRow(d.id); paintPick();
      });
    });
    rows[d.id] = {li:li, box:box, out:li.querySelector('output'), qtyBox:li.querySelector('.mi__qty'), minus:minus, plus:plus};
    listEl.appendChild(li);
  });
  function paintRow(id){
    var r = rows[id], n = qty[id] || 0;
    r.li.classList.toggle('on', n > 0);
    r.box.checked = n > 0;
    r.qtyBox.hidden = n === 0;
    r.out.textContent = n || 1;
    r.minus.disabled = n <= 1;
    r.plus.disabled  = n >= MAX_QTY;
  }
  function paintPick(){
    var n = itemCount();
    $('oPickNote').innerHTML = '';
    var t = document.createElement('span');
    t.textContent = n ? itemsText(n) + ' selected' : 'Tap a dish to add it. You can pick as many as you like.';
    $('oPickNote').appendChild(t);
    if(n){ var s = document.createElement('strong'); s.textContent = money(orderTotal()); $('oPickNote').appendChild(s); }
    if(n) $('oPickErr').hidden = true;
  }
  paintPick();
  root.querySelector('[data-ostep="1"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!itemCount()){
      var e = $('oPickErr'); e.textContent = 'Choose at least one dish to continue.'; e.hidden = false;
      rows[MENU[0].id].box.focus(); return;
    }
    fillSummary($('oSumReview'));
    root.querySelectorAll('.oPrice').forEach(function(el){ el.textContent = money(orderTotal()); });
    show(2);
  });

  /* ---------- step 3: review ---------- */
  function row(dl, k, v){
    var d = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd');
    a.textContent = k; b.textContent = v; d.appendChild(a); d.appendChild(b); dl.appendChild(d);
  }
  function fillSummary(dl, extra){
    dl.innerHTML = '';
    row(dl, 'Name',  nameEl.value.trim());
    row(dl, 'Phone', phoneEl.value.trim());
    row(dl, 'Email', emailEl.value.trim());
    chosen().forEach(function(d){
      row(dl, qty[d.id] + ' \u00D7 ' + d.name, d.price == null ? money(null) : money(d.price * qty[d.id]));
    });
    if(extra) row(dl, extra[0], extra[1]);
  }
  root.querySelector('[data-ostep="2"]').addEventListener('submit', function(ev){
    ev.preventDefault(); drawPlans(); show(3);
  });

  /* ---------- step 4: payment plan ---------- */
  var plansEl = $('oPlans'), lastPlans = [];
  function drawPlans(){
    var t = orderTotal(), half = t == null ? null : t / 2;
    var plans = [
      {id:'full',     title:'Pay in full',          desc:'Settle the whole amount now and you are done.',                       amt:money(t)},
      {id:'deposit',  title:'Pay half now',         desc:'Pay half to start your order, the rest when you collect or receive it.', amt:money(half) + ' now'},
      {id:'split',    title:'Pay in 2 instalments', desc:'Split the total into two equal payments, one today and one later.',     amt:money(half) + ' today'},
      {id:'transfer', title:'Bank transfer',        desc:'Get the account details and pay from your banking app.',               amt:money(t)}
    ];
    plansEl.innerHTML = '';
    plans.forEach(function(p){
      var l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = '<input type="radio" name="oplan" value="' + p.id + '">' +
        '<span class="opt__body"><span class="opt__dot" aria-hidden="true"></span>' +
        '<span class="opt__text"><span class="opt__title"></span><span class="opt__desc"></span></span>' +
        '<span class="opt__amt"></span></span>';
      l.querySelector('.opt__title').textContent = p.title;
      l.querySelector('.opt__desc').textContent  = p.desc;
      l.querySelector('.opt__amt').textContent   = p.amt;
      var inp = l.querySelector('input');
      inp.checked = p.id === planId;
      inp.addEventListener('change', function(){ planId = p.id; $('oPlanErr').hidden = true; });
      plansEl.appendChild(l);
    });
    lastPlans = plans;
  }
  function planName(){
    for(var i = 0; i < lastPlans.length; i++) if(lastPlans[i].id === planId) return lastPlans[i].title;
    return '';
  }
  function makeRef(){
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = 'HB-';
    for(var i = 0; i < 6; i++) r += c.charAt(Math.floor(Math.random() * c.length));
    return r;
  }
  root.querySelector('[data-ostep="3"]').addEventListener('submit', function(ev){
    ev.preventDefault();
    if(!planId){
      var e = $('oPlanErr'); e.textContent = 'Choose a payment plan to continue.'; e.hidden = false;
      plansEl.querySelector('input').focus(); return;
    }
    var btn = $('oPayBtn'); btn.disabled = true; btn.textContent = 'Processing payment...';
    setTimeout(function(){
      btn.disabled = false; btn.textContent = 'Make payment now';
      $('oDoneSub').textContent = 'Thank you, ' + nameEl.value.trim() + '. Keep this reference for your order.';
      $('oRefCode').textContent = makeRef();
      var dl = $('oSumDone');
      fillSummary(dl, ['Payment plan', planName()]);
      row(dl, 'Order total', money(orderTotal()));
      show(4);
    }, reduce ? 300 : 1500);
  });

  /* ---------- start over ---------- */
  $('oAgain').addEventListener('click', function(){
    Array.prototype.forEach.call(root.querySelectorAll('form'), function(f){ f.reset(); });
    qty = {}; planId = '';
    MENU.forEach(function(d){ paintRow(d.id); });
    paintPick();
    ['name','phone','email'].forEach(function(k){ setErr(k, ''); });
    $('oPickErr').hidden = true;
    show(0, true);
  });
};
