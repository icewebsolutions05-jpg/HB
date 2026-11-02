/* Orders / Reservations look-up. Frontend demo: nothing is sent anywhere.
   Demo IDs: HB-1234 (reservation), HB-5678 (order). HB.track(root) wires it up inside `root`. */
window.HB = window.HB || {};
window.HB.track = function(root){
  var $ = function(id){ return root.querySelector('#' + id); };
  var seg = $('tSeg'), tabs = seg.querySelectorAll('button'), form = $('tForm'), input = $('tId');
  var err = $('tErr'), out = $('tOut'), btn = $('tBtn'), field = $('tField');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches, kind = 'res';
  function day(n){ var d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'}); }
  var DATA = {
    res: {'HB-1234': {status:'Confirmed', rows:[['Name','Adaeze Okafor'],['Phone','0801 234 5678'],['Seating','Table'],['Guests','4'],['Date',day(2)],['Time','7:30 PM'],['Payment plan','Pay a deposit']]}},
    ord: {'HB-5678': {status:'Preparing', rows:[['Name','Tunde Bakare'],['Phone','0803 555 0142'],['2 \u00D7 Egusi Soup','\u20A6xxxx'],['1 \u00D7 Asun','\u20A6xxxx'],['Payment plan','Pay in full']]}}
  };
  var TXT = {
    res: {lbl:'Reservation ID', btn:'Find reservation', ph:'e.g. HB-1234', noun:'reservation'},
    ord: {lbl:'Order ID',       btn:'Find order',       ph:'e.g. HB-5678', noun:'order'}
  };
  function setErr(m){ field.classList.toggle('bad', !!m); err.hidden = !m; err.textContent = m || ''; if(m) input.setAttribute('aria-invalid','true'); else input.removeAttribute('aria-invalid'); }
  function setKind(k){
    kind = k; seg.setAttribute('data-k', k);
    Array.prototype.forEach.call(tabs, function(t){ t.setAttribute('aria-pressed', t.getAttribute('data-k') === k ? 'true' : 'false'); });
    $('tLbl').textContent = TXT[k].lbl; btn.textContent = TXT[k].btn; input.placeholder = TXT[k].ph;
    input.value = ''; out.hidden = true; out.innerHTML = ''; setErr('');
  }
  Array.prototype.forEach.call(tabs, function(t){ t.addEventListener('click', function(){ setKind(t.getAttribute('data-k')); }); });
  input.addEventListener('input', function(){ if(field.classList.contains('bad')) setErr(''); });

  /* draws the details onto a canvas and downloads it as a PNG (no libraries needed) */
  function savePic(id, rec){
    var W = 720, P = 40, top = 270, rowH = 58, H = top + rec.rows.length * rowH + 90, S = 2;
    var c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
    var x = c.getContext('2d'); x.scale(S, S);
    var sans = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', serif = 'Georgia,"Times New Roman",serif';
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#1F6F3A'; x.fillRect(0, 0, W, 130);
    x.fillStyle = '#fff'; x.font = '700 32px ' + serif; x.fillText('The HB Restaurant & Lounge', P, 62);
    x.font = '400 19px ' + sans; x.fillText(kind === 'res' ? 'Reservation details' : 'Order details', P, 100);
    x.fillStyle = '#555'; x.font = '400 17px ' + sans; x.fillText(TXT[kind].lbl, P, 178);
    x.fillStyle = '#1F6F3A'; x.font = '700 46px ' + serif; x.fillText(id, P, 228);
    x.font = '700 16px ' + sans; var tw = x.measureText(rec.status).width + 32, cx = W - P - tw;
    x.fillStyle = '#1F6F3A'; x.beginPath();
    if(x.roundRect) x.roundRect(cx, 196, tw, 34, 17); else x.rect(cx, 196, tw, 34);
    x.fill(); x.fillStyle = '#fff'; x.fillText(rec.status, cx + 16, 219);
    rec.rows.forEach(function(r, i){
      var y = top + i * rowH;
      x.fillStyle = '#e3eae5'; x.fillRect(P, y, W - 2 * P, 1);
      x.fillStyle = '#555'; x.font = '400 18px ' + sans; x.textAlign = 'left'; x.fillText(r[0], P, y + 36);
      x.fillStyle = '#111'; x.font = '700 18px ' + sans; x.textAlign = 'right'; x.fillText(r[1], W - P, y + 36);
    });
    x.textAlign = 'left'; x.fillStyle = '#e3eae5'; x.fillRect(P, top + rec.rows.length * rowH, W - 2 * P, 1);
    x.fillStyle = '#777'; x.font = '400 15px ' + sans; x.fillText('Show this ID when you arrive.', P, H - 34);
    c.toBlob(function(blob){
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = id + '-' + TXT[kind].noun + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
    }, 'image/png');
  }

  function render(id, rec){
    out.innerHTML = '';
    var ref = document.createElement('div'); ref.className = 'ref';
    var a = document.createElement('span'); a.textContent = TXT[kind].lbl;
    var b = document.createElement('strong'); b.textContent = id;
    var chip = document.createElement('em'); chip.className = 'chip'; chip.textContent = rec.status;
    ref.appendChild(a); ref.appendChild(b); ref.appendChild(chip);
    var dl = document.createElement('dl'); dl.className = 'sum';
    rec.rows.forEach(function(r){
      var d = document.createElement('div'), k = document.createElement('dt'), v = document.createElement('dd');
      k.textContent = r[0]; v.textContent = r[1]; d.appendChild(k); d.appendChild(v); dl.appendChild(d);
    });
    var pt = document.createElement('p'); pt.className = 'ptitle'; pt.textContent = 'The HB Restaurant & Lounge';
    var act = document.createElement('div'); act.className = 'actions tout__actions';
    var pr = document.createElement('button'); pr.type = 'button'; pr.className = 'rbtn rbtn--dark'; pr.textContent = 'Print';
    var sv = document.createElement('button'); sv.type = 'button'; sv.className = 'rbtn rbtn--green'; sv.textContent = 'Save picture';
    pr.addEventListener('click', function(){ window.print(); });
    sv.addEventListener('click', function(){ savePic(id, rec); });
    act.appendChild(pr); act.appendChild(sv);
    out.appendChild(pt); out.appendChild(ref); out.appendChild(dl); out.appendChild(act);
    out.hidden = false; out.classList.remove('is-in'); void out.offsetWidth; out.classList.add('is-in');
    out.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'nearest'});
  }

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var id = input.value.trim().toUpperCase().replace(/\s+/g, '').replace(/^HB(\d)/, 'HB-$1');
    out.hidden = true;
    if(!id){ setErr('Enter your ' + TXT[kind].lbl.toLowerCase() + '.'); input.focus(); return; }
    setErr(''); btn.disabled = true; btn.textContent = 'Searching...';
    setTimeout(function(){
      btn.disabled = false; btn.textContent = TXT[kind].btn;
      var rec = DATA[kind][id];
      if(rec) render(id, rec);
      else { setErr('We could not find a ' + TXT[kind].noun + ' with that ID. Check it and try again.'); input.focus(); }
    }, reduce ? 100 : 800);
  });
  setKind('res');
};
