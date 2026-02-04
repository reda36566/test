import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

// Définition des types pour TypeScript
interface Message {
  sender: 'bot' | 'user';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Bonjour ! Je suis l\'assistant IA. Posez-moi une question sur les rapports.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Pour récupérer le nom de l'utilisateur si besoin (optionnel)
  const { user } = useAuth();

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    // Ajout du message utilisateur
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // On appelle ton backend
      const res = await axios.post('http://127.0.0.1:5000/api/chatbot', { question: userMsg });
      
      // Ajout de la réponse du bot
      setMessages(prev => [...prev, { sender: 'bot', text: res.data.reponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Désolé, je n'arrive pas à joindre le cerveau de l'IA pour le moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') sendMessage();
  };

  // ✅ COULEURS EXACTES DU THÈME (Extraites de ton CSS)
  // --sidebar-background: 24 100% 31%
  const THEME_COLOR = 'hsl(24, 100%, 31%)'; 
  
  // Dégradé utilisant --sidebar-background vers --sidebar-accent (24 100% 24%)
  const THEME_GRADIENT = 'linear-gradient(135deg, hsl(24, 100%, 31%) 0%, hsl(24, 100%, 24%) 100%)';

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Bouton Flottant (Launcher) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: THEME_GRADIENT,
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(153, 46, 0, 0.4)', // Ombre adaptée à l'orange
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      )}

      {/* Fenêtre de Chat */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '380px',
          height: '600px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #f3f4f6',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          
          {/* En-tête avec dégradé Orange */}
          <div style={{ 
            background: THEME_GRADIENT, 
            color: 'white', 
            padding: '20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
                 {/* Icône Bot */}
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Assistant PFE</h3>
                <span style={{ fontSize: '12px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>
                  En ligne
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Zone des messages */}
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto', 
            backgroundColor: '#f8fafc', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '15px' 
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                  // Utilisation de la couleur Orange pour l'utilisateur aussi
                  backgroundColor: msg.sender === 'user' ? THEME_COLOR : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', margin: '0 4px' }}>
                  {msg.sender === 'user' ? 'Vous' : 'IA'}
                </span>
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'white', padding: '10px 15px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1s infinite' }}></span>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', backgroundColor: '#cbd5e1', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Posez votre question..."
              style={{ 
                flex: 1, 
                padding: '12px 16px', 
                borderRadius: '24px', 
                border: '1px solid #e2e8f0', 
                outline: 'none', 
                fontSize: '14px',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = THEME_COLOR}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <button 
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{ 
                backgroundColor: input.trim() ? THEME_COLOR : '#cbd5e1', 
                color: 'white', 
                border: 'none', 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;