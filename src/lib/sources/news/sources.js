export const TRUSTED_NEWS_SOURCES = [
  { id: 'bbc',      name: 'BBC Brasil',             domain: 'bbc.com/portuguese',       searchUrl: (q) => `https://www.bbc.com/portuguese/search?q=${encodeURIComponent(q)}` },
  { id: 'onu',      name: 'ONU Brasil',             domain: 'onubr.org.br',             searchUrl: (q) => `https://brasil.un.org/pt-br/search/${encodeURIComponent(q)}` },
  { id: 'natgeo',   name: 'National Geographic BR', domain: 'nationalgeographicbrasil.com', searchUrl: (q) => `https://www.nationalgeographicbrasil.com/search?q=${encodeURIComponent(q)}` },
  { id: 'canaltech',name: 'Canaltech',              domain: 'canaltech.com.br',         searchUrl: (q) => `https://canaltech.com.br/busca/?q=${encodeURIComponent(q)}` },
  { id: 'olhar',    name: 'Olhar Digital',          domain: 'olhardigital.com.br',      searchUrl: (q) => `https://olhardigital.com.br/?s=${encodeURIComponent(q)}` },
  { id: 'novaescola', name: 'Nova Escola',          domain: 'novaescola.org.br',        searchUrl: (q) => `https://novaescola.org.br/busca#busca=${encodeURIComponent(q)}` },
  { id: 'porvir',   name: 'Porvir',                 domain: 'porvir.org',               searchUrl: (q) => `https://porvir.org/?s=${encodeURIComponent(q)}` },
  { id: 'infomoney',name: 'InfoMoney',              domain: 'infomoney.com.br',         searchUrl: (q) => `https://www.infomoney.com.br/busca/?q=${encodeURIComponent(q)}` },
  { id: 'valor',    name: 'Valor Econômico',        domain: 'valor.globo.com',          searchUrl: (q) => `https://valor.globo.com/busca?q=${encodeURIComponent(q)}` },
]

export function getNewsSearchLinks(topic) {
  return TRUSTED_NEWS_SOURCES.map((source) => ({
    ...source,
    link: source.searchUrl(topic)
  }))
}
