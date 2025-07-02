import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sparkles, X, MessageSquare, BookOpen, Briefcase } from 'lucide-react';

// --- URLs de los recursos visuales ---
const teamAvatarUrl = "https://studyxacademia.com/wp-content/uploads/2024/07/cropped-android-chrome-512x512-2.png";

// --- Componente para la Factura (Invoice) ---
const InvoiceModal = ({ customerData, onClose }) => {
    if (!customerData) return null;
    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 relative animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                <div className="flex justify-between items-start mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 tracking-tighter">Studyx</h1>
                    <div className="text-right">
                        <h2 className="text-2xl font-semibold text-gray-700">FACTURA</h2>
                        <p className="text-gray-500">{invoiceNumber}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-semibold text-gray-500 mb-2">FACTURAR A:</h3>
                        <p className="font-bold text-gray-800">{customerData.nombre}</p>
                        <p className="text-gray-600">{customerData.email}</p>
                        <p className="text-gray-600">{customerData.phone}</p>
                        <p className="text-gray-600">{customerData.estado}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-semibold text-gray-500 mb-2">FECHA DE FACTURA:</h3>
                        <p className="text-gray-800">{invoiceDate}</p>
                    </div>
                </div>
                <table className="w-full mb-8">
                    <thead><tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm"><th className="p-3">Descripción</th><th className="p-3 text-right">Monto</th></tr></thead>
                    <tbody><tr className="border-b"><td className="p-3">Suscripción Mensual - Acceso Total Studyx</td><td className="p-3 text-right">$25.00</td></tr></tbody>
                </table>
                <div className="flex justify-end">
                    <div className="w-full max-w-xs text-right">
                        <div className="flex justify-between mb-2"><span className="text-gray-600">Subtotal:</span><span className="text-gray-800">$25.00</span></div>
                        <div className="flex justify-between mb-4"><span className="text-gray-600">Impuestos:</span><span className="text-gray-800">$0.00</span></div>
                        <div className="flex justify-between border-t-2 pt-2"><span className="font-bold text-lg text-gray-800">TOTAL PAGADO:</span><span className="font-bold text-lg text-gray-800">$25.00</span></div>
                    </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-8">Gracias por tu confianza en Studyx!</p>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }`}</style>
        </div>
    );
};

// --- Componente para un mensaje individual en el chat ---
const ChatMessage = ({ message }) => {
  const isBot = message.role === 'model';
  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>;
      }
      const boldRegex = /\*\*(.*?)\*\*/g;
      const textParts = part.split(boldRegex);
      return textParts.map((textPart, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{textPart}</strong>;
        }
        const lines = textPart.split('\n');
        return lines.map((line, j) => (
          <React.Fragment key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </React.Fragment>
        ));
      });
    });
  };
  return (
    <div className={`flex items-start gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <img src={teamAvatarUrl} alt="Equipo de Studyx" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />}
      <div className={`px-4 py-3 rounded-2xl max-w-lg break-words leading-relaxed ${isBot ? 'bg-gray-200 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
        {isBot ? renderMessageWithLinks(message.text) : message.text}
      </div>
      {!isBot && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600"><User size={24} /></div>}
    </div>
  );
};

// --- Componente Principal de la Aplicación de Chat ---
export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorName, setAdvisorName] = useState('');
  const [salesStage, setSalesStage] = useState('sondear');
  const [customerData, setCustomerData] = useState({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [inactivityPromptCount, setInactivityPromptCount] = useState(0);
  const [showGeminiButtons, setShowGeminiButtons] = useState({ suggest: false, plan: false, interview: false });
  const [lastCourseMentioned, setLastCourseMentioned] = useState("");

  const chatEndRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inputRef = useRef(null);

  const knowledgeBase = `La academia se llama Studyx. La oferta es una suscripción mensual de $25 durante 12 meses. El enlace de pago es: https://buy.stripe.com/eVacOw4yzdz553idQR. El campus virtual es: https://mystudyx.com/campus-virtual. Beneficios: Acceso a TODOS los cursos, profesor online 24/7, clases en vivo semanales. Cursos: Real Estate, Plomería, Inglés, Diseño de Espacios, Paisajismo, Fotografía, Cuidado de Adultos Mayores. Canales de Atención al Cliente (SOLO para después de la venta o si no puedes resolver): Asistencia al Alumno (Teléfono): 866-217-7282, WhatsApp Oficial: 786-916-4372, Email General: info@mystudyx.com, Email para Tutores: studyxtutorias@gmail.com. *Opción de pago Zelle:* info@studyxacademia.com.`;

  useEffect(() => {
    const advisorNames = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián'];
    const randomName = advisorNames[Math.floor(Math.random() * advisorNames.length)];
    setAdvisorName(randomName);
    setMessages([{ role: 'model', text: `Hola! Mi nombre es ${randomName}, del equipo de asesoramiento de Studyx. Como puedo ayudarte?` }]);
  }, []);

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  
  const sendBotMessage = async (textBlocks) => {
    for (const block of textBlocks) {
        setIsLoading(true);

        const charsPerSecond = 12;
        const timeToType = (block.length / charsPerSecond) * 1000;
        const baseDelay = 500;
        const totalDelay = baseDelay + timeToType;
        
        const maxDelay = 10000; // 10 segundos
        const finalDelay = Math.min(totalDelay, maxDelay);

        await new Promise(resolve => setTimeout(resolve, finalDelay));
        
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'model', text: block }]);
        
        await new Promise(resolve => setTimeout(resolve, 400)); 
    }
  };

  useEffect(() => {
    scrollToBottom();
    clearTimeout(inactivityTimerRef.current);
    const lastMessage = messages[messages.length - 1];
    if (isOpen && lastMessage && lastMessage.role === 'model' && inactivityPromptCount < 2 && salesStage !== 'finalizado') {
        const timeoutDuration = 120000;
        inactivityTimerRef.current = setTimeout(() => {
            if (inactivityPromptCount === 0) { sendBotMessage(["Sigues ahí?"]); setInactivityPromptCount(1); } 
            else if (inactivityPromptCount === 1) {
                const finalMessage = "Parece que no es un buen momento. No te preocupes! [---] Si quieres continuar la conversación más tarde, puedes escribirme a nuestro WhatsApp 786-916-4372. [---] Que tengas un buen día!";
                sendBotMessage(finalMessage.split('[---]'));
                setInactivityPromptCount(2); 
            }
        }, timeoutDuration);
    }
    return () => clearTimeout(inactivityTimerRef.current);
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading) { inputRef.current?.focus(); }
  }, [isOpen, isLoading]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model') {
        const userMessagesCount = messages.filter(m => m.role === 'user').length;
        const botResponseText = lastMessage.text;
        const newButtonState = { suggest: false, plan: false, interview: false };
        const courses = ["Real Estate", "Plomería", "Inglés", "Diseño de Espacios", "Paisajismo", "Fotografía", "Cuidado de Adultos Mayores"];
        const mentionedCourse = courses.find(course => botResponseText.toLowerCase().includes(course.toLowerCase()));
        if (mentionedCourse) {
            setLastCourseMentioned(mentionedCourse);
            newButtonState.plan = true;
            newButtonState.interview = true;
        } else if (userMessagesCount === 1) {
            newButtonState.suggest = true;
        }
        setShowGeminiButtons(newButtonState);
    }
  }, [messages]);


  const callGeminiAPI = async (prompt, systemPrompt) => {
    let botResponseText = '';
    try {
        const chatHistoryForAPI = [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistoryForAPI, systemInstruction: { role: "model", parts: [{ text: systemPrompt }] } };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API key not configured.");
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("429");
            }
            throw new Error("Network error");
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            botResponseText = result.candidates[0].content.parts[0].text;
        } else {
            botResponseText = "No he podido procesar esa solicitud. ¿Podrías intentarlo de otra manera?";
        }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        if (error.message === "429") {
            const errorHeader = "Nuestros asesores están con muchas consultas en este momento. Por favor, espera un minuto y vuelve a intentarlo.";
            const suggestionText = `Mientras tanto, aquí tienes un vistazo a lo que ofrecemos:\n* **Real Estate:** Conviértete en un profesional inmobiliario.\n* **Plomería:** Aprende un oficio con alta demanda.\n* **Inglés:** Abre las puertas al mundo.\n\n¿Quieres ver más? [Explora todos nuestros cursos aquí](https://studyxacademia.com/cursos/).`;
            botResponseText = `${errorHeader}[---]${suggestionText}`;
        } else {
            botResponseText = "Parece que la conexión está un poco inestable. ¿Podrías intentar enviar tu mensaje de nuevo?";
        }
    } finally {
        return botResponseText;
    }
  };

  const handleSendMessage = async (e, geminiAction = null, actionParam = null) => {
    if (e) e.preventDefault();
    const userInput = geminiAction ? `Acción del usuario: ${geminiAction}` : input;
    if (!userInput.trim() && !geminiAction) return;

    const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;

    if (!geminiAction) {
        const userMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    clearTimeout(inactivityTimerRef.current);
    setInactivityPromptCount(0);
    setShowGeminiButtons({ suggest: false, plan: false, interview: false });

    if (isFirstUserMessage && !geminiAction) {
        await new Promise(resolve => setTimeout(resolve, 6000)); 
    } else if (!geminiAction) {
        await new Promise(resolve => setTimeout(resolve, 2500));
    }

    setIsLoading(true);

    if (salesStage === 'esperando_pago' && (userInput.toLowerCase().includes('ya pagué') || userInput.toLowerCase().includes('listo'))) {
        setShowInvoice(true); setSalesStage('finalizado');
        const finalMessage = `Excelente! Bienvenido a Studyx...`;
        await sendBotMessage(finalMessage.split('[---]')); return;
    }
    if (salesStage.startsWith('recopilar_')) {
        const field = salesStage.split('_')[1];
        const isQuestionOrDeviation = userInput.toLowerCase().includes('?') || userInput.toLowerCase().split(' ').length > 8 || ['qué', 'cómo', 'cuánto', 'por', 'dónde', 'cuál', 'pero', 'no quiero'].some(kw => userInput.toLowerCase().includes(kw));
        if (!isQuestionOrDeviation) {
            let validationError = null;
            if (field === 'email' && !/\S+@\S+\.\S+/.test(userInput)) validationError = "Hmm, ese email no parece correcto...";
            if (field === 'phone' && !/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(userInput)) validationError = "Ese número de teléfono no parece válido...";
            if (validationError) { await sendBotMessage([validationError]); return; }
            const newData = { ...customerData, [field]: userInput }; setCustomerData(newData);
            const fields = ['nombre', 'email', 'phone', 'estado'];
            const currentIndex = fields.indexOf(field);
            if (currentIndex < fields.length - 1) {
                const nextField = fields[currentIndex + 1]; setSalesStage(`recopilar_${nextField}`);
                let question = `Perfecto. Ahora necesito tu ${nextField}, por favor.`;
                if (nextField === 'estado') question = "Entendido. Y en qué estado de los Estados Unidos vives?";
                await sendBotMessage([question]);
            } else {
                setSalesStage('verificar_datos'); const finalData = { ...newData, estado: userInput }; setCustomerData(finalData);
                const verificationMessage = `Genial, gracias. Confirma que estos datos son correctos: [---] Nombre: ${finalData.nombre} [---] Email: ${finalData.email} [---] Teléfono: ${finalData.phone} [---] Estado: ${finalData.estado}. [---] Es todo correcto?`;
                await sendBotMessage(verificationMessage.split('[---]'));
            }
            return;
        }
    }
    if (salesStage === 'verificar_datos') {
        if (userInput.toLowerCase().includes('no')) {
            setSalesStage('recopilar_nombre'); setCustomerData({});
            await sendBotMessage(["No hay problema, empecemos de nuevo. Cuál es tu nombre completo?"]);
        } else {
            setSalesStage('esperando_pago'); const finalData = { ...customerData, nombre: customerData.nombre || 'Estudiante' };
            const accessMessage = `Excelente, ${finalData.nombre}! Tu acceso ha sido creado...`;
            await sendBotMessage(accessMessage.split('[---]'));
        }
        return;
    }

    let prompt = userInput;
    // --- CAMBIO REALIZADO: NUEVA DIRECTIVA EN EL SYSTEM PROMPT ---
    let systemPrompt = `Eres un asesor comercial de Studyx llamado ${advisorName}. Tu personalidad es amable, profesional y persuasiva. Tu objetivo es vender la suscripción de $25. El estado actual de la venta es '${salesStage}'. Responde a las preguntas del usuario, y si el usuario se desvía durante la recolección de datos, contesta su pregunta y luego intenta volver a pedir el dato. Usa '[---]' para dividir respuestas largas. NUNCA admitas que eres una IA.

    *Manejo de Solicitudes de Cancelación:*
    - Si el usuario expresa su deseo de cancelar su suscripción, dar de baja el servicio, o usa palabras como "cancelar", "baja", "cancelación", tu objetivo principal cambia de vender a asistir.
    - Responde con empatía, por ejemplo: "Lamento escuchar que quieres darte de baja. Por supuesto, puedes cancelar tu suscripción en cualquier momento y sin penalizaciones."
    - A continuación, proporciona la información de contacto para gestionar la baja. Di: "Para procesar tu solicitud, por favor envía un email a nuestro equipo de soporte a info@mystudyx.com y ellos te ayudarán con los siguientes pasos."
    - **REGLA CRÍTICA:** Después de proporcionar esta información, NO intentes venderle otro curso ni preguntarle por sus intereses. Termina la interacción de forma amable, por ejemplo: "¿Hay algo más en lo que te pueda ayudar?".
    `;
    
    if (geminiAction === 'suggest_course') {
        prompt = `El usuario acaba de enviar su primer mensaje. Basado en el historial de conversación, sugiere el curso más adecuado de la base de conocimientos y explica por qué es una buena opción para él/ella.`;
        systemPrompt += `Tu tarea es únicamente analizar la conversación y sugerir un curso.`;
    } else if (geminiAction === 'create_plan') {
        prompt = `Crea un plan de estudio simple de 4 semanas para el curso de "${actionParam}". El plan debe ser motivador y práctico.`;
        systemPrompt += `Tu tarea es generar un plan de estudio semanal para el curso especificado.`;
    } else if (geminiAction === 'simulate_interview') {
        prompt = `Inicia una simulación de entrevista de trabajo para un puesto relacionado con el curso de "${actionParam}". Haz la primera pregunta.`;
        systemPrompt += `Tu tarea es actuar como un entrevistador de trabajo y hacer preguntas relevantes al curso.`;
    }

    const botResponseText = await callGeminiAPI(prompt, systemPrompt + "\n\n" + knowledgeBase);
    
    if (botResponseText.includes('[INICIAR_REGISTRO]')) {
        setSalesStage('recopilar_nombre');
        const cleanResponse = botResponseText.replace('[INICIAR_REGISTRO]', '').trim();
        await sendBotMessage(cleanResponse.split('[---]'));
    } else {
        await sendBotMessage(botResponseText.split('[---]'));
    }
  };

  return (
    <div className="bg-transparent font-sans w-full h-full">
      {showInvoice && <InvoiceModal customerData={customerData} onClose={() => setShowInvoice(false)} />}
      
      <div className={`fixed bottom-24 right-4 flex flex-col items-end gap-2 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {showGeminiButtons.suggest && <button onClick={() => handleSendMessage(null, 'suggest_course')} className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-purple-700 animate-fade-in"><Sparkles size={16}/>Sugerir Curso</button>}
        {showGeminiButtons.plan && <button onClick={() => handleSendMessage(null, 'create_plan', lastCourseMentioned)} className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-purple-700 animate-fade-in"><BookOpen size={16}/>Crear Plan de Estudio</button>}
        {showGeminiButtons.interview && <button onClick={() => handleSendMessage(null, 'simulate_interview', lastCourseMentioned)} className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-purple-700 animate-fade-in"><Briefcase size={16}/>Simular Entrevista</button>}
      </div>

      <div className={`fixed bottom-20 right-4 w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] transition-all duration-300 ease-in-out origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="relative flex flex-col h-full bg-white font-sans overflow-hidden rounded-2xl shadow-2xl border border-gray-200">
            <header className="bg-white shadow-sm z-10 border-b">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tighter">Asesor Studyx</h1>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                <div className="container mx-auto max-w-3xl">
                    {messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
                    {isLoading && (
                        <div className="flex items-start gap-3 my-4 justify-start">
                            <img src={teamAvatarUrl} alt="Equipo de Studyx escribiendo" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />
                            <div className="px-4 py-3 rounded-2xl bg-gray-200 text-gray-500 rounded-tl-none flex items-center justify-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mx-1" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </main>
            <footer className="bg-white border-t p-2">
                <div className="container mx-auto max-w-3xl">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu consulta aquí..." className="flex-1 w-full px-4 py-3 border-2 border-transparent rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"><Send size={20} /></button>
                    </form>
                    <div className="flex justify-center mt-2 py-1">
                        <img src="https://studyxacademia.com/wp-content/uploads/2024/08/logo-nuevo-xs-min.png" alt="Logo Studyx" className="h-5" />
                    </div>
                </div>
            </footer>
        </div>
      </div>

      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 ease-in-out hover:bg-indigo-700 hover:scale-110 ${!isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        aria-label="Abrir chat"
      >
        <MessageSquare size={32} />
      </button>
    </div>
  );
}
