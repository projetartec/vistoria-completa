
// public/sw.js
const CACHE_NAME = 'firecheck-brazil-cache-v1';
// Adicione caminhos para os assets que devem ser cacheados.
// Para uma exportação estática do Next.js, isso incluiria:
// - Os arquivos HTML raiz para cada página (ex: '/', '/about/index.html')
// - Chunks JS/CSS do diretório _next/static
// - manifest.json, ícones e quaisquer outros assets públicos chave
const PRECACHE_ASSETS = [
  '/', // A raiz do app
  '/manifest.json',
  // O usuário deve adicionar seus ícones reais aqui. Exemplo:
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png',
  '/brazil-extintores-logo.png', // Da pasta public, usado no AppHeader
  // Outros assets importantes da pasta public podem ser adicionados aqui.
  // ATENÇÃO: Arquivos gerados pelo Next.js em _next/static têm hashes em seus nomes
  // e são melhor gerenciados por bibliotecas como next-pwa ou Workbox para um cache robusto.
  // Este service worker básico é um ponto de partida.
];

// No install, cacheia os assets predefinidos
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      // Filtra para evitar erros com URLs que podem não existir (como ícones ainda não adicionados)
      const existingAssetsToCache = PRECACHE_ASSETS.filter(url => {
        // Uma verificação simples; idealmente, você teria uma lista precisa de assets do build.
        // Para este exemplo, apenas garantimos que não estamos tentando cachear caminhos de ícones inexistentes explicitamente.
        if (url.startsWith('/icons/')) return false; // Não pré-cacheia ícones específicos aqui, o usuário os adicionará.
        return true;
      });
      await cache.addAll(existingAssetsToCache);
      console.log('Service Worker: Assets pré-cacheados com sucesso (exceto ícones a serem adicionados pelo usuário)');
    } catch (error) {
      console.error('Service Worker: Falha no pré-cache:', error);
    }
  })());
});

// No activate, limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }
      })
    );
    self.clients.claim(); // Torna o service worker ativo o controlador para todos os clientes imediatamente.
    console.log('Service Worker: Ativado e caches antigos limpos');
  })());
});

// No fetch, serve do cache primeiro, depois da rede
self.addEventListener('fetch', (event) => {
  // Pula requisições não-GET e requisições para extensões do Chrome
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Estratégia: Cache first, fallback to network
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.status === 200) {
        // Clona a resposta para poder ser usada pelo browser e pelo cache
        await cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.warn('Service Worker: Requisição de rede falhou, servindo fallback ou erro:', event.request.url, error);
      // Opcional: servir uma página offline para requisições de navegação
      // if (event.request.mode === 'navigate') {
      //   const offlinePage = await cache.match('/offline.html'); // Você precisaria de um offline.html
      //   if (offlinePage) return offlinePage;
      // }
      // Para outros assets, apenas permite que o navegador lide com o erro ou retorna um erro específico
      return new Response(JSON.stringify({ error: "Network error and no cache match" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  })());
});
