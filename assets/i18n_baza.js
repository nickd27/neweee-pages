/* assets/i18n.js — RU/EN/UK. Закалённый запуск + переключатель EN→UK→RU */
(function(){
  // Кэш исходного (русского) HTML карточек
  var CARD_ORIG = {}; // ключи: 'energy', 'fsa', 'lab'
  
  // ---------- Утилиты ----------
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function getReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }
  var storage = {
    get: function(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
    set: function(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  };
  function getPage(){
    var b = document.body;
    if (!b) return 'index';
    if (b.classList.contains('index')) return 'index';
    if (b.classList.contains('services')) return 'services';
    if (b.classList.contains('publications')) return 'publications';
    if (b.classList.contains('contacts')) return 'contacts';
    if (b.classList.contains('energy')) return 'energy';
    if (b.classList.contains('fsa-triz')) return 'fsa';
    if (b.classList.contains('lab')) return 'lab';
    return 'index';
  }

  // ---------- Порядок языков: EN → UK → RU ----------
  var LANGS = ['en','uk','ru'];
  function getDefaultLang(){
    var urlL = new URLSearchParams(location.search).get('lang');
    return urlL || storage.get('lang') || 'ru';
  }
  function setLang(l){
    var L = LANGS.indexOf(l) >= 0 ? l : 'ru';
    storage.set('lang', L);
    apply(L);
    highlight(L);
  }

  // ---------- Переключатель ----------
  function mountSwitcher(){
    if (qs('.lang-switch')) return;
    var host = qs('header .nav') || document.body;
    var box = document.createElement('div');
    box.className = 'lang-switch';
    if (host === document.body){
      box.style.position='fixed';
      box.style.top='12px';
      box.style.right='12px';
      box.style.zIndex='99999';
      box.style.display='flex';
      box.style.gap='8px';
      box.style.background='rgba(0,0,0,.35)';
      box.style.backdropFilter='blur(6px)';
      box.style.border='1px solid rgba(255,255,255,.2)';
      box.style.padding='6px';
      box.style.borderRadius='999px';
    } else {
      box.style.marginLeft='auto';
      box.style.display='flex';
      box.style.gap='8px';
      box.style.alignItems='center';
      box.style.float='right';
    }
    for (var i=0;i<LANGS.length;i++){
      var l = LANGS[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-lang', l);
      btn.textContent = l.toUpperCase();
      btn.style.border='1px solid rgba(255,255,255,.35)';
      btn.style.background='transparent';
      btn.style.color='#e5e7eb';
      btn.style.borderRadius='999px';
      btn.style.padding='6px 10px';
      btn.style.cursor='pointer';
      btn.style.fontSize='12px';
      box.appendChild(btn);
    }
    box.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('button[data-lang]');
      if (!b) return;
      setLang(b.getAttribute('data-lang'));
    });
    host.appendChild(box);
    highlight(getDefaultLang());
  }
  function highlight(L){
    qsa('.lang-switch button').forEach(function(b){
      b.style.opacity = (b.getAttribute('data-lang')===L) ? '1' : '.7';
      b.style.fontWeight = (b.getAttribute('data-lang')===L) ? '700' : '400';
    });
  }

  // ---------- СЛОВАРЬ ----------
  var T = {
    title: {
      ru:{index:'NEW ENERGY & ENGINEERING',services:'Направления',publications:'Публикации и статьи',contacts:'Контакты',energy:'Энергетический инжиниринг',fsa:'ФСА / ТРИЗ',lab:'Лабораторные исследования'},
      en:{index:'NEW ENERGY & ENGINEERING',services:'Services',publications:'Publications & Articles',contacts:'Contacts',energy:'Energy Engineering',fsa:'FVA / TRIZ',lab:'Laboratory Research'},
      uk:{index:'NEW ENERGY & ENGINEERING',services:'Напрями',publications:'Публікації та статті',contacts:'Контакти',energy:'Енергетичний інжиніринг',fsa:'ФВА / ТРІЗ',lab:'Лабораторні дослідження'}
    }, 
   flowLabels: {
  ru: ['Диагностика','Концепт','Проект','Испытания','Внедрение'],
  en: ['Diagnostics','Concept','Design','Testing','Implementation'],
  uk: ['Діагностика','Концепт','Проєкт','Випробування','Впровадження']
    },
  flowAria: {
  ru: 'Этапы процесса',
  en: 'Process stages',
  uk: 'Етапи процесу'
  },
    headerIndex: {
      ru:{services:'Компетенции',publications:'Публикации',contacts:'Контакты'},
      en:{services:'Services',publications:'Publications',contacts:'Contacts'},
      uk:{services:'Компетенції',publications:'Публікації',contacts:'Контакти'}
    },
    headerBackHome:{
      ru:{back:'← Назад',home:'← На главную',energy:'Энергетический инжиниринг',fsa:'ФСА / ТРИЗ',lab:'Лабораторные исследования',publications:'Публикации и статьи',services:'Направления',contacts:'Контакты'},
      en:{back:'← Back',home:'← Home',energy:'Energy Engineering',fsa:'FVA / TRIZ',lab:'Laboratory Research',publications:'Publications & Articles',services:'Services',contacts:'Contacts'},
      uk:{back:'← Назад',home:'← На головну',energy:'Енергетичний інжиніринг',fsa:'ФВА / ТРІЗ',lab:'Лабораторні дослідження',publications:'Публікації та статті',services:'Напрями',contacts:'Контакти'}
    },

    // --- Главная (index) ---
    index:{
      ru:{heroTitle:'NEW ENERGY & ENGINEERING',heroLead:'Инжиниринговые услуги в энергетике - от разработки ТЭО проекта до ввода энергоблока в эксплуатацию. Промышленный инжиниринг - от выполнения ФСА/ТРИЗ и проектирования до лабораторной отработки и внедрения решений.',ctaServices:'Смотреть направления →',quickEnergyH:'Энергетический инжиниринг',quickEnergyP:'Разработка проекта энергоблока, выбор оборудования, энергоэффективность и долговечность',quickFsaH:'ФСА / ТРИЗ',quickFsaP:'Анализ и решение сложных производственных задач, снижение себестоимости и устранение противоречий.',quickLabH:'Лабораторные исследования',quickLabP:'Изучение взаимодействия полей, разработка лабораторных образцов, стендовые испытания.',pub1H:'Практика применения ФСА на примере вентиляторной градирни',pub1P:'Этапы ФСА, зона излишних затрат, эффективные решения, новые направления развития.',pub2H:'Испарительные градирни в энергетике: проблемы и решения',pub2P:'Гидравлика, теплообмен, материалы, модернизация и новые решения.',ctaPanelH:'Обсудим ваш проект?',ctaPanelP:'Рассмотрим задачу и предложим варианты решения.',ctaPanelBtn:'Перейти в «Контакты» →'},
      en:{heroTitle:'NEW ENERGY & ENGINEERING',heroLead:'Engineering services in power: from project feasibility to unit commissioning. Industrial engineering: from FVA/TRIZ and design to lab validation and implementation.',ctaServices:'View services →',quickEnergyH:'Energy Engineering',quickEnergyP:'Power unit design, equipment selection, energy efficiency and durability',quickFsaH:'FVA / TRIZ',quickFsaP:'Solving complex production tasks, reducing cost and eliminating contradictions.',quickLabH:'Laboratory Research',quickLabP:'Study of field interactions, lab prototypes, bench testing.',pub1H:'Applying FVA to a Forced-Draft Cooling Tower',pub1P:'FVA stages, hotspots of excessive costs, effective solutions, new development directions.',pub2H:'Evaporative Cooling Towers in Power: Issues & Solutions',pub2P:'Hydraulics, heat transfer, materials, retrofit and new solutions.',ctaPanelH:'Shall we discuss your project?',ctaPanelP:'We will review your task and propose solution options.',ctaPanelBtn:'Go to “Contacts” →'},
      uk:{heroTitle:'NEW ENERGY & ENGINEERING',heroLead:'Інжинірингові послуги в енергетиці — від ТЕО проєкту до введення енергоблоку в експлуатацію. Промисловий інжиніринг — від ФВА/ТРІЗ і проєктування до лабораторної верифікації та впровадження.',ctaServices:'Переглянути напрями →',quickEnergyH:'Енергетичний інжиніринг',quickEnergyP:'Проєкт енергоблоку, вибір обладнання, енергоефективність і довговічність',quickFsaH:'ФВА / ТРІЗ',quickFsaP:'Розв’язання складних виробничих задач, зниження собівартості та усунення протиріч.',quickLabH:'Лабораторні дослідження',quickLabP:'Вивчення взаємодії полів, лабораторні зразки, стендові випробування.',pub1H:'Практика ФВА на прикладі вентиляторної градирні',pub1P:'Етапи ФВА, зони надлишкових витрат, ефективні рішення, напрями розвитку.',pub2H:'Випарні градирні в енергетиці: проблеми і рішення',pub2P:'Гідравліка, теплообмін, матеріали, модернізація та нові рішення.',ctaPanelH:'Обговоримо ваш проєкт?',ctaPanelP:'Розглянемо задачу і запропонуємо варіанти рішення.',ctaPanelBtn:'Перейти до «Контактів» →'}
    },

    // --- Services ---
    services:{
      ru:{h1:'Наши компетенции и направления',p:'Мы — команда инженеров и исследователей, специализирующаяся на инженерном консалтинге в энергетических проектах (ТЭС), решении сложных производственно-промышленных задач методами ФСА и ТРИЗ, а также лабораторных исследованиях различных полей и испытаниях прототипов.',i1h:'Энергетический инжиниринг',i1p:'Технические решения для энергетических объектов: градирни, тепловые схемы, ТЭО, повышение энергоэффективности.',i2h:'ФСА / ТРИЗ',i2p:'Функционально-стоимостной анализ и методология ТРИЗ: снижение себестоимости, устранение противоречий, портфель практичных решений.',i3h:'Лабораторные исследования',i3p:'Экспериментальная отработка идей и прототипов: стендовые испытания, измерения, документирование результатов.',more:'Подробнее →'},
      en:{h1:'Our competencies & services',p:'We are a team of engineers and researchers focused on consulting for power projects (thermal plants), solving complex industrial challenges with FVA/TRIZ, and running laboratory studies and prototype tests.',i1h:'Energy Engineering',i1p:'Solutions for power facilities: cooling towers, thermal schemes, feasibility, higher efficiency.',i2h:'FVA / TRIZ',i2p:'Function–value analysis & TRIZ: cost reduction, contradiction removal, practical portfolio.',i3h:'Laboratory Research',i3p:'Experimental validation of ideas and prototypes: bench tests, measurements, documentation.',more:'Learn more →'},
      uk:{h1:'Наші компетенції та напрями',p:'Ми — команда інженерів і дослідників, що спеціалізується на консалтингу для енергетичних проєктів (ТЕС), розв’язанні складних виробничих задач методами ФВА/ТРІЗ і лабораторних дослідженнях та випробуваннях прототипів.',i1h:'Енергетичний інжиніринг',i1p:'Рішення для енергетичних об’єктів: градирні, теплові схеми, ТЕО, підвищення ефективності.',i2h:'ФВА / ТРІЗ',i2p:'Функціонально-вартісний аналіз і ТРІЗ: зниження собівартості, усунення протиріч, практичний портфель.',i3h:'Лабораторні дослідження',i3p:'Експериментальна відпрацювання ідей і прототипів: стендові випробування, вимірювання, документація.',more:'Детальніше →'}
    },

    // --- Publications ---
    publications:{
      ru:{h1:'Публикации и статьи',lead:'Здесь собраны наши материалы: технические публикации (PDF) и авторские статьи.',a1h:'«Практика применения ФСА на примере конструкции вентиляторной градирни»',a1p:'Кейс-описание этапов ФСА на конкретном объекте: декомпозиция функций, выявление зон затрат, анализ технических противоречий и портфель решений для снижения стоимости без потери эффективности.',a2h:'«Испарительные градирни в энергетике. Актуальные проблемы и возможные решения»',a2p:'Обзор проблем эксплуатации и подходов к их решению: гидравлика, теплообмен, материалы, модернизация и влияние на CAPEX/OPEX.',read:'Читать статью (PDF)',download:'Скачать PDF'},
      en:{h1:'Publications & Articles',lead:'Our materials: technical publications (PDF) and in-house articles.',a1h:'“FVA Practice on a Forced-Draft Cooling Tower”',a1p:'Case study of FVA: function breakdown, cost hotspots, technical contradictions, and solutions to cut cost without losing performance.',a2h:'“Evaporative Cooling Towers in Power. Issues and Possible Solutions”',a2p:'Operating issues and approaches: hydraulics, heat transfer, materials, retrofit and CAPEX/OPEX impact.',read:'Read article (PDF)',download:'Download PDF'},
      uk:{h1:'Публікації та статті',lead:'Тут зібрані наші матеріали: технічні публікації (PDF) та авторські статті.',a1h:'«Практика ФВА на прикладі конструкції вентиляторної градирні»',a1p:'Кейс: декомпозиція функцій, зони витрат, технічні протиріччя і портфель рішень для зниження вартості без втрати ефективності.',a2h:'«Випарні градирні в енергетиці. Актуальні проблеми і рішення»',a2p:'Проблеми експлуатації і підходи до їх вирішення: гідравліка, теплообмін, матеріали, модернізація та вплив на CAPEX/OPEX.',read:'Читати статтю (PDF)',download:'Завантажити PDF'}
    },

    // --- Contacts ---
    contacts:{
      ru:{header:'Связаться с нами',lead:'Опишите задачу — мы предложим варианты решения и вернёмся с уточняющими вопросами.',name:'Ваше имя *',email:'Email *',phone:'Телефон / WhatsApp',company:'Компания',service:'Направление *',deadline:'Срок / дедлайн',message:'Краткое описание задачи *',submit:'Отправить',pubs:'Публикации',note:'Отправляя форму, вы соглашаетесь на обработку переданных данных для обратной связи.',addrTitle:'Адрес компании',phoneTitle:'Телефон (WhatsApp, Viber)',hp:'Оставьте пустым',fallbackNote:'Если почтовый клиент не открылся, скопируйте текст ниже и отправьте вручную.',copy:'Скопировать',copied:'Скопировано ✓',selectPlaceholder:'Выберите…',sEnergy:'Энергетический инжиниринг',sFSA:'ФСА / ТРИЗ',sLab:'Лабораторные исследования',placeholders:{name:'Иван Петров',email:'you@company.com',phone:'+420 607 828 092',company:'ООО «Компания»',deadline:'Напр., до 30.09 или 4–6 недель',message:'1–2 абзаца: текущая ситуация, ограничения, желаемый результат'}},
      en:{header:'Get in touch',lead:'Describe your task — we’ll propose options and follow up.',name:'Your name *',email:'Email *',phone:'Phone / WhatsApp',company:'Company',service:'Service *',deadline:'Deadline',message:'Brief description *',submit:'Send',pubs:'Publications',note:'By submitting, you agree to the processing of your data for feedback purposes.',addrTitle:'Company address',phoneTitle:'Phone (WhatsApp, Viber)',hp:'Leave empty',fallbackNote:'If your mail client did not open, copy the text below and send manually.',copy:'Copy',copied:'Copied ✓',selectPlaceholder:'Select…',sEnergy:'Energy Engineering',sFSA:'FVA / TRIZ',sLab:'Laboratory Research',placeholders:{name:'John Smith',email:'you@company.com',phone:'+420 607 828 092',company:'LLC “Company”',deadline:'e.g., by Sep 30 or 4–6 weeks',message:'1–2 paragraphs: current state, constraints, desired result'}},
      uk:{header:'Зв’язатися з нами',lead:'Опишіть задачу — запропонуємо варіанти рішення і поставимо уточнювальні питання.',name:'Ваше ім’я *',email:'Email *',phone:'Телефон / WhatsApp',company:'Компанія',service:'Напрям *',deadline:'Строк / дедлайн',message:'Короткий опис задачі *',submit:'Надіслати',pubs:'Публікації',note:'Надсилаючи форму, ви погоджуєтесь на обробку даних для зворотного зв’язку.',addrTitle:'Адреса компанії',phoneTitle:'Телефон (WhatsApp, Viber)',hp:'Залиште порожнім',fallbackNote:'Якщо поштовий клієнт не відкрився, скопіюйте текст нижче і надішліть вручну.',copy:'Скопіювати',copied:'Скопійовано ✓',selectPlaceholder:'Оберіть…',sEnergy:'Енергетичний інжиніринг',sFSA:'ФВА / ТРІЗ',sLab:'Лабораторні дослідження',placeholders:{name:'Іван Петренко',email:'you@company.com',phone:'+420 607 828 092',company:'ТОВ «Компанія»',deadline:'напр., до 30.09 або 4–6 тижнів',message:'1–2 абзаци: поточний стан, обмеження, бажаний результат'}}
    },

    // --- Длинные страницы: подмена содержимого .card для EN/UK ---
    energy:{
      en: `
        <h1>Energy projects (thermal power plants)</h1>
        <p class="notice">We provide comprehensive engineering services and support across all life-cycle stages of power projects. Below is the scope of our team’s functions and services.</p>

        <h2>1. Pre-design activities</h2>
        <h3>1.1. Pre-design review</h3>
        <ul>
          <li><strong>Site study and technical audit:</strong> infrastructure, utilities and limitations.</li>
          <li><strong>Construction risks assessment:</strong> underground utilities, relocation of networks, heritage restrictions, etc.</li>
        </ul>

        <h3>1.2. Pre-feasibility/Feasibility (TEO)</h3>
        <ul>
          <li><strong>Technical feasibility:</strong> fuel & water, grid connections; technology selection (CCPP, GTU, STU, CHP); environmental compliance.</li>
          <li><strong>Economic viability:</strong> CAPEX/OPEX, LCOE, tariff/load scenarios, sensitivity analysis.</li>
          <li><strong>Market and site:</strong> power/energy balance, infrastructure, logistics, site risks.</li>
          <li><strong>Risk assessment:</strong> technical, regulatory, construction, environmental and market; mitigation.</li>
          <li><strong>Conclusions and recommendations:</strong> optimal technology, equipment choice, vendors/contractors, preliminary schedule.</li>
        </ul>

        <h3>1.3. Design ToR</h3>
        <ul>
          <li><strong>Engineering surveys:</strong> geology, geodesy, environment.</li>
          <li><strong>Initial data:</strong> phases, capacity, guarantees; main/aux equipment; HV/MV/LV; backup power; I&C; field instruments; cooling water; air/fuel/feed-water prep; boiler; emission control.</li>
          <li><strong>Architectural/civil:</strong> master plan, layout, materials, roofs/facades; comms & CCTV; waste; industrial/storm water; environmental limits.</li>
          <li><strong>Power evacuation scheme:</strong> development/approvals with grid company.</li>
          <li><strong>Utility connection terms:</strong> heat, water/sewer, power, gas, telecom.</li>
          <li><strong>Standards & codes:</strong> project documentation requirements.</li>
          <li><strong>ToR approval:</strong> with the Client.</li>
        </ul>

        <h3>1.4. Permitting and initial docs</h3>
        <ul>
          <li>Land rights (ownership/lease); cadastre.</li>
          <li>Topographic plan.</li>
          <li>Architectural/functional concept; site layout.</li>
          <li>Survey of site, structures, utilities (if needed).</li>
          <li>Demolition plan (if needed).</li>
          <li>Other approvals/documents.</li>
        </ul>

        <h2>2. Design</h2>
        <h3>2.1. Preparatory phase</h3>
        <ul>
          <li>Participation in Lead Designer selection.</li>
          <li>Final ToR approval.</li>
          <li>Design schedule.</li>
          <li>Preparation for contracting; handover of initial data.</li>
        </ul>

        <h3>2.2. Control of Project documentation</h3>
        <ul>
          <li>Technical support and schedule control.</li>
          <li>Compliance check vs ToR/codes; efficiency review.</li>
          <li>Verification of estimated construction cost.</li>
          <li>Issue management and closure.</li>
        </ul>

        <h3>2.3. Approvals</h3>
        <ul>
          <li>Regional/municipal approvals.</li>
          <li>Grid/state agencies approvals (power, fire, etc.).</li>
          <li>Registration in construction info system (where applicable).</li>
        </ul>

        <h3>2.4. Expert review</h3>
        <ul>
          <li>Preparation and submission.</li>
          <li>Closure of completeness comments.</li>
          <li>Arranging contract/payment.</li>
          <li>Handling consolidated comments; responses by Chief Engineer/Lead Designer.</li>
          <li>Quality/closure timing control.</li>
        </ul>

        <h3>2.5. Detail design</h3>
        <ul>
          <li>Coordination and selection of optimal solutions.</li>
          <li>Weekly/monthly schedule control; meetings.</li>
          <li>Coordination with detail designer; working meetings.</li>
          <li>Handover of “For construction” drawings and revisions.</li>
        </ul>

        <h2>3. Construction & Commissioning</h2>
        <h3>3.1. Preparatory phase</h3>
        <ul>
          <li>Construction permit.</li>
          <li>Procurement tender packages.</li>
          <li>Contracts for temporary utilities.</li>
          <li>Site handover; survey control grid.</li>
          <li>Contractor mobilization control; site setup.</li>
          <li>Method statements: review/approval.</li>
          <li>Work permits/notifications; start notice.</li>
          <li>Handover of “For construction” drawings.</li>
        </ul>

        <h3>3.2. Main construction</h3>
        <ul>
          <li>Work/delivery schedules; progress control.</li>
          <li>Interaction/acceptance rules.</li>
          <li>Change management.</li>
          <li>Construction supervision; operational management.</li>
          <li>Authority interface.</li>
          <li>Reporting.</li>
          <li>As-built docs; closure of remarks.</li>
        </ul>

        <h3>3.3. Testing & start-up</h3>
        <ul>
          <li>Cold/hot tests.</li>
          <li>Performance (guarantee) tests.</li>
          <li>Acceptance committee (if required).</li>
          <li>Certificate and Commissioning Permit.</li>
          <li>Handover to Client.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Request a consultation</a></p>
      `,
      uk: `
        <h1>Енергетичні проєкти (ТЕС)</h1>
        <p class="notice">Виконуємо комплексні інжинірингові послуги та супровід на всіх етапах життєвого циклу енергетичних проєктів. Нижче — перелік функцій і послуг нашої команди.</p>

        <h2>1. Передпроєктні роботи</h2>

        <h3>1.1. Передпроєктний аналіз</h3>
        <ul>
          <li><strong>Дослідження майданчика і технічний аудит:</strong> інфраструктура, мережі, обмеження.</li>
          <li><strong>Оцінка ризиків будівництва:</strong> підземні комунікації, винесення мереж, об’єкти культурної/історичної спадщини тощо.</li>
        </ul>

        <h3>1.2. ПередТЕО/ТЕО</h3>
        <ul>
          <li><strong>Технічна здійсненність:</strong> паливо і вода, підключення до мереж; вибір технології (ПГУ, ГТУ, ПТУ, ТЕЦ); відповідність екологічним вимогам.</li>
          <li><strong>Економічна доцільність:</strong> CAPEX/OPEX, LCOE, сценарії тарифів і завантаження, аналіз чутливості.</li>
          <li><strong>Ринок і майданчик:</strong> баланс потужності/енергії, інфраструктура, логістика і ризики майданчика.</li>
          <li><strong>Оцінка ризиків:</strong> технічні, регуляторні, будівельні, екологічні та ринкові; план мінімізації.</li>
          <li><strong>Висновки і рекомендації:</strong> оптимальна технологія, вибір обладнання, підрядники/постачальники, попередній графік.</li>
        </ul>

        <h3>1.3. Технічне завдання (ТЗ) на проєктування</h3>
        <ul>
          <li><strong>Інженерні вишукування:</strong> геологія, геодезія, екологія.</li>
          <li><strong>Збір вихідних даних:</strong> етапність, продуктивність, гарантійні показники; склад основного/допоміжного процесного та електротехнічного обладнання (ВН/СН/НН); резервне живлення; АСУ ТП; польові прилади; системи оборотного водопостачання; підготовка повітря/палива/живильної води; котельне господарство; контроль викидів.</li>
          <li><strong>Архітектурно-будівельні вимоги:</strong> генплан, компоновка будівель і споруд, матеріали, дахи/фасади; зв’язок і відеонагляд; поводження з відходами; виробничі/ливневі стоки; екологічні обмеження і вплив.</li>
          <li><strong>Схема видачі потужності:</strong> розробка та погодження з мережевою компанією і органами.</li>
          <li><strong>Техумови підключень:</strong> тепло-, водопостачання/водовідведення, електропостачання, газ, зв’язок.</li>
          <li><strong>Норми і стандарти:</strong> перелік норм і вимог до проєктної документації.</li>
          <li><strong>Погодження ТЗ:</strong> узгодження з Замовником.</li>
        </ul>

        <h3>1.4. Вихідно-дозвільна документація</h3>
        <ul>
          <li>Правовстановлюючі документи: власність/оренда, кадастрові дані, витяги.</li>
          <li>Інженерно-топографічний план (геопідоснова).</li>
          <li>Архітектурно-функціональна концепція енергоблоку і планування майданчика.</li>
          <li>Обстеження майданчика, споруд, підземних/надземних мереж (за потреби).</li>
          <li>План демонтажних робіт (за потреби).</li>
          <li>Отримання інших необхідних погоджень/документів.</li>
        </ul>

        <h2>2. Проєктування</h2>

        <h3>2.1. Підготовчий етап</h3>
        <ul>
          <li>Участь у виборі Генпроектувальника.</li>
          <li>Фінальне затвердження ТЗ.</li>
          <li>Графік проєктування.</li>
          <li>Підготовка до договорів на Базовий/Проєктний/Робочий дизайн; передача вихідних даних проектувальнику.</li>
        </ul>

        <h3>2.2. Контроль розробки Проєктної документації</h3>
        <ul>
          <li>Технічний супровід і контроль графіка.</li>
          <li>Перевірка відповідності ТЗ і нормам; аналіз ефективності рішень.</li>
          <li>Перевірка кошторисної вартості СМР.</li>
          <li>Виявлення та закриття дефектів документації.</li>
        </ul>

        <h3>2.3. Погодження Проєктної документації</h3>
        <ul>
          <li>Погодження в регіональних/муніципальних органах.</li>
          <li>Погодження в мережевих і держустановах (енергопостачання, пожежна безпека тощо).</li>
          <li>За потреби — реєстрація в інформаційній системі будівельних об’єктів.</li>
        </ul>

        <h3>2.4. Експертиза</h3>
        <ul>
          <li>Підготовка пакета і подача на експертизу.</li>
          <li>Оперативне закриття зауважень щодо комплектності.</li>
          <li>Організація договору/оплати за експертизу.</li>
          <li>Робота зі зведеними зауваженнями; відповіді ГІП/Генпроектувальника.</li>
          <li>Контроль якості і строків закриття.</li>
        </ul>

        <h3>2.5. Робоча документація</h3>
        <ul>
          <li>Координація технічних рішень і вибір оптимальних.</li>
          <li>Періодичний контроль строків (тиждень/місяць); участь у нарадах.</li>
          <li>Координація розробника РД; робочі наради.</li>
          <li>Передача РД «В виробництво» і керування змінами.</li>
        </ul>

        <h2>3. Будівництво і введення</h2>

        <h3>3.1. Підготовчий етап</h3>
        <ul>
          <li>Дозвіл на будівництво.</li>
          <li>Тендерні пакети на закупівлю обладнання.</li>
          <li>Договори на тимчасове ресурсопостачання.</li>
          <li>Передача майданчика генпідряднику; геодезична розбивочна основа.</li>
          <li>Контроль мобілізації потужностей і організації майданчика.</li>
          <li>ППР: перевірка і погодження.</li>
          <li>Дозволи/повідомлення на виконання робіт; повідомлення про початок будівництва.</li>
          <li>Передача генпідряднику РД «в виробництво».</li>
        </ul>

        <h3>3.2. Основний період будівництва</h3>
        <ul>
          <li>Графіки робіт, постачань матеріалів і обладнання; контроль виконання.</li>
          <li>Регламенти взаємодії та приймання робіт між учасниками.</li>
          <li>Керування змінами в документації.</li>
          <li>Будівельний нагляд; оперативне управління (наради, огляди, координація субпідрядників, фінпланування).</li>
          <li>Взаємодія з наглядовими органами.</li>
          <li>Звітність: фото/відео, накопичувальні відомості тощо.</li>
          <li>Виконавча документація; усунення зауважень нагляду.</li>
        </ul>

        <h3>3.3. Випробування і введення</h3>
        <ul>
          <li>Холодні/гарячі випробування обладнання енергоблоку.</li>
          <li>Гарантійні випробування.</li>
          <li>Приймальна комісія (за потреби).</li>
          <li>Отримання висновку про виконання гарантійних показників і Дозволу на введення.</li>
          <li>Передача завершеного енергоблоку Замовнику.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Обговорити консультацію</a></p>
      `
    },

    // === FSA / TRIZ: полноценный контент EN и UK ===
    fsa: {
      en: `
        <h1>Function–Value Analysis (FVA) & TRIZ</h1>
        <p>Our team has been connected with FVA and TRIZ since the 1980s: we studied and applied them to real-world tasks; some work evolved into invention disclosures and patents. Today we combine these competencies and help when “unsolvable” problems block the business: non-competitive products, high production cost, complex yet necessary technologies, etc.</p>
        <p>We run the classical FVA stages and apply TRIZ tools to obtain unexpected yet practical solutions ready for rollout.</p>

        <h2>How we work (FVA → TRIZ)</h2>
        <ul>
          <li><strong>Information stage:</strong> primary data, block diagram of product/process, structural model and boundaries.</li>
          <li><strong>Analytical stage:</strong> supersystem model; transformation-flow model; model of energy and environmental/material flows; other models, description of the system based on models.</li>
          <li><strong>From PKD → PKP:</strong> from “Problem as given” to “Problem as understood”; identifying technical and physical contradictions; locating contradiction zones.</li>
          <li><strong>Functional model:</strong> critical and harmful functions; hot spots of excessive cost.</li>
          <li><strong>Creative stage (TRIZ):</strong> resolving contradictions with standard solutions; applying effects; ARIZ for complex tasks.</li>
          <li><strong>Portfolio & prioritization:</strong> improvement options rated by effect / cost / time; roadmap for implementation.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Discuss a task</a></p>
      `,
      uk: `
        <h1>Функціонально-вартісний аналіз (ФВА) і ТРІЗ</h1>
        <p>Наша команда пов’язана з методикою ФВА і ТРІЗ з 1980-х: ми вивчали й застосовували їх у реальних задачах; частина робіт переростала у заявки на винаходи та патенти. Нині поєднуємо ці компетенції й допомагаємо там, де задачі, яких не можуть вирішити, гальмують бізнес: неконкурентоспроможність продукції, висока собівартість, складні, але необхідні технології тощо.</p>
        <p>Проводимо класичні етапи ФВА і застосовуємо інструменти ТРІЗ, щоб отримувати неочікувані, але практичні рішення, готові до впровадження.</p>

        <h2>Як ми працюємо (ФВА → ТРІЗ)</h2>
        <ul>
          <li><strong>Інформаційний етап:</strong> первинні дані, блок-схема виробу/процесу, структурна модель і межі.</li>
          <li><strong>Аналітичний етап:</strong> модель надсистеми; модель потоків перетворень; модель енергетичних та середовищних/речовинних потоків; інші моделі, опис системи за моделями.</li>
          <li><strong>ПКД → ПКП:</strong> від «Проблеми як дано» до «Проблеми як зрозуміло»; ідентифікація технічних і фізичних протиріч; фіксація зон протиріч.</li>
          <li><strong>Функціональна модель:</strong> критичні та «шкідливі» функції; зони надлишкових витрат.</li>
          <li><strong>Творчий етап (ТРІЗ):</strong> усунення протиріч стандартними рішеннями; використання ефектів; АРІЗ для складних задач.</li>
          <li><strong>Портфель і пріоритети:</strong> варіанти поліпшень за ефектом / витратами / термінами; дорожня карта впровадження.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Обговорити задачу</a></p>
      `
    },

    // === Laboratory: полноценный контент EN и UK ===
    lab: {
      en: `
        <h1>Laboratory Research</h1>
        <p>Areas of interest — searching for and developing new ways of generating electrical energy. We study possibilities of energy harvesting using electric, magnetic, gravitational fields, as well as concepts based on water motion.</p>

        <h2>What we do</h2>
        <ul>
          <li>Study of electric, magnetic, gravitational and other fields; their interactions and patterns; practical validation of observed effects.</li>
          <li>Design, fabrication and testing of lab-scale energy-generation devices.</li>
          <li>Efficiency and stability testing under controlled conditions.</li>
          <li>Prototyping, IP and patent work.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Contact us</a></p>
      `,
      uk: `
        <h1>Лабораторні дослідження</h1>
        <p>Сфери інтересу — пошук і розробка нових способів генерації електроенергії. Досліджуємо можливості отримання енергії за допомогою електричних, магнітних, гравітаційних полів, а також рішень на основі руху води.</p>

        <h2>Що робимо</h2>
        <ul>
          <li>Вивчення електричних, магнітних, гравітаційних та інших полів; їх взаємодій і закономірностей; практичне підтвердження спостережуваних ефектів.</li>
          <li>Проєктування, виготовлення та випробування лабораторних зразків пристроїв генерації енергії.</li>
          <li>Тестування ефективності та стабільності в контрольованих умовах.</li>
          <li>Прототипування, патентування та робота з ІВ.</li>
        </ul>

        <p><a class="badge" href="contacts.html">Зв’язатися з нами</a></p>
      `
    }
  };

  // ---------- Применение ----------
  function setDocMeta(lang){
    document.documentElement.setAttribute('lang', lang);
    var p = getPage();
    var title = (T.title[lang] && T.title[lang][p]) || document.title;
    document.title = title;
  }
  function applyHeader(lang){
    var p = getPage();
    if (p === 'index'){
      var H = T.headerIndex[lang] || T.headerIndex.ru;
      var aS = qs('header .nav a[href="services.html"]');
      var aP = qs('header .nav a[href="publications.html"]');
      var aC = qs('header .nav a[href="contacts.html"]');
      if (aS) aS.textContent = H.services;
      if (aP) aP.textContent = H.publications;
      if (aC) aC.textContent = H.contacts;
    } else {
      var HB = T.headerBackHome[lang] || T.headerBackHome.ru;
      var aBH = qs('header .nav a.badge');
      var spanRight = qs('header .nav span');
      if (aBH){
        var href = aBH.getAttribute('href')||'';
        if (href.indexOf('services.html')>=0) aBH.textContent = HB.back;
        if (href.indexOf('index.html')>=0)    aBH.textContent = HB.home;
      }
      var map = {energy:HB.energy,fsa:HB.fsa,lab:HB.lab,publications:HB.publications,services:HB.services,contacts:HB.contacts};
      var key = getPage();
      if (spanRight && map[key]) spanRight.textContent = map[key];
    }
  }
  function applyIndex(lang){
    var t = T.index[lang] || T.index.ru;
    var h1 = qs('body.index .hero h1'); if (h1) h1.textContent = t.heroTitle;
    var lead = qs('body.index .hero p.lead'); if (lead) lead.textContent = t.heroLead;
    var cta = qs('body.index .cta a.btn[href="services.html"]'); if (cta) cta.textContent = t.ctaServices;

    var qE = qs('body.index .quick a[href="energy.html"]');
    var qF = qs('body.index .quick a[href="fsa-triz.html"]');
    var qL = qs('body.index .quick a[href="lab.html"]');
    if (qE){ var eH=qs('h3',qE), eP=qs('p',qE); if(eH) eH.textContent=t.quickEnergyH; if(eP) eP.textContent=t.quickEnergyP; }
    if (qF){ var fH=qs('h3',qF), fP=qs('p',qF); if(fH) fH.textContent=t.quickFsaH; if(fP) fP.textContent=t.quickFsaP; }
    if (qL){ var lH=qs('h3',qL), lP=qs('p',qL); if(lH) lH.textContent=t.quickLabH; if(lP) lP.textContent=t.quickLabP; }

    var p1 = qs('body.index .pub .item:nth-child(1)');
    var p2 = qs('body.index .pub .item:nth-child(2)');
    if (p1){ var h=qs('h4',p1), p=qs('p',p1), b=qs('.btn',p1); if(h) h.textContent=t.pub1H; if(p) p.textContent=t.pub1P; if(b) b.textContent = (lang==='ru'?'Читать PDF':(lang==='en'?'Read PDF':'Читати PDF')); }
    if (p2){ var h2=qs('h4',p2), p2p=qs('p',p2), b2=qs('.btn',p2); if(h2) h2.textContent=t.pub2H; if(p2p) p2p.textContent=t.pub2P; if(b2) b2.textContent = (lang==='ru'?'Читать PDF':(lang==='en'?'Read PDF':'Читати PDF')); }

    var ctH = qs('body.index .cta-panel h3'); if (ctH) ctH.textContent = t.ctaPanelH;
    var ctP = qs('body.index .cta-panel p');  if (ctP) ctP.textContent = t.ctaPanelP;
    var ctB = qs('body.index .cta-panel .btn'); if (ctB) ctB.textContent = t.ctaPanelBtn;
   
   // Процесс (горизонтальный/вертикальный граф)
   const L = (T.flowLabels[lang] || T.flowLabels.ru);
   document.querySelectorAll('body.index .flow .lbl').forEach((node, i) => {
   node.textContent = L[i % 5];
   });
   const fig = document.querySelector('body.index .flow');
   if (fig) fig.setAttribute('aria-label', (T.flowAria[lang] || T.flowAria.ru) + ': ' + L.join(' → '));
   }

  function applyServices(lang){
    var t = T.services[lang] || T.services.ru;
    var H1 = qs('body.services h1'); if (H1) H1.textContent = t.h1;
    var P  = qs('body.services .card p.muted'); if (P) P.textContent = t.p;
    function fill(n,h,p){
      var it = qs('body.services .grid .item:nth-child('+n+')'); if(!it) return;
      var hh = qs('h3 a',it), pp = qs('p.muted',it), bb=qs('.btn',it);
      if (hh) hh.textContent = t[h];
      if (pp) pp.textContent = t[p];
      if (bb) bb.textContent = t.more;
    }
    fill(1,'i1h','i1p'); fill(2,'i2h','i2p'); fill(3,'i3h','i3p');
  }
  function applyPublications(lang){
    var t = T.publications[lang] || T.publications.ru;
    var H1 = qs('body.publications h1'); if (H1) H1.textContent = t.h1;
    var lead = qs('body.publications .card p.muted'); if (lead) lead.textContent = t.lead;
    function fill(n,hp,pp){
      var it = qs('body.publications .grid .item:nth-child('+n+')'); if(!it) return;
      var hh = qs('h3',it), ppN = qs('p.muted',it); if(hh) hh.textContent = t[hp]; if(ppN) ppN.textContent = t[pp];
      var btns = qsa('.btn', it); if (btns[0]) btns[0].textContent = t.read; if (btns[1]) btns[1].textContent = t.download;
    }
    fill(1,'a1h','a1p'); fill(2,'a2h','a2p');
  }
  function applyContacts(lang){
    var t = T.contacts[lang] || T.contacts.ru;
    var H1 = qs('body.contacts h1'); if (H1) H1.textContent = t.header;
    var lead = qs('body.contacts .card p.muted'); if (lead) lead.textContent = t.lead;
    function L(id, txt){ var el = qs('label[for="'+id+'"]'); if (el) el.textContent = txt; }
    L('name',t.name); L('email',t.email); L('phone',t.phone); L('company',t.company); L('service',t.service); L('deadline',t.deadline); L('message',t.message);
    var sel = qs('#service'); if (sel){
      var opts = qsa('option', sel);
      if (opts[0]) opts[0].textContent = t.selectPlaceholder;
      if (opts[1]) opts[1].textContent = t.sEnergy;
      if (opts[2]) opts[2].textContent = t.sFSA;
      if (opts[3]) opts[3].textContent = t.sLab;
   
      var h3s = qsa('body.contacts .contact-strip h3');
      if (h3s[0]) h3s[0].textContent = t.addrTitle;
      if (h3s[1]) h3s[1].textContent = t.phoneTitle;

     var form = qs('#briefForm');
     if (form && /^mailto:/i.test(form.getAttribute('action')||'')) {
     var subjMap = {
     ru: 'NE&E: бриф с сайта',
     en: 'NE&E: website brief',
     uk: 'NE&E: бриф з сайту'
  };
 
  var subj = encodeURIComponent(subjMap[lang] || 'NE&E Brief');
  form.setAttribute('action', 'mailto:office@neweee.com?subject=' + subj);
}

    }
    function PH(id,val){ var el=qs('#'+id); if(el) el.setAttribute('placeholder', val); }
    PH('name',t.placeholders.name); PH('email',t.placeholders.email); PH('phone',t.placeholders.phone); PH('company',t.placeholders.company); PH('deadline',t.placeholders.deadline); PH('message',t.placeholders.message);
    var hp = qs('#website'); if(hp) hp.setAttribute('placeholder', t.hp);
    var sub = qs('#briefForm .actions .btn[type="submit"]'); if (sub) sub.textContent = t.submit;
    var pubs = qs('#briefForm .actions a.btn[href="publications.html"]'); if (pubs) pubs.textContent = t.pubs;
    var smalls = qsa('body.contacts .small'); if (smalls[0]) smalls[0].textContent = t.note;
    var fb = qs('#fallback .small'); if (fb) fb.textContent = t.fallbackNote;
    var copyBtn = qs('#copyBtn'); if (copyBtn) copyBtn.textContent = t.copy;
    var addrH = qs('body.contacts .contact-strip h3:first-child'); if (addrH) addrH.textContent = t.addrTitle;
    var telH  = qs('body.contacts .contact-strip h3:nth-child(2)'); if (telH) telH.textContent  = t.phoneTitle;
  }
  function replaceCardHTML(lang, key){
  var card = qs('main .card'); 
  if (!card) return;

  // Сохраняем оригинал (русский) один раз
  if (!CARD_ORIG[key]) CARD_ORIG[key] = card.innerHTML;

  // Для RU возвращаем исходный русский HTML из кэша
  if (lang === 'ru'){
    card.innerHTML = CARD_ORIG[key];
    return;
  }

  // Для EN/UK подменяем на переводы
  var dict = T[key]; 
  if (!dict) return;
  var html = dict[lang]; 
  if (!html) return;
  card.innerHTML = html;
}


  function apply(lang){
    setDocMeta(lang);
    applyHeader(lang);
    var p = getPage();
    if (p==='index') applyIndex(lang);
    else if (p==='services') applyServices(lang);
    else if (p==='publications') applyPublications(lang);
    else if (p==='contacts') applyContacts(lang);
    else if (p==='energy') replaceCardHTML(lang,'energy');
    else if (p==='fsa') replaceCardHTML(lang,'fsa');
    else if (p==='lab') replaceCardHTML(lang,'lab');
  }

  // ---------- Загрузка / Повторные попытки ----------
  function boot(){
    try { mountSwitcher(); setLang(getDefaultLang()); }
    catch(e){ console && console.error && console.error('[i18n boot]', e); }
  }
  getReady(function(){
    var tries = 0;
    (function retry(){
      try { if (!qs('.lang-switch')) mountSwitcher(); if (tries===0) setLang(getDefaultLang()); }
      catch(e){}
      tries++;
      if (!qs('.lang-switch') && tries < 10) setTimeout(retry, 150);
    })();
  });
  setTimeout(boot, 0);
})();
