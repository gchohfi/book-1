(function(){
  const $ = (s,ctx=document)=>ctx.querySelector(s);
  const $$ = (s,ctx=document)=>Array.from(ctx.querySelectorAll(s));
  const uuid = ()=>Math.random().toString(36).slice(2,9);

  const state = {
    book: {
      title: "Meu Livrinho",
      pages: []
    },
    selectedId: null,
    modeReader: false,
    readerIndex: 0
  };

  // --- Storage ---
  const STORAGE_KEY = "livrinho-standalone";
  function saveLocal(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state.book)); }catch(e){}
  }
  function loadLocal(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        state.book = JSON.parse(raw);
      } else {
        seedDemo();
      }
    }catch(e){
      seedDemo();
    }
  }

  function seedDemo(){
    state.book = {
      title: "Meu Livrinho",
      pages: [
        {id:uuid(), type:"cover", data:{title:"Título do Livrinho", subtitle:"Subtítulo / Idade / Tema", intro:"Bem-vindo! Vamos aprender brincando."}},
        {id:uuid(), type:"content", data:{title:"O que vamos aprender", html:"<ul><li>Ponto 1</li><li>Ponto 2</li><li>Ponto 3</li></ul>"}},
        {id:uuid(), type:"quiz", data:{question:"Qual é a resposta correta?", options:[
          {text:"Opção correta", correct:true},
          {text:"Opção 2", correct:false},
          {text:"Opção 3", correct:false},
        ]}},
        {id:uuid(), type:"dragdrop", data:{
          title:"Classifique os itens",
          buckets:[{id:"frutas", label:"Frutas", accept:["fruta"]},{id:"legumes", label:"Legumes", accept:["legume"]}],
          items:[
            {id:uuid(), label:"🍎 Maçã", type:"fruta"},
            {id:uuid(), label:"🥕 Cenoura", type:"legume"},
            {id:uuid(), label:"🍌 Banana", type:"fruta"},
            {id:uuid(), label:"🥦 Brócolis", type:"legume"},
          ]
        }},
        {id:uuid(), type:"end", data:{message:"Parabéns! Você terminou o livrinho."}},
      ]
    };
  }

  // --- UI refs ---
  const pagesList = $("#pagesList");
  const editorFields = $("#editorFields");
  const readerArea = $("#readerArea");
  const readerNav = $("#readerNav");
  const progressBar = $(".book-progress-bar");
  const btnAdd = $("#btnAdd");
  const addMenu = $("#addMenu");
  const btnReader = $("#btnReader");
  const btnExportJson = $("#btnExportJson");
  const btnExportPdf = $("#btnExportPdf");
  const fileJson = $("#fileJson");
  const btnClear = $("#btnClear");
  const prevPageBtn = $("#prevPage");
  const nextPageBtn = $("#nextPage");

  // --- Init ---
  loadLocal();
  render();
  bindTopbar();

  function render(){
    renderPagesList();
    renderEditor();
    renderReader();
    saveLocal();
  }

  // --- Pages list ---
  function renderPagesList(){
    pagesList.innerHTML = "";
    state.book.pages.forEach((p,idx)=>{
      const li = document.createElement("li");
      li.className = "page-item" + (p.id===state.selectedId ? " active" : "");
      li.dataset.id = p.id;
      li.innerHTML = `<span>${idx+1}. ${labelForType(p.type)}</span>
                      <div class="page-actions">
                        <button title="Subir" data-act="up">🔼</button>
                        <button title="Descer" data-act="down">🔽</button>
                        <button title="Duplicar" data-act="dup">📄</button>
                        <button title="Excluir" data-act="del">🗑️</button>
                      </div>`;
      li.addEventListener("click", (ev)=>{
        if(ev.target.closest("[data-act]")) return;
        state.selectedId = p.id;
        render();
      });
      li.querySelector('[data-act="up"]').addEventListener("click", (ev)=>{ev.stopPropagation(); movePage(idx,-1)});
      li.querySelector('[data-act="down"]').addEventListener("click", (ev)=>{ev.stopPropagation(); movePage(idx,1)});
      li.querySelector('[data-act="dup"]').addEventListener("click", (ev)=>{ev.stopPropagation(); duplicatePage(idx)});
      li.querySelector('[data-act="del"]').addEventListener("click", (ev)=>{ev.stopPropagation(); deletePage(idx)});
      pagesList.appendChild(li);
    });
    if(!state.selectedId && state.book.pages[0]){
      state.selectedId = state.book.pages[0].id;
    }
  }

  function labelForType(type){
    return {cover:"Capa",content:"Conteúdo",quiz:"Quiz",dragdrop:"Arrastar & Soltar",end:"Final"}[type] || type;
  }

  function movePage(index,dir){
    const tgt = index + dir;
    if(tgt < 0 || tgt >= state.book.pages.length) return;
    const arr = state.book.pages;
    [arr[index], arr[tgt]] = [arr[tgt], arr[index]];
    render();
  }
  function duplicatePage(index){
    const src = state.book.pages[index];
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uuid();
    state.book.pages.splice(index+1, 0, copy);
    render();
  }
  function deletePage(index){
    const id = state.book.pages[index].id;
    state.book.pages.splice(index,1);
    if(state.selectedId === id) state.selectedId = state.book.pages[0]?.id || null;
    render();
  }

  // --- Add pages ---
  btnAdd.addEventListener("click", ()=>{
    addMenu.hidden = !addMenu.hidden;
  });
  addMenu.addEventListener("click", (ev)=>{
    const type = ev.target?.dataset?.add;
    if(!type) return;
    addMenu.hidden = true;
    addPage(type);
  });
  document.addEventListener("click",(ev)=>{
    if(!addMenu.hidden && !ev.target.closest("#btnAdd,.dropdown")) addMenu.hidden = true;
  });

  function addPage(type){
    let data = {};
    if(type==="cover") data = {title:"Novo Livrinho", subtitle:"Subtítulo", intro:"Escreva um resumo aqui."};
    if(type==="content") data = {title:"Título da Página", html:"<p>Seu conteúdo aqui...</p>"};
    if(type==="quiz") data = {question:"Sua pergunta aqui...", options:[{text:"Opção A",correct:true},{text:"Opção B",correct:false},{text:"Opção C",correct:false}]};
    if(type==="dragdrop") data = {title:"Classifique...", buckets:[{id:"a",label:"Grupo A",accept:["a"]},{id:"b",label:"Grupo B",accept:["b"]}], items:[{id:uuid(),label:"Item 1",type:"a"},{id:uuid(),label:"Item 2",type:"b"}]};
    if(type==="end") data = {message:"Parabéns! Fim."};
    const page = {id:uuid(), type, data};
    state.book.pages.push(page);
    state.selectedId = page.id;
    render();
  }

  // --- Editor ---
  function renderEditor(){
    const page = state.book.pages.find(p=>p.id===state.selectedId);
    if(!page){
      editorFields.innerHTML = "<p>Nenhuma página selecionada.</p>";
      return;
    }
    const f = [];
    if(page.type==="cover"){
      f.push(fieldText("Título","data.title",page.data.title));
      f.push(fieldText("Subtítulo","data.subtitle",page.data.subtitle));
      f.push(fieldTextArea("Introdução (texto curto)","data.intro",page.data.intro));
    }
    if(page.type==="content"){
      f.push(fieldText("Título","data.title",page.data.title));
      f.push(fieldTextArea("Conteúdo (HTML simples permitido)","data.html",page.data.html));
    }
    if(page.type==="quiz"){
      f.push(fieldText("Pergunta","data.question",page.data.question));
      const list = document.createElement("div");
      list.className = "field";
      list.innerHTML = `<label>Opções</label>`;
      page.data.options.forEach((opt,i)=>{
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <input type="text" value="${escapeHtml(opt.text)}" data-bind="data.options.${i}.text" style="flex:1">
          <label class="small"><input type="checkbox" ${opt.correct?"checked":""} data-bind="data.options.${i}.correct"> correta</label>
          <button data-op="del" data-i="${i}" title="remover">🗑️</button>
        `;
        list.appendChild(row);
      });
      const addBtn = document.createElement("button");
      addBtn.className = "btn";
      addBtn.type = "button";
      addBtn.textContent = "+ Adicionar opção";
      addBtn.addEventListener("click",()=>{
        page.data.options.push({text:"Nova opção",correct:false});
        render();
      });
      list.appendChild(addBtn);
      f.push(list);
    }
    if(page.type==="dragdrop"){
      f.push(fieldText("Título","data.title",page.data.title));
      // Buckets
      const buckets = document.createElement("div");
      buckets.className = "field";
      buckets.innerHTML = `<label>Grupos (alvos)</label>`;
      page.data.buckets.forEach((b,i)=>{
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <input type="text" value="${escapeHtml(b.label)}" data-bind="data.buckets.${i}.label" style="flex:1">
          <input type="text" value="${escapeHtml(b.accept.join(','))}" data-bind="data.buckets.${i}.accept" style="flex:1" title="Tipos aceitos separados por vírgula">
          <button data-bk="del" data-i="${i}" title="remover">🗑️</button>
        `;
        buckets.appendChild(row);
      });
      const btnB = document.createElement("button");
      btnB.className = "btn"; btnB.type="button"; btnB.textContent = "+ Adicionar grupo";
      btnB.addEventListener("click",()=>{ page.data.buckets.push({id:uuid(),label:"Novo grupo",accept:["x"]}); render(); });
      buckets.appendChild(btnB);
      f.push(buckets);
      // Items
      const items = document.createElement("div");
      items.className = "field";
      items.innerHTML = `<label>Itens</label>`;
      page.data.items.forEach((it,i)=>{
        const row = document.createElement("div");
        row.className = "row";
        row.innerHTML = `
          <input type="text" value="${escapeHtml(it.label)}" data-bind="data.items.${i}.label" style="flex:1">
          <input type="text" value="${escapeHtml(it.type)}" data-bind="data.items.${i}.type" style="width:120px">
          <button data-it="del" data-i="${i}" title="remover">🗑️</button>
        `;
        items.appendChild(row);
      });
      const btnI = document.createElement("button");
      btnI.className = "btn"; btnI.type="button"; btnI.textContent = "+ Adicionar item";
      btnI.addEventListener("click",()=>{ page.data.items.push({id:uuid(),label:"Novo item",type:"x"}); render(); });
      items.appendChild(btnI);
      f.push(items);
    }
    if(page.type==="end"){
      f.push(fieldTextArea("Mensagem final","data.message",page.data.message));
    }
    editorFields.innerHTML = "";
    f.forEach(el=>editorFields.appendChild(el));

    // bind change on dynamic inputs
    $$("input[data-bind],textarea[data-bind]", editorFields).forEach(input=>{
      input.addEventListener("input", ()=>{
        bindValue(page, input.dataset.bind, input);
        renderReader();
        saveLocal();
      });
    });
    $$("button[data-op='del']", editorFields).forEach(btn=>{
      btn.addEventListener("click",()=>{
        const i = +btn.dataset.i;
        page.data.options.splice(i,1);
        render();
      });
    });
    $$("button[data-bk='del']", editorFields).forEach(btn=>{
      btn.addEventListener("click",()=>{
        const i = +btn.dataset.i;
        page.data.buckets.splice(i,1);
        render();
      });
    });
    $$("button[data-it='del']", editorFields).forEach(btn=>{
      btn.addEventListener("click",()=>{
        const i = +btn.dataset.i;
        page.data.items.splice(i,1);
        render();
      });
    });
  }

  function fieldText(label, bind, value){
    const w = document.createElement("div"); w.className="field";
    w.innerHTML = `<label>${label}</label><input type="text" data-bind="${bind}" value="${escapeHtml(value||"")}">`;
    return w;
  }
  function fieldTextArea(label, bind, value){
    const w = document.createElement("div"); w.className="field";
    w.innerHTML = `<label>${label}</label><textarea data-bind="${bind}">${escapeHtml(value||"")}</textarea>`;
    return w;
  }
  function bindValue(page, path, input){
    const parts = path.split(".");
    let ref = page;
    for(let i=0;i<parts.length-1;i++){
      const k = parts[i];
      if(k === "accept"){
        // handled on write below
      }
      ref = ref[k];
    }
    const last = parts[parts.length-1];
    const isCheckbox = input.type === "checkbox";
    let val = isCheckbox ? input.checked : input.value;
    // special cases
    if(last === "accept"){
      val = val.split(",").map(s=>s.trim()).filter(Boolean);
    }
    ref[last] = val;
  }
  function escapeHtml(str){
    return (str||"").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;"}[s]));
  }

  // --- Reader rendering ---
  function renderReader(){
    // clear
    readerArea.innerHTML = "";
    state.book.pages.forEach((p,idx)=>{
      const el = renderPage(p);
      if(state.modeReader){
        el.toggleAttribute("hidden", idx !== state.readerIndex);
      }
      readerArea.appendChild(el);
    });
    if(state.modeReader){
      readerNav.hidden = false;
      updateReaderNav();
    } else {
      readerNav.hidden = true;
    }
    initQuizzes(readerArea);
    initDragDrop(readerArea);
  }

  function renderPage(page){
    if(page.type==="cover"){
      const s = page.data;
      const el = div(`<section class="book-page">
        <h1 class="book-title">${escapeHtml(s.title)}</h1>
        <p class="book-subtitle">${escapeHtml(s.subtitle||"")}</p>
        <div class="book-content">${escapeHtml(s.intro||"")}</div>
      </section>`);
      return el;
    }
    if(page.type==="content"){
      const s = page.data;
      const el = div(`<section class="book-page">
        <h2 class="book-title">${escapeHtml(s.title)}</h2>
        <div class="book-content">${s.html||""}</div>
      </section>`);
      return el;
    }
    if(page.type==="quiz"){
      const s = page.data;
      const name = "q_"+page.id;
      const opts = s.options.map((o,i)=>`<li><label><input type="checkbox" data-correct="${o.correct||false}" name="${name}_${i}"> ${escapeHtml(o.text)}</label></li>`).join("");
      const el = div(`<section class="book-page">
        <div class="quiz">
          <div class="question">${escapeHtml(s.question)}</div>
          <ul class="options">${opts}</ul>
          <button type="button" data-check>Conferir</button>
          <div class="feedback" aria-live="polite"></div>
        </div>
      </section>`);
      return el;
    }
    if(page.type==="dragdrop"){
      const s = page.data;
      const items = s.items.map(it=>`<div id="i_${it.id}" class="dd-item" data-type="${escapeHtml(it.type)}">${escapeHtml(it.label)}</div>`).join("");
      const buckets = s.buckets.map(b=>`<div class="dd-col dd-drop" data-accept="${escapeHtml(b.accept.join(','))}"><strong>${escapeHtml(b.label)}</strong></div>`).join("");
      const el = div(`<section class="book-page">
        <h3 class="book-title">${escapeHtml(s.title)}</h3>
        <div class="dd-grid">
          <div class="dd-col">${items}</div>
          ${buckets}
        </div>
      </section>`);
      return el;
    }
    if(page.type==="end"){
      const s = page.data;
      const el = div(`<section class="book-page">
        <div class="certificado">
          <div class="medal" style="font-size:56px">🏅</div>
          <h2 class="book-title">Parabéns!</h2>
          <p class="book-content">${escapeHtml(s.message||"")}</p>
        </div>
      </section>`);
      return el;
    }
    return div(`<section class="book-page"><em>Tipo desconhecido</em></section>`);
  }
  function div(html){ const d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }

  // --- Interactions ---
  function bindTopbar(){
    btnReader.addEventListener("click", ()=>{
      state.modeReader = !state.modeReader;
      btnReader.textContent = state.modeReader ? "Sair do Modo Leitor" : "Modo Leitor";
      state.readerIndex = 0;
      render();
    });
    btnExportJson.addEventListener("click", exportJson);
    fileJson.addEventListener("change", importJson);
    btnExportPdf.addEventListener("click", exportPdf);
    btnClear.addEventListener("click", ()=>{
      if(confirm("Limpar livro atual? Isso não pode ser desfeito.")){
        state.book.pages = [];
        state.selectedId = null;
        render();
      }
    });
    prevPageBtn.addEventListener("click", ()=>goTo(state.readerIndex-1));
    nextPageBtn.addEventListener("click", ()=>goTo(state.readerIndex+1));
  }

  function goTo(index){
    index = Math.max(0, Math.min(index, state.book.pages.length-1));
    state.readerIndex = index;
    renderReader();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function updateReaderNav(){
    const total = Math.max(1, state.book.pages.length);
    const pct = Math.round(((state.readerIndex+1)/total)*100);
    progressBar.style.width = pct + "%";
    progressBar.parentElement.setAttribute("aria-valuenow", String(pct));
    prevPageBtn.disabled = state.readerIndex <= 0;
    nextPageBtn.disabled = state.readerIndex >= total-1;
  }

  function exportJson(){
    const blob = new Blob([JSON.stringify(state.book,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "livrinho.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importJson(ev){
    const file = ev.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(!data.pages) throw new Error("Formato inválido");
        state.book = data;
        state.selectedId = data.pages[0]?.id || null;
        render();
      }catch(e){
        alert("Não foi possível importar o JSON.");
      }
    };
    reader.readAsText(file);
    ev.target.value = "";
  }

  function exportPdf(){
    if(typeof html2pdf === "undefined"){
      alert("html2pdf não encontrado.");
      return;
    }
    // Garante modo leitor para exportar todo o livro
    const wasReader = state.modeReader;
    state.modeReader = true;
    state.readerIndex = 0;
    renderReader();
    const element = document.querySelector('.livrinho-container');
    const options = {
      margin:[10,10,10,10],
      filename: 'Meu-Livrinho.pdf',
      image:{type:'jpeg',quality:0.98},
      html2canvas:{scale:2},
      jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
    };
    html2pdf().set(options).from(element).save().then(()=>{
      state.modeReader = wasReader;
      renderReader();
    });
  }

  // --- Quiz logic ---
  function initQuizzes(root=document){
    $$('.quiz', root).forEach(quiz=>{
      const btn = $('[data-check]', quiz);
      const out = $('.feedback', quiz);
      if(!btn || !out) return;
      btn.addEventListener('click', ()=>{
        const correct = $$('input[data-correct="true"]', quiz);
        const selectedCorrect = correct.filter(i => i.checked).length;
        const wrongSelected = $$('input[type="checkbox"]:checked:not([data-correct="true"])', quiz).length;
        const allCorrect = selectedCorrect === correct.length && wrongSelected === 0 && correct.length > 0;
        out.textContent = allCorrect ? "✅ Muito bem!" : "❌ Tente novamente.";
        out.className = "feedback " + (allCorrect ? "ok" : "err");
      });
    });
  }

  // --- Drag & Drop logic ---
  function initDragDrop(root=document){
    $$('.dd-item', root).forEach(el=>{
      el.setAttribute('draggable','true');
      el.addEventListener('dragstart', ev=>{
        ev.dataTransfer.setData('text/type', el.dataset.type || '');
        ev.dataTransfer.setData('text/id', el.id || '');
        setTimeout(()=>el.classList.add('dragging'),0);
      });
      el.addEventListener('dragend', ()=>el.classList.remove('dragging'));
    });
    $$('.dd-drop', root).forEach(drop=>{
      drop.addEventListener('dragover', ev=>ev.preventDefault());
      drop.addEventListener('dragenter', ev=>{
        const type = ev.dataTransfer.getData('text/type');
        const accept = (drop.dataset.accept || '').split(',').map(s=>s.trim());
        drop.classList.toggle('ok', accept.includes(type));
        drop.classList.toggle('bad', !accept.includes(type));
      });
      drop.addEventListener('dragleave', ()=>drop.classList.remove('ok','bad'));
      drop.addEventListener('drop', ev=>{
        ev.preventDefault();
        const type = ev.dataTransfer.getData('text/type');
        const id = ev.dataTransfer.getData('text/id');
        const accept = (drop.dataset.accept || '').split(',').map(s=>s.trim());
        const el = id ? document.getElementById(id) : null;
        if(accept.includes(type) && el){
          drop.appendChild(el);
          drop.classList.remove('ok','bad');
        }else{
          drop.classList.remove('ok','bad');
        }
      });
    });
  }
})();