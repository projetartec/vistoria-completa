// Define um nome e versão para o cache. Mudar a versão invalida o cache antigo.
const CACHE_NAME = 'firecheck-brazil-cache-v1';

// Lista de URLs essenciais para o funcionamento offline do app (app shell).
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/globals.css',
  // Adicione aqui outros assets estáticos importantes se necessário, como o logo.
  '/LOGO-BRAZIL-FUNDOTRANSP.png'
];

// Evento de Instalação: Ocorre quando o Service Worker é instalado pela primeira vez.
self.addEventListener('install', (event) => {
  // O Service Worker espera até que o cache seja preenchido com os arquivos essenciais.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto. Adicionando URLs ao cache.');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Falha ao adicionar URLs ao cache durante a instalação.', err);
      })
  );
  // Força o novo Service Worker a se tornar ativo imediatamente.
  self.skipWaiting();
});

// Evento de Ativação: Ocorre quando o novo Service Worker é ativado.
// É aqui que limpamos os caches antigos.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Se o nome do cache não for o atual, ele é deletado.
          // Isso garante que a versão antiga do app seja removida.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Garante que o Service Worker ativado tome controle da página imediatamente.
  return self.clients.claim();
});

// Evento de Fetch: Intercepta todas as requisições de rede da página.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são do tipo GET.
  if (event.request.method !== 'GET') {
    return;
  }

  // Estratégia: Network First, com fallback para o Cache.
  // Tenta buscar da rede primeiro para obter os dados mais recentes.
  // Se a rede falhar (offline), serve a partir do cache.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a requisição foi bem-sucedida, clona a resposta para o cache.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            // O cache é atualizado com a nova versão da rede.
            cache.put(event.request, responseToCache);
          });
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhou, tenta servir a partir do cache.
        console.log('Rede falhou. Servindo do cache para:', event.request.url);
        return caches.match(event.request)
          .then((cachedResponse) => {
            // Se houver uma resposta no cache, retorna ela.
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se não houver nada na rede nem no cache, pode-se retornar uma página de fallback offline.
            // Para este caso, apenas deixamos o erro padrão do navegador ocorrer.
          });
      })
  );
});
