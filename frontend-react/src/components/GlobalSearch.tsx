import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Loader2, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fermer les résultats si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Débounce pour éviter trop de requêtes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        handleSearch();
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    setShowResults(true);
    try {
      const res = await api.get(`/api/search/fulltext?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error("Erreur recherche", err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 FONCTION CORRIGÉE POUR LE SURLIGNAGE 👇
  const handleResultClick = (res: any) => {
    // Vérification de sécurité
    if (!res.fichier_path) {
      alert("Ce rapport n'a pas de fichier associé ou c'est un ancien rapport.");
      return;
    }

    // 1. On récupère le nom du fichier propre
    const filename = res.fichier_path.split(/[/\\]/).pop();

    if (!filename) return;

    // 2. On nettoie le mot clé (ex: "Machine Learning" -> "Machine%20Learning")
    const cleanQuery = encodeURIComponent(query.trim());

    // 3. Construction de l'URL avec le paramètre #search
    // C'est ce paramètre qui dit à Chrome/Edge de surligner le mot
    const pdfUrl = `http://localhost:5000/uploads/${filename}#search="${cleanQuery}"`;

    // 4. Ouverture
    window.open(pdfUrl, '_blank');
    
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher un concept (ex: SVM, UML, Java...)"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if(results.length > 0) setShowResults(true); }}
        />
        {loading && <Loader2 className="absolute right-4 top-3 h-5 w-5 animate-spin text-blue-500" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Résultats trouvés ({results.length})
              </h3>
              {results.map((res) => (
                <div 
                    key={res.id_rapport} 
                    onClick={() => handleResultClick(res)}
                    className="group flex flex-col gap-1 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border-b last:border-0 border-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 truncate text-sm">{res.titre}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 pl-6 leading-relaxed">
                    ...{res.extrait}...
                  </p>
                </div>
              ))}
            </div>
        </div>
      )}
      
      {showResults && results.length === 0 && query.length > 2 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-50 p-4 text-center text-gray-500 text-sm">
            Aucun document ne contient "{query}".
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;