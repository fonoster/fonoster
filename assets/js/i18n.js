/*
 * EN / ES copy for fonoster.com v1.
 * Static strings are referenced from the HTML with data-i18n="key".
 * In strings: "\n" is a line break, "|" is a line break on mobile only,
 * and "[...]" marks text hidden on mobile.
 */
window.FONOSTER_I18N = {
  en: {
    "meta.homeTitle": "Fonoster · AI that answers the phone",
    "meta.autopilotTitle": "Autopilot · Fonoster",
    "nav.autopilot": "Autopilot",
    "nav.useCases": "Use cases",
    "nav.docs": "Docs",
    "nav.pricing": "Pricing",
    "nav.menu": "Menu",
    "cta.start": "Start building",
    "cta.sales": "Contact sales",
    "cta.docs": "Read the docs",

    "hero.badge": "New · Multilingual code-switching",
    "hero.title": "AI that answers\nthe phone.",
    "hero.sub": "Build, test, and run voice agents on real phone lines.",
    "demo.label": "Get a call from our AI agent",
    "demo.country": "Country code",
    "demo.placeholder": "Phone number",
    "demo.call": "Call me",
    "demo.soon": "Live demo calls are coming soon. Talk to sales for a demo.",
    "phone.name": "Fonoster Agent",

    "numbers.stars": "GitHub stars across projects",
    "numbers.pulls": "Docker pulls",
    "numbers.releases": "releases shipped",
    "numbers.since": "building since",

    "uc.title": "Built for real calls.",
    "uc.see": "See the example",
    "caps.title": "Everything a phone call needs.",
    "caps.numbers": "Phone numbers",
    "caps.sip": "SIP trunking",
    "caps.transfer": "Call transfer",
    "caps.voicemail": "Voicemail detection",
    "caps.barge": "Barge-in",
    "caps.multi": "Multilingual",
    "caps.kb": "Knowledge base",
    "caps.tools": "Custom tools",
    "caps.mcp": "MCP server",
    "caps.recording": "Call recording",
    "caps.noise": "Noise filtering",
    "caps.events": "Events & webhooks",

    "pipe.title": "Any model.| Any carrier.",
    "pipe.sub": "Swap providers with one line. No lock\u2011in.",
    "pipe.call": "Call",
    "pipe.hear": "Hear",
    "pipe.think": "Think",
    "pipe.speak": "Speak",

    "ap.eyebrow": "Autopilot",
    "ap.blockTitle": "Your agent is a YAML file.",
    "ap.blockSub": "Pick the voice, the model, and the prompt. Deploy with one command.",
    "ap.learn": "Learn more about Autopilot",

    "deploy.title": "Deploy anywhere.",
    "deploy.cloud": "Cloud",
    "deploy.cloudLine": "Managed. Scales with you.",
    "deploy.self": "Self-hosted",
    "deploy.selfLine": "Open-source core, MIT.",
    "deploy.ent": "Enterprise",
    "deploy.entLine": "SLAs, support, on-prem.",
    "deploy.talk": "Talk to us",

    "final.title": "Your first agent\non the phone today.",
    "footer.rights": "© 2026 Fonoster Inc.",
    "prefs.language": "Language",
    "prefs.theme": "Theme",
    "prefs.dark": "Dark",
    "prefs.light": "Light",

    "aph.title": "Describe the agent.\nAutopilot takes| the call.",
    "aph.sub": "Prompt, voice, model, and tools in one file — live on a real phone number.",
    "con.live": "Live call",
    "con.meta": "Inbound · Dental clinic",
    "con.running": "Running",
    "con.models": "Models",
    "con.tools": "Tools",
    "con.knowledge": "Knowledge",
    "con.llm": "LLM",
    "con.stt": "Speech-to-text",
    "con.voice": "Voice",
    "con.used": "used",
    "works.label": "Works with your stack",
    "feat.title": "Everything is configuration.",
    "feat.sub": "No glue code. Change a line, redeploy.",
    "feat.tools": "Tools",
    "feat.toolsLine": "Call your APIs mid-conversation.",
    "feat.kb": "Knowledge base",
    "feat.kbLine": "Answer from your own documents.",
    "feat.barge": "Barge-in",
    "feat.bargeLine": "Let callers interrupt, naturally.",
    "feat.handoff": "Human handoff",
    "feat.handoffLine": "Transfer to a person when it matters.",
    "feat.multi": "Multilingual",
    "feat.multiLine": "Switch languages mid-sentence.",
    "feat.noise": "Noise filtering",
    "feat.noiseLine": "Hear callers in noisy places.",
    "feat.agent": "Agent",
    "feat.caller": "Caller",
    "feat.billing": "Billing team",
    "evals.eyebrow": "Evals",
    "evals.title": "Test it before| it takes a call.",
    "evals.sub": "Write scenarios. Check replies and tool calls. Get a JSON report.",
    "run.title": "Runs where you need it.",
    "run.cloud": "Fonoster Cloud",
    "run.cloudLine": "Managed and scaled for you.",
    "run.self": "Self-hosted",
    "run.selfLine": "Your servers. Same YAML.",
    "run.keys": "Your own keys",
    "run.keysLine": "Bring your model and voice accounts.",
    "apfinal.title": "Put your agent\non the phone.",
    "meta.pricingTitle": "Pricing · Fonoster",
    "meta.notFoundTitle": "Page not found · Fonoster",
    "pricing.title": "Simple pricing.",
    "pricing.sub": "One plan with everything you need. Start with $10 in credits.",
    "pricing.credits": "$10 in credits to start",
    "pricing.per": "/ month",
    "pricing.f1": "10GB storage",
    "pricing.f2": "Unlimited workspaces",
    "pricing.f3": "Unlimited domains",
    "pricing.f4": "520 minutes/month free, then pay\u2011as\u2011you\u2011go",
    "pricing.f5": "30-day log retention",
    "pricing.f6": "Email support",
    "pricing.entQ": "Need SLAs, volume pricing, or on-prem?",
    "pricing.entLink": "Talk to sales",
    "nf.title": "This line isn't in service.",
    "nf.sub": "The page you're looking for doesn't exist.",
    "nf.home": "Back to home",

    /* Hero phone: the call that loops on the home page */
    phone: {
      agent: "Agent",
      caller: "Caller",
      lines: [
        ["agent", "Hi! Thanks for calling. How can I help?"],
        ["caller", "Can I move my cleaning to Friday?"],
        ["agent", "I can move you to Friday at 10. Does that work?"],
        ["caller", "Perfect, thank you!"]
      ]
    },

    /* Use cases. Items: [kind, text, icon?, label?]  kind: a=agent, c=caller, e=event */
    cases: {
      support: {
        tab: "Support",
        name: "Carlos M.",
        meta: "Inbound · Internet provider",
        items: [
          ["c", "My internet keeps dropping."],
          ["e", "checkOutage(\"10001\") → none", "wrench", "Tool"],
          ["a", "No outage near you. Let's restart your router together."],
          ["c", "Okay… it's back!"],
          ["a", "Great! Anything else I can help with?"]
        ],
        lead: "Fixes the common issues — and hands off the rest.",
        uses: [["phone-call", "Inbound calls"], ["wrench", "Custom tools"], ["phone-forwarded", "Human handoff"]]
      },
      scheduling: {
        tab: "Scheduling",
        name: "Ana R.",
        meta: "Outbound · Spanish / English",
        items: [
          ["a", "Hi Ana — calling to confirm Thursday at 3 PM."],
          ["c", "¿Podemos pasarlo al viernes en la mañana?"],
          ["e", "calendar.reschedule(\"fri 10:00\")", "wrench", "Tool"],
          ["a", "¡Listo! Viernes a las 10 AM. Nos vemos."]
        ],
        lead: "Confirms, reschedules, and books — in the caller's language.",
        uses: [["phone-outgoing", "Outbound calls"], ["wrench", "Custom tools"], ["languages", "Code-switching"]]
      },
      collections: {
        tab: "Collections",
        name: "Luis G.",
        meta: "Outbound · Lender",
        items: [
          ["a", "Hi Luis, a reminder: your $120 balance is due Friday."],
          ["c", "Can I pay half now?"],
          ["e", "createPaymentPlan(60, 2)", "wrench", "Tool"],
          ["a", "Done: $60 today and $60 on the 15th. I'll text you the link."]
        ],
        lead: "Friendly reminders and payment plans, at scale.",
        uses: [["phone-outgoing", "Batch calls"], ["voicemail", "Voicemail detection"], ["wrench", "Custom tools"]]
      },
      sales: {
        tab: "Sales",
        name: "Maya K.",
        meta: "Inbound · Solar installer",
        items: [
          ["c", "I'm curious about solar for my home."],
          ["a", "Great! Do you own the home?"],
          ["c", "Yes, in Austin."],
          ["e", "service-areas.md", "book-open", "Knowledge"],
          ["a", "We cover Austin. Want a free consult Tuesday at 2 PM?"]
        ],
        lead: "Qualifies leads and books meetings while they're warm.",
        uses: [["phone-call", "Inbound calls"], ["book-open", "Knowledge base"], ["wrench", "Custom tools"]]
      }
    },

    /* Autopilot hero console. Events may light up a tool in the agent panel (5th value). */
    console: [
      ["c", "Is a cleaning covered by my plan?"],
      ["e", "plans.pdf", "book-open", "Knowledge"],
      ["a", "Yes — twice a year. Want to book one?"],
      ["c", "Thursday morning?"],
      ["e", "getAvailableTimes[(\"thu\")] → 9:00, 10:30", "wrench", "Tool", "getAvailableTimes"],
      ["a", "I have 9:00 or 10:30, and —"],
      ["e", "caller interrupted", "hand", "Barge-in"],
      ["c", "10:30. Can I talk to billing?"],
      ["e", "Billing team", "phone-forwarded", "Transfer", "transfer"]
    ],

    evals: {
      human1: "Can I book a cleaning on Thursday?",
      expected1: "Offers the available times",
      actual1: "I have 9:00 or 10:30. Which works?",
      human2: "10:30, please."
    }
  },

  es: {
    "meta.homeTitle": "Fonoster · IA que contesta el teléfono",
    "meta.autopilotTitle": "Autopilot · Fonoster",
    "nav.autopilot": "Autopilot",
    "nav.useCases": "Casos de uso",
    "nav.docs": "Docs",
    "nav.pricing": "Precios",
    "nav.menu": "Menú",
    "cta.start": "Comienza a construir",
    "cta.sales": "Hablar con ventas",
    "cta.docs": "Ver la documentación",

    "hero.badge": "Nuevo · Cambio de idioma en plena llamada",
    "hero.title": "IA que contesta\nel teléfono.",
    "hero.sub": "Crea, prueba y opera agentes de voz en líneas telefónicas reales.",
    "demo.label": "Recibe una llamada de nuestro agente de IA",
    "demo.country": "Código de país",
    "demo.placeholder": "Número de teléfono",
    "demo.call": "Llámame",
    "demo.soon": "Las llamadas de demostración llegarán pronto. Habla con ventas para una demo.",
    "phone.name": "Agente Fonoster",

    "numbers.stars": "estrellas en GitHub entre proyectos",
    "numbers.pulls": "descargas en Docker",
    "numbers.releases": "versiones publicadas",
    "numbers.since": "construyendo desde",

    "uc.title": "Hecho para llamadas reales.",
    "uc.see": "Ver el ejemplo",
    "caps.title": "Todo lo que necesita una llamada.",
    "caps.numbers": "Números telefónicos",
    "caps.sip": "Troncales SIP",
    "caps.transfer": "Transferencia de llamadas",
    "caps.voicemail": "Detección de buzón de voz",
    "caps.barge": "Interrupciones",
    "caps.multi": "Multilingüe",
    "caps.kb": "Base de conocimiento",
    "caps.tools": "Herramientas propias",
    "caps.mcp": "Servidor MCP",
    "caps.recording": "Grabación de llamadas",
    "caps.noise": "Filtro de ruido",
    "caps.events": "Eventos y webhooks",

    "pipe.title": "Cualquier modelo.| Cualquier operador.",
    "pipe.sub": "Cambia de proveedor con una línea. Sin ataduras.",
    "pipe.call": "Llamada",
    "pipe.hear": "Escucha",
    "pipe.think": "Piensa",
    "pipe.speak": "Habla",

    "ap.eyebrow": "Autopilot",
    "ap.blockTitle": "Tu agente es un archivo YAML.",
    "ap.blockSub": "Elige la voz, el modelo y el prompt. Despliega con un solo comando.",
    "ap.learn": "Conoce más sobre Autopilot",

    "deploy.title": "Despliega donde quieras.",
    "deploy.cloud": "Nube",
    "deploy.cloudLine": "Administrado. Escala contigo.",
    "deploy.self": "Autoalojado",
    "deploy.selfLine": "Núcleo de código abierto, MIT.",
    "deploy.ent": "Empresarial",
    "deploy.entLine": "SLA, soporte, on-premise.",
    "deploy.talk": "Hablemos",

    "final.title": "Tu primer agente,\nal teléfono hoy.",
    "footer.rights": "© 2026 Fonoster Inc.",
    "prefs.language": "Idioma",
    "prefs.theme": "Tema",
    "prefs.dark": "Oscuro",
    "prefs.light": "Claro",

    "aph.title": "Describe al agente.\nAutopilot toma| la llamada.",
    "aph.sub": "Prompt, voz, modelo y herramientas en un solo archivo — en vivo en un número real.",
    "con.live": "Llamada en vivo",
    "con.meta": "Entrante · Clínica dental",
    "con.running": "Activo",
    "con.models": "Modelos",
    "con.tools": "Herramientas",
    "con.knowledge": "Conocimiento",
    "con.llm": "LLM",
    "con.stt": "Voz a texto",
    "con.voice": "Voz",
    "con.used": "usada",
    "works.label": "Funciona con tu stack",
    "feat.title": "Todo es configuración.",
    "feat.sub": "Sin código intermedio. Cambia una línea y vuelve a desplegar.",
    "feat.tools": "Herramientas",
    "feat.toolsLine": "Llama a tus APIs en plena conversación.",
    "feat.kb": "Base de conocimiento",
    "feat.kbLine": "Responde con tus propios documentos.",
    "feat.barge": "Interrupciones",
    "feat.bargeLine": "Deja que el cliente interrumpa, con naturalidad.",
    "feat.handoff": "Traspaso a una persona",
    "feat.handoffLine": "Transfiere a una persona cuando importa.",
    "feat.multi": "Multilingüe",
    "feat.multiLine": "Cambia de idioma a mitad de frase.",
    "feat.noise": "Filtro de ruido",
    "feat.noiseLine": "Escucha al cliente en lugares ruidosos.",
    "feat.agent": "Agente",
    "feat.caller": "Cliente",
    "feat.billing": "Facturación",
    "evals.eyebrow": "Evals",
    "evals.title": "Pruébalo antes de que| tome una llamada.",
    "evals.sub": "Escribe escenarios. Verifica respuestas y herramientas. Obtén un reporte JSON.",
    "run.title": "Corre donde lo necesites.",
    "run.cloud": "Fonoster Cloud",
    "run.cloudLine": "Administrado y escalado por nosotros.",
    "run.self": "Autoalojado",
    "run.selfLine": "Tus servidores. El mismo YAML.",
    "run.keys": "Tus propias llaves",
    "run.keysLine": "Usa tus cuentas de modelos y voz.",
    "apfinal.title": "Pon a tu agente\nal teléfono.",
    "meta.pricingTitle": "Precios · Fonoster",
    "meta.notFoundTitle": "Página no encontrada · Fonoster",
    "pricing.title": "Precios simples.",
    "pricing.sub": "Un plan con todo lo que necesitas. Empieza con $10 en créditos.",
    "pricing.credits": "$10 en créditos para empezar",
    "pricing.per": "/ mes",
    "pricing.f1": "10 GB de almacenamiento",
    "pricing.f2": "Espacios de trabajo ilimitados",
    "pricing.f3": "Dominios ilimitados",
    "pricing.f4": "520 minutos al mes gratis, luego pago por uso",
    "pricing.f5": "Retención de registros por 30 días",
    "pricing.f6": "Soporte por correo electrónico",
    "pricing.entQ": "¿Necesitas SLA, precios por volumen u on-premise?",
    "pricing.entLink": "Habla con ventas",
    "nf.title": "Esta línea no está en servicio.",
    "nf.sub": "La página que buscas no existe.",
    "nf.home": "Volver al inicio",

    phone: {
      agent: "Agente",
      caller: "Cliente",
      lines: [
        ["agent", "¡Hola! Gracias por llamar. ¿En qué te ayudo?"],
        ["caller", "¿Puedo mover mi limpieza al viernes?"],
        ["agent", "Te puedo pasar al viernes a las 10. ¿Te funciona?"],
        ["caller", "¡Perfecto, gracias!"]
      ]
    },

    cases: {
      support: {
        tab: "Soporte",
        name: "Carlos M.",
        meta: "Entrante · Proveedor de internet",
        items: [
          ["c", "Mi internet se cae a cada rato."],
          ["e", "checkOutage(\"10001\") → ninguna", "wrench", "Herramienta"],
          ["a", "No hay fallas en tu zona. Reiniciemos el router juntos."],
          ["c", "Listo… ¡ya volvió!"],
          ["a", "¡Excelente! ¿Te ayudo con algo más?"]
        ],
        lead: "Resuelve lo común y transfiere el resto.",
        uses: [["phone-call", "Llamadas entrantes"], ["wrench", "Herramientas propias"], ["phone-forwarded", "Traspaso a una persona"]]
      },
      scheduling: {
        tab: "Citas",
        name: "Ana R.",
        meta: "Saliente · Español / Inglés",
        items: [
          ["a", "Hola Ana, te llamo para confirmar el jueves a las 3 PM."],
          ["c", "Can we move it to Friday morning?"],
          ["e", "calendar.reschedule(\"fri 10:00\")", "wrench", "Herramienta"],
          ["a", "Done! Friday at 10 AM. See you then."]
        ],
        lead: "Confirma, reagenda y agenda — en el idioma del cliente.",
        uses: [["phone-outgoing", "Llamadas salientes"], ["wrench", "Herramientas propias"], ["languages", "Cambio de idioma"]]
      },
      collections: {
        tab: "Cobranza",
        name: "Luis G.",
        meta: "Saliente · Financiera",
        items: [
          ["a", "Hola Luis, te recordamos que tu saldo de $120 vence el viernes."],
          ["c", "¿Puedo pagar la mitad ahora?"],
          ["e", "createPaymentPlan(60, 2)", "wrench", "Herramienta"],
          ["a", "Listo: $60 hoy y $60 el día 15. Te envío el enlace por SMS."]
        ],
        lead: "Recordatorios amables y planes de pago, a escala.",
        uses: [["phone-outgoing", "Llamadas masivas"], ["voicemail", "Detección de buzón de voz"], ["wrench", "Herramientas propias"]]
      },
      sales: {
        tab: "Ventas",
        name: "Maya K.",
        meta: "Entrante · Instalador solar",
        items: [
          ["c", "Me interesa la energía solar para mi casa."],
          ["a", "¡Genial! ¿La casa es tuya?"],
          ["c", "Sí, en Austin."],
          ["e", "service-areas.md", "book-open", "Conocimiento"],
          ["a", "Cubrimos Austin. ¿Te agendo una consulta gratis el martes a las 2 PM?"]
        ],
        lead: "Califica prospectos y agenda reuniones mientras están interesados.",
        uses: [["phone-call", "Llamadas entrantes"], ["book-open", "Base de conocimiento"], ["wrench", "Herramientas propias"]]
      }
    },

    console: [
      ["c", "¿Mi plan cubre una limpieza?"],
      ["e", "plans.pdf", "book-open", "Conocimiento"],
      ["a", "Sí — dos veces al año. ¿Te agendo una?"],
      ["c", "¿El jueves en la mañana?"],
      ["e", "getAvailableTimes[(\"jue\")] → 9:00, 10:30", "wrench", "Herramienta", "getAvailableTimes"],
      ["a", "Tengo 9:00 o 10:30, y —"],
      ["e", "el cliente interrumpió", "hand", "Interrupción"],
      ["c", "10:30. ¿Puedo hablar con facturación?"],
      ["e", "Facturación", "phone-forwarded", "Transferencia", "transfer"]
    ],

    evals: {
      human1: "¿Puedo reservar una limpieza el jueves?",
      expected1: "Ofrece los horarios disponibles",
      actual1: "Tengo 9:00 o 10:30. ¿Cuál prefieres?",
      human2: "A las 10:30, por favor."
    }
  }
};
