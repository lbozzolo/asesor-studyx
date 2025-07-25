import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sparkles, X, MessageSquare, BookOpen, Briefcase, CheckCircle } from 'lucide-react';

// --- URLs de los recursos visuales ---
const teamAvatarUrl = "https://studyxacademia.com/wp-content/uploads/2024/07/cropped-android-chrome-512x512-2.png";
const studyxLogoUrl = "https://studyxacademia.com/wp-content/uploads/2024/08/logo-nuevo-xs-min.png";

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
        const lines = textPart.split('\n').filter(line => line.trim() !== '');
        return lines.map((line, j) => (
          <span key={j} className="block">{line}</span> // Se usa <span> para mejor control de párrafos
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

// Función para obtener los cursos desde Google Sheets
const getCursosFromGoogleSheets = async () => {
  const sheetId = '1vNmBjrX9VDO3v-xXxHqrxCqAX_HsO2rxQom_pKa9EqQ'; // Reemplaza con el ID de tu hoja de Google Sheets
  const range = 'cursos!A1:A'; // Rango de celdas
  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error al obtener los datos de Google Sheets:', error);
    return [];
  }
};

// --- Componente Principal de la Aplicación de Chat ---
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advisorName, setAdvisorName] = useState('');
  const [salesStage, setSalesStage] = useState('sondear');
  const [customerData, setCustomerData] = useState({});
  const [showInvoice, setShowInvoice] = useState(false);
  const [inactivityPromptCount, setInactivityPromptCount] = useState(0);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showGeminiButtons, setShowGeminiButtons] = useState({ suggest: false, plan: false, interview: false });
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoVisible, setVideoVisible] = useState(false); // Nuevo estado para visibilidad
  const [videoFade, setVideoFade] = useState(false); // Para animación de fade out
  const [cursos, setCursos] = useState([]); // Estado para los cursos
  const [videoShown, setVideoShown] = useState(false); // Nuevo estado para controlar si el video ya se mostró
  const [errorMessage, setErrorMessage] = useState(null); // Estado para manejar errores
  const [isMobile, setIsMobile] = useState(false); // Estado para detectar dispositivos móviles
  const videoTimeoutRef = useRef(null);

  const chatEndRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/systemPrompt.txt')
      .then(res => res.text())
      .then(text => setSystemPrompt(text));
  }, []);

  useEffect(() => {
    const advisorNames = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián'];
    const randomName = advisorNames[Math.floor(Math.random() * advisorNames.length)];
    setAdvisorName(randomName);
    setMessages([{ role: 'model', text: `Hola! Mi nombre es ${randomName}, del equipo de asesoramiento de Studyx. Como puedo ayudarte?` }]);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const fetchCursos = async () => {
        const data = await getCursosFromGoogleSheets();
        setCursos(data.flat()); // Convierte las filas en un array plano
    };

    fetchCursos();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Consideramos móvil si el ancho es menor o igual a 768px
    };

    handleResize(); // Verificar al cargar la página
    window.addEventListener('resize', handleResize); // Escuchar cambios de tamaño

    return () => window.removeEventListener('resize', handleResize); // Limpiar el evento al desmontar
  }, []);

  const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  
  // Modifica sendBotMessage para detectar videos de YouTube SOLO en el mensaje más reciente del bot
  const sendBotMessage = async (textBlocks) => {
    for (const block of textBlocks) {
      setIsLoading(true);
      let videoLink = null;
      let cleanBlock = block;
      const markerStart = block.indexOf('[VIDEO:');
      if (markerStart !== -1) {
        // Reemplazar el video de YouTube por el video local
        videoLink = '/studyx-institucional-medium.mp4';
        cleanBlock = block.slice(0, markerStart).trim();
        if (!videoShown) { // Solo agregar el mensaje si el video no se ha mostrado antes
          const locationMessage = "El video estará disponible para que lo veas.";
          cleanBlock += ` ${locationMessage}`;
        }
      }
      if (videoLink && !videoShown) { // Mostrar el video solo si no se ha mostrado antes
        setVideoUrl(videoLink);
        setVideoVisible(true);
        setVideoFade(false);
        setVideoShown(true); // Marcar el video como mostrado
        if (videoTimeoutRef.current) clearTimeout(videoTimeoutRef.current);
        videoTimeoutRef.current = setTimeout(() => {
          setVideoFade(true);
          setTimeout(() => {
            setVideoVisible(false);
            setVideoUrl(null);
            setVideoFade(false);
          }, 1200);
        }, 120000);
        const charsPerSecond = 12;
        const timeToType = (cleanBlock.length / charsPerSecond) * 1000;
        const baseDelay = 500;
        const totalDelay = baseDelay + timeToType;
        const maxDelay = 10000;
        const finalDelay = Math.min(totalDelay, maxDelay);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'model', text: cleanBlock }]);
        await new Promise(resolve => setTimeout(resolve, 400));
        continue;
      }
      const charsPerSecond = 12;
      const timeToType = (block.length / charsPerSecond) * 1000;
      const baseDelay = 500;
      const totalDelay = baseDelay + timeToType;
      const maxDelay = 10000;
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
    if (lastMessage && lastMessage.role === 'model' && inactivityPromptCount < 2 && salesStage !== 'finalizado') {
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
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model') {
        const userMessagesCount = messages.filter(m => m.role === 'user').length;
        const botResponseText = lastMessage.text;
        const newButtonState = { suggest: false, plan: false, interview: false };
        // Eliminar el array estático de cursos y usar el estado dinámico `cursos`

        setShowGeminiButtons(newButtonState);
    }
  }, [messages]);


  const callGeminiAPI = async (prompt, systemPrompt) => {
    let botResponseText = '';
    try {
        // Verificar si el prompt menciona algún curso dinámicamente
        const normalizedPrompt = prompt.toLowerCase().trim();
        const isCourseQuery = cursos.some(curso => {
            const cursoPalabras = curso.toLowerCase().split(/\s+/); // Divide el nombre del curso en palabras clave
            return cursoPalabras.some(palabra => normalizedPrompt.includes(palabra)); // Verifica si alguna palabra clave está en el prompt
        });
        const coursesList = cursos.length > 0 
            ? `Aquí tienes la lista actualizada de cursos disponibles en Studyx: ${cursos.join(', ')}.` 
            : 'Actualmente no hay cursos disponibles.';
        const chatHistoryForAPI = [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: "user", parts: [{ text: `${isCourseQuery ? coursesList : ''}\n\n${prompt}`.trim() }] }];
        const payload = { contents: chatHistoryForAPI, systemInstruction: { role: "model", parts: [{ text: systemPrompt }] } };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("API key not configured.");
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            if (response.status === 429) { throw new Error("429"); }
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
        setErrorMessage("Error de conexión - Espere y vuelva a intentar"); // Establecer mensaje de error
    } finally {
        return botResponseText;
    }
  };

  const handleSendMessage = async (e, geminiAction = null, actionParam = null) => {
    if (e) e.preventDefault();
    setErrorMessage(null); // Limpiar el mensaje de error al enviar un nuevo mensaje
    // setVideoUrl(null); // <-- Ya NO limpiar el video aquí
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
    if (isFirstUserMessage && !geminiAction) { await new Promise(resolve => setTimeout(resolve, 6000)); } 
    else if (!geminiAction) { await new Promise(resolve => setTimeout(resolve, 2500)); }
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
    // Usa el systemPrompt cargado desde el archivo
    const botResponseText = await callGeminiAPI(prompt, systemPrompt);
    const trimmedResponse = botResponseText.replace(/^[\s\n]+/, '');

    if (trimmedResponse.includes('[INICIAR_REGISTRO]')) {
        setSalesStage('recopilar_nombre');
        const cleanResponse = trimmedResponse.replace('[INICIAR_REGISTRO]', '').trim();
        await sendBotMessage(cleanResponse.split('[---]'));
    } else {
        await sendBotMessage(trimmedResponse.split('[---]'));
    }

  };

  useEffect(() => {
    if (errorMessage) {
      // No agregar el mensaje al flujo del chat, solo mostrarlo como alerta
      inputRef.current?.focus(); // Asegurar que el input esté enfocado
    }
  }, [errorMessage]);

  const renderVideo = () => {
    if (isMobile) {
      return (
        <div className="flex items-start gap-3 my-4 justify-start">
          <img
            src={teamAvatarUrl}
            alt="Equipo de Studyx"
            className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
          />
          <div className="px-4 py-3 rounded-2xl bg-gray-200 text-gray-800 rounded-tl-none max-w-lg">
            <video
              className="w-full rounded-xl shadow-lg"
              src={videoUrl}
              controls
              autoPlay
              style={{ background: '#000' }}
            />
          </div>
        </div>
      );
    } else {
      return (
        <iframe
          className={`w-full max-w-2xl aspect-video rounded-xl shadow-lg absolute top-0 left-0 transition-all z-10
            ${videoFade ? 'shrink-fade-left' : 'grow-anim'}`}
          src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
          title="Video sugerido"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ minHeight: 300, background: '#000', transformOrigin: 'left top' }}
        />
      );
    }
  };

  useEffect(() => {
    console.log("Estado de videoUrl:", videoUrl);
    console.log("Estado de videoVisible:", videoVisible);
    console.log("Estado de isMobile:", isMobile);
  }, [videoUrl, videoVisible, isMobile]);

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-col font-sans text-base">
        {showInvoice && <InvoiceModal customerData={customerData} onClose={() => setShowInvoice(false)} />}
      
      <header className="py-4 bg-white shadow-sm flex-shrink-0 z-10">
        <div className="container mx-auto px-6 lg:px-8">
            <img src={studyxLogoUrl} alt="Logo Studyx" className="h-8" />
        </div>
      </header>

      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="container mx-auto h-full principal px-0 sm:px-6 lg:px-8" style={{ padding: isMobile ? '0' : '' }}>
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <div className="hidden lg:flex lg:w-1/2 flex-col justify-center space-y-6 pr-12 p-8">
                <h1 className="text-5xl font-bold text-gray-800 leading-tight title">
                  Tu Futuro Profesional Comienza Hoy
                </h1>
                <p className="text-xl text-gray-600">
                  Accede a todos nuestros cursos obtén las habilidades que el mercado laboral demanda.
                </p>
                <ul className="space-y-3 text-xl">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Profesores expertos 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Clases en vivo todas las semanas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Certificación con validez en USA</span>
                  </li>
                </ul>
                <div className="w-full flex justify-start items-start transition-all duration-500 relative min-h-[300px]">
      {videoUrl && videoVisible && renderVideo()}
      {((!videoUrl || !videoVisible) || videoFade) && (
        <img
          className={`img transition-all duration-1000 opacity-100 w-full max-w-2xl aspect-video rounded-xl shadow-lg relative z-0 ${videoFade ? 'fade-in-img-slow' : ''}`}
          src="plataforma.webp"
          alt="Plataforma Studyx"
          style={{ minHeight: 300, background: '#fff', transformOrigin: 'left top' }}
        />
      )}
    </div>
              </div>

              <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-lg h-full overflow-hidden border border-gray-200">
                <header className="bg-gray-50 border-b p-4 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">Habla con un Asesor</h2>
                </header>
                <main className="flex-1 overflow-y-auto p-4 text-base">
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
                </main>
                <footer className="bg-white border-t p-2 flex-shrink-0">
                    <div className="container mx-auto max-w-3xl">
                        {errorMessage && (
                            <div className="bg-red-100 text-red-700 text-sm p-2 text-center mb-2 rounded">
                                {errorMessage}
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu consulta aquí..." className="flex-1 w-full px-4 py-3 border-2 border-transparent rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-base" disabled={isLoading} />
                            <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"><Send size={20} /></button>
                        </form>
                        <div className="flex justify-center mt-2 py-1">
                            <img src={studyxLogoUrl} alt="Logo Studyx" className="h-5" />
                        </div>
                    </div>
                </footer>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
