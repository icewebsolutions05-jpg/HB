/* Customer care: admin inbox + one demo conversation.
   Frontend demo: nothing is stored or sent. Typing a message and pressing send just shows it in the chat
   (Sending > Sent > Delivered) so the interface can be shown off.
   HB.care(root) wires it up inside `root`: the page itself, or the view the homepage router injects. */
window.HB = window.HB || {};
window.HB.care = function(root){
  var $ = function(id){ return root.querySelector('#' + id); };
  var cc = $('cc'), openBtn = $('ccOpen'), backBtn = $('ccBack'), conv = $('ccConv'), empty = $('ccEmpty');
  var msgs = $('ccMsgs'), form = $('ccForm'), input = $('ccInput'), send = $('ccSend');
  var reduce  = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var wide    = window.matchMedia('(min-width:900px)');

  /* the conversation that is already in the chat when it opens (customer messages, no reply yet) */
  var SEED = [
    {who:'them', text:'Hello, good morning. I am planning to stop by this evening.', time:'10:41 AM'},
    {who:'them', text:'What time do you close today?',                              time:'10:42 AM'}
  ];

  function clock(){ return new Date().toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}); }
  function toBottom(smooth){ msgs.scrollTo({top: msgs.scrollHeight, behavior: (smooth && !reduce) ? 'smooth' : 'auto'}); }

  function bubble(m){
    var wrap = document.createElement('div'); wrap.className = 'msg msg--' + m.who;
    var b = document.createElement('div');    b.className = 'bubble'; b.textContent = m.text;
    var meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = m.time + (m.status ? ' \u00B7 ' + m.status : '');
    wrap.appendChild(b); wrap.appendChild(meta);
    return {wrap:wrap, meta:meta, time:m.time};
  }

  var day = document.createElement('div'); day.className = 'cc__day'; day.textContent = 'Today';
  msgs.appendChild(day);
  SEED.forEach(function(m){ msgs.appendChild(bubble(m).wrap); });

  /* keep the chat exactly screen-height on phones, even while the keyboard is open */
  function fit(){
    if(wide.matches || cc.getAttribute('data-view') !== 'chat'){ cc.style.height = ''; return; }
    var h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    cc.style.height = Math.max(340, h - 92) + 'px';
  }
  window.addEventListener('resize', fit);
  if(window.visualViewport) window.visualViewport.addEventListener('resize', function(){ fit(); toBottom(false); });

  function openChat(){
    cc.setAttribute('data-view', 'chat');
    conv.hidden = false; empty.hidden = true;
    openBtn.classList.add('on');
    var badge = $('ccBadge'); if(badge) badge.hidden = true;
    var name = root.querySelector('.ci--open .ci__name'); if(name) name.classList.remove('unread');
    fit(); toBottom(false);
    if(!wide.matches){
      var top = cc.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo({top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth'});
    } else input.focus({preventScroll:true});
  }
  function closeChat(){
    cc.setAttribute('data-view', 'list');
    cc.style.height = '';
    if(wide.matches){ conv.hidden = true; empty.hidden = false; openBtn.classList.remove('on'); }
    var top = cc.getBoundingClientRect().top + window.pageYOffset - 130;
    window.scrollTo({top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth'});
  }
  openBtn.addEventListener('click', openChat);
  backBtn.addEventListener('click', closeChat);
  wide.addEventListener && wide.addEventListener('change', fit);

  input.addEventListener('input', function(){ send.disabled = !input.value.trim(); });

  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    var text = input.value.trim();
    if(!text) return;
    var m = bubble({who:'me', text:text, time:clock(), status:'Sending...'});
    msgs.appendChild(m.wrap);
    input.value = ''; send.disabled = true;
    input.focus({preventScroll:true});
    toBottom(true);

    /* the chat list shows the newest message */
    $('ccPreview').textContent = 'You: ' + text;
    $('ccTime').textContent = m.time;

    function status(s){ m.meta.textContent = m.time + ' \u00B7 ' + s; }
    setTimeout(function(){ status('Sent'); },      reduce ? 100 : 600);
    setTimeout(function(){ status('Delivered'); }, reduce ? 200 : 1400);
  });
};
