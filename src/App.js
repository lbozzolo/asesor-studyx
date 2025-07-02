import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sparkles, X } from 'lucide-react';

// --- URLs de los recursos visuales ---
const teamAvatarUrl = "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1";

// --- Componente para la Factura (Invoice) ---
const InvoiceModal = ({ customerData, onClose }) => {
    if (!customerData) return null;

    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 relative animate-fade-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                
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
                    <thead>
                        <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm">
                            <th className="p-3">Descripción</th>
                            <th className="p-3 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">Suscripción Mensual - Acceso Total Studyx</td>
                            <td className="p-3 text-right">$25.00</td>
                        </tr>
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-full max-w-xs text-right">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-800">$25.00</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-600">Impuestos:</span>
                            <span className="text-gray-800">$0.00</span>
                        </div>
                        <div className="flex justify-between border-t-2 pt-2">
                            <span className="font-bold text-lg text-gray-800">TOTAL PAGADO:</span>
                            <span className="font-bold text-lg text-gray-800">$25.00</span>
                        </div>
                    </div>
                </div>
                 <p className="text-center text-gray-500 text-sm mt-8">Gracias por tu confianza en Studyx!</p>
            </div>
             <style>{`
                 @keyframes fadeIn {
                     from { opacity: 0; transform: scale(0.95); }
                     to { opacity: 1; transform: scale(1); }
                 }
                 .animate-fade-in {
                     animation: fadeIn 0.3s ease-out forwards;
                 }
             `}</style>
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
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex items-start gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <img src={teamAvatarUrl} alt="Equipo de Studyx" className="flex-shrink-0 w-10 h-10 rounded-full object-cover" />
      )}
      <div className={`px-4 py-3 rounded-2xl max-w-lg break-words ${isBot ? 'bg-gray-200 text-gray-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
        {isBot ? renderMessageWithLinks(message.text) : message.text}
      </div>
        {!isBot && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
          <User size={24} />
        </div>
      )}
    </div>
  );
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
  const chatEndRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const inputRef = useRef(null); // Ref para el campo de texto
  
  useEffect(() => {
    const advisorNames = ['Sofía', 'Mateo', 'Valentina', 'Santiago', 'Camila', 'Sebastián'];
    const randomName = advisorNames[Math.floor(Math.random() * advisorNames.length)];
    setAdvisorName(randomName);

    setMessages([
        { 
            role: 'model', 
            text: `Hola! Mi nombre es ${randomName}, del equipo de asesoramiento de Studyx. Como puedo ayudarte?` 
        }
    ]);
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendBotMessage = async (textBlocks) => {
    for (const block of textBlocks) {
        setIsLoading(true);
        const typingDelay = Math.min(500 + (block.length * 50), 2000);
        await new Promise(resolve => setTimeout(resolve, typingDelay));
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'model', text: block }]);
        await new Promise(resolve => setTimeout(resolve, 700));
    }
  }
  
  useEffect(() => {
    scrollToBottom();
    clearTimeout(inactivityTimerRef.current);
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'model' && inactivityPromptCount < 2 && salesStage !== 'finalizado') {
        const timeoutDuration = 120000;
        inactivityTimerRef.current = setTimeout(() => {
            if (inactivityPromptCount === 0) {
                sendBotMessage(["Sigues ahí?"]);
                setInactivityPromptCount(1);
            } else if (inactivityPromptCount === 1) {
                const finalMessage = "Parece que no es un buen momento. No te preocupes! [---] Si quieres continuar la conversación más tarde, puedes escribirme a nuestro WhatsApp 786-916-4372. [---] Que tengas un buen día!";
                sendBotMessage(finalMessage.split('[---]'));
                setInactivityPromptCount(2); 
            }
        }, timeoutDuration);
    }
    return () => clearTimeout(inactivityTimerRef.current);
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    clearTimeout(inactivityTimerRef.current);
    setInactivityPromptCount(0);
    
    // --- LÓGICA DE MÁQUINA DE ESTADOS PARA EL PROCESO DE VENTA ---

    if (salesStage === 'esperando_pago' && (input.toLowerCase().includes('ya pagué') || input.toLowerCase().includes('listo'))) {
        setShowInvoice(true);
        setSalesStage('finalizado');
        const finalMessage = `Excelente! Bienvenido a Studyx. Te he generado tu factura, la cual también recibirás por email. [---] Aquí tienes los datos de contacto para cualquier consulta: Asistencia al Alumno 866-217-7282, WhatsApp 786-916-4372, o email a info@mystudyx.com. Mucho éxito!`;
        await sendBotMessage(finalMessage.split('[---]'));
        return;
    }

    // --- LÓGICA MEJORADA PARA RECOLECCIÓN DE DATOS ---
    if (salesStage.startsWith('recopilar_')) {
        const field = salesStage.split('_')[1];
        const userInputText = userMessage.text;
        const userInputLower = userInputText.toLowerCase();

        // Heurística para detectar si el usuario está preguntando algo en lugar de dar el dato
        const isQuestionOrDeviation = userInputLower.includes('?') || userInputLower.split(' ').length > 8 || ['qué', 'cómo', 'cuánto', 'por', 'dónde', 'cuál', 'pero', 'no quiero'].some(kw => userInputLower.includes(kw));

        // Si NO es una pregunta, procedemos a validar y guardar el dato
        if (!isQuestionOrDeviation) {
            let validationError = null;
            if (field === 'email' && !/\S+@\S+\.\S+/.test(userInputText)) {
                validationError = "Hmm, ese email no parece correcto. Podrías verificarlo por favor?";
            }
            if (field === 'phone' && !/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/.test(userInputText)) {
                validationError = "Ese número de teléfono no parece tener un formato válido de EE.UU. Podrías revisarlo?";
            }

            if (validationError) {
                await sendBotMessage([validationError]);
                return; // Importante: detenemos la ejecución para que no llame a la IA
            }

            const newData = { ...customerData, [field]: userInputText };
            setCustomerData(newData);

            const fields = ['nombre', 'email', 'phone', 'estado'];
            const currentIndex = fields.indexOf(field);

            if (currentIndex < fields.length - 1) {
                const nextField = fields[currentIndex + 1];
                setSalesStage(`recopilar_${nextField}`);
                let question = `Perfecto. Ahora necesito tu ${nextField}, por favor.`;
                if(nextField === 'estado') question = "Entendido. Y en qué estado de los Estados Unidos vives actualmente?";
                await sendBotMessage([question]);
            } else {
                setSalesStage('verificar_datos');
                const finalData = { ...newData, estado: userInputText };
                setCustomerData(finalData);
                const verificationMessage = `Genial, gracias. Antes de crear tu acceso, por favor confirma que estos datos son correctos: [---] Nombre: ${finalData.nombre} [---] Email: ${finalData.email} [---] Teléfono: ${finalData.phone} [---] Estado: ${finalData.estado}. [---] Es todo correcto?`;
                await sendBotMessage(verificationMessage.split('[---]'));
            }
            return; // Importante: detenemos la ejecución aquí
        }
        // Si es una pregunta, no hacemos nada aquí y dejamos que el código continúe hacia la llamada de la IA
    }
    
    if (salesStage === 'verificar_datos') {
        if(userMessage.text.toLowerCase().includes('no')) {
            setSalesStage('recopilar_nombre');
            setCustomerData({});
            await sendBotMessage(["No hay problema, empecemos de nuevo. Cuál es tu nombre completo?"]);
        } else {
            setSalesStage('esperando_pago');
            const finalData = { ...customerData, nombre: customerData.nombre || 'Estudiante' };
            const accessMessage = `Excelente, ${finalData.nombre}! Tu acceso al campus ha sido creado. [---] Puedes ingresar en https://mystudyx.com/campus-virtual con tu email como usuario y la contraseña: Escuela.123 [---] Te recomiendo que entres ahora y explores. Verás que puedes navegar los cursos, pero para ver las clases y hablar con los profesores, necesitas activar tu suscripción. [---] El pago se realiza a través de Stripe, una de las plataformas más seguras del mundo, para tu completa tranquilidad. [---] El último paso para desbloquear todo tu potencial es aquí: https://buy.stripe.com/eVacOw4yzdz553idQR [---] Avísame cuando lo hayas hecho para generar tu factura.`;
            await sendBotMessage(accessMessage.split('[---]'));
        }
        return;
    }

    // --- LLAMADA A LA API DE GEMINI (AHORA MANEJA LAS PREGUNTAS DURANTE LA RECOLECCIÓN) ---
    
    setIsLoading(true);

    try {
        const knowledgeBase = `
            La academia se llama Studyx. La oferta es una suscripción mensual de $25 durante 12 meses. El enlace de pago es: https://buy.stripe.com/eVacOw4yzdz553idQR. El campus virtual es: https://mystudyx.com/campus-virtual. Beneficios: Acceso a TODOS los cursos, profesor online 24/7, clases en vivo semanales. Cursos: Real Estate, Plomería, Inglés, Diseño de Espacios, Paisajismo, Fotografía, Cuidado de Adultos Mayores. Canales de Atención al Cliente (SOLO para después de la venta o si no puedes resolver): Asistencia al Alumno (Teléfono): 866-217-7282, WhatsApp Oficial: 786-916-4372, Email General: info@mystudyx.com, Email para Tutores: studyxtutorias@gmail.com. *Opción de pago Zelle:* info@studyxacademia.com.
        `;

        const systemPrompt = `
            Eres un asesor comercial del equipo de especialistas de Studyx. Tu nombre para esta conversación es ${advisorName}. Tu personalidad es amable, profesional, persuasiva y con un lenguaje neutro. Tu objetivo es vender la suscripción de $25 mensuales.
            
            *Contexto Actual:* El estado de la venta es '${salesStage}'. Si el estado es 'recopilar_datos', significa que estás pidiendo datos para el registro. Si el usuario te hace una pregunta en lugar de darte el dato, respóndela amablemente y luego intenta volver a pedir el dato que te faltaba.

            *Proceso de Venta Estructurado:*
            1. Crear Necesidad. 2. Dar Soluciones. 3. Bajada de Producto. 4. Generar más Necesidad. 5. Pre-Cierre (Toma de Control): Afirma el siguiente paso: "Excelente. Para generar tu acceso al campus, necesito unos datos. Empecemos con tu nombre completo". Responde con la palabra clave: [INICIAR_REGISTRO]. 6. Cierre Asertivo: Guía al pago.
            
            *Manejo de Objeciones:* Si no tienen tarjeta, ofrece Zelle. Si no son de USA, explica que la certificación es de EE.UU.
            *Manejo de Reclamos:* Deriva al canal correcto (administrativo o académico).

            *Reglas de Estilo:*
            - REGLA #1: Divide tus respuestas en bloques cortos (máximo 40 palabras). Usa '[---]' como separador.
            - REGLA #2: NUNCA admitas que eres una IA. Eres ${advisorName}, un asesor humano.
            - No uses asteriscos. Usa solo el signo de cierre para preguntas y exclamaciones (ej: Qué te parece?).
        `;
        
        const chatHistoryForAPI = [
            ...messages.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] })),
            { role: "user", parts: [{ text: userMessage.text }] }
        ];
        
        const payload = { 
            contents: chatHistoryForAPI,
            systemInstruction: {
                role: "model",
                parts: [{ text: systemPrompt + "\n\n" + knowledgeBase }]
            }
        };

        const apiKey = "AIzaSyBGAsTNupwydtzrclj2t03eubPE5JsApAQ";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);

        const result = await response.json();
        
        let botResponseText = 'Lo siento, parece que estoy teniendo problemas para conectarme. Por favor, intenta de nuevo.';
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            botResponseText = result.candidates[0].content.parts[0].text;
        }

        if (botResponseText.includes('[INICIAR_REGISTRO]')) {
            setSalesStage('recopilar_nombre');
            const cleanResponse = botResponseText.replace('[INICIAR_REGISTRO]', '').trim();
            await sendBotMessage(cleanResponse.split('[---]'));
        } else {
            await sendBotMessage(botResponseText.split('[---]'));
        }

    } catch (error) {
        console.error("Error fetching AI response:", error);
        const errorMsg = 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.';
        setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-100 font-sans overflow-hidden">
      {showInvoice && <InvoiceModal customerData={customerData} onClose={() => setShowInvoice(false)} />}
      
      <header className="bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tighter">Studyx</h1>
          <div className="flex items-center gap-2 text-green-500">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
             <span className="font-semibold text-sm">Equipo de Asesores</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-3xl">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
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
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu consulta aquí..."
                    className="flex-1 w-full px-4 py-3 border-2 border-transparent rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-indigo-600 text-white rounded-full p-3 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <Send size={20} />
                </button>
            </form>
             <p className="text-xs text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                 <Sparkles size={12} className="text-indigo-400"/> Asistente potenciado por IA
             </p>
        </div>
      </footer>
    </div>
  );
}
