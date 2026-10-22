# Rota Raiz — Litoral Sul da Bahia

App de transporte regional raiz (vans, ônibus, balsas, canoas e trilhas) e passeios no **Litoral Sul da Bahia** (Porto Seguro, Arraial d'Ajuda, Trancoso, Caraíva, Praia do Espelho / Curuípe e Ponta do Corumbau).

Criado para ser utilizado em **viagens reais de campo**: dados autênticos, funcionamento offline sem sinal de celular, algoritmo de rotas em grafo (Dijkstra) e área de verificação colaborativa de horários.

---

## 🧭 Funcionalidades Principais

1. **Roteador Multimodal em Grafo (Dijkstra)**
   - Modela a malha de transporte da região como um **grafo direcionado** com nós (paradas/terminais) e arestas (trechos reais operados por cooperativas, balsas e canoeiros).
   - Calcula automaticamente as opções:
     - **Mais Rápida**: menor tempo cumulativo de viagem.
     - **Mais Econômica**: menor custo total em reais.
   - Detalha baldeação a baldeação: ponto de embarque, ponto de desembarque, frequências, tarifas estimadas e formas de pagamento aceitas (dinheiro vivo, Pix).
   - Se uma rota não existe, o app informa com honestidade *"Ainda não temos essa rota cadastrada"* — **nunca inventa dados fictícios**.

2. **Design 100% Responsivo & Ícones Nativos SVG**
   - Adaptado para qualquer tela (mobile com bottom navigation de 3 abas principais: **Rotas**, **Mapa**, **Passeios**; desktop com sidebar lateral retrátil).
   - Zero dependência de fontes externas instáveis: todos os ícones usam componentes SVG embutidos (`lucide-react`).
   - Todos os botões e áreas de toque com no mínimo `44px` para uso em movimento ou com chuva.

3. **Mapa Interativo Aberto (Leaflet + OpenStreetMap)**
   - Não depende da API paga do Google Maps nem de chaves secretas.
   - **Quadrados terracota**: paradas de balsa, vans e ônibus.
   - **Círculos verdes**: praias, trilhas e atrativos naturais.
   - **Marcador azul pulsante**: GPS em tempo real do usuário (*"Você está aqui"*).
   - Ao clicar em *"Ver no Mapa"*, o itinerário traça a linha conectando as etapas de transporte e enquadra o zoom automaticamente.

4. **Tábua de Marés & Alertas de Viagem**
   - Alertas visuais para atrativos que dependem de maré baixa (como as piscinas da **Praia do Espelho** e a ponta de areia do **Corumbau**).
   - Avisos sobre o último transporte do dia (ex.: último ônibus da Águia Azul para Caraíva às **15:45** e última van do Espelho às **16:20**).

5. **Painel do Viajante & Admin (`/admin`)**
   - Protegido por PIN configurável (`raiz2025`).
   - Permite ao viajante ou moderador marcar qualquer trecho com o botão **"Confirmado hoje"** para atestar horários e tarifas verificados no local.
   - Formulário para cadastrar novos trechos, editar preços e exportar backup completo do banco de dados em JSON.

6. **PWA (Progressive Web App) & Offline-First**
   - Instalável na tela inicial do celular como app nativo (Android e iOS).
   - Cache de dados local (`localStorage` + `Service Worker`): você pode consultar roteiros salvos no meio da estrada de terra sem sinal 4G.

---

## 🛠️ Stack Tecnológica

- **Front-end**: React 19 + Vite
- **Estilização**: TailwindCSS v4 + CSS Tokens customizados (paleta areia `#F4EDE0`, terracota `#C2461F`, verde mata `#2F5D3A`, amarelo ouro `#E9B62F`)
- **Tipografia**: Bricolage Grotesque (títulos) + DM Sans (corpo)
- **Mapas**: Leaflet 1.9 + React-Leaflet 5 + OpenStreetMap tiles
- **Ícones**: Lucide React (SVGs puros sem fonte externa)
- **Backend / Persistência**: Supabase (PostgreSQL) com fallback automático para Local-First offline

---

## 🚀 Como Rodar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone <url-do-repositorio>
cd rotaraiz
npm install
```

### 2. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
O app estará rodando em `http://localhost:5001/` (porta padrão estrita).

### 3. Build de Produção
```bash
npm run build
npm run preview
```

---

## 🗄️ Integração com Supabase (Opcional)

O app funciona perfeitamente **mesmo sem Supabase configurado** (utilizando o banco de dados embutido em `src/data/seedData.js` e cache local).

Para conectar com um banco Supabase em nuvem:

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** do projeto e execute todo o conteúdo do arquivo [`supabase_schema.sql`](file:///c:/Users/lorra/OneDrive/Aplicativos/rotaraiz/supabase_schema.sql).
3. Crie um arquivo `.env.local` na raiz com as chaves do seu projeto:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
VITE_ADMIN_PIN=raiz2025
```
4. Reinicie o servidor (`npm run dev`). O indicador de dados na barra lateral passará a exibir **"Supabase"**.

---

## 🔒 Área Administrativa

- Acesso pelo menu lateral ou pela aba **"Área do Administrador"**.
- PIN padrão de fábrica: **`raiz2025`** (ou `1234`).
- No painel é possível:
  - Verificar trechos e atualizar horários direto do celular durante a viagem.
  - Adicionar novas linhas de van ou cooperativas.
  - Exportar arquivo de backup em JSON.

---

## 🌴 Localidades Cobertas

- **Porto Seguro** (Centro, Terminal de Balsas, Reserva Pataxó da Jaqueira)
- **Arraial d'Ajuda** (Atracadouro das Balsas, Praça São Brás, Estrada Velha)
- **Praia de Taípe** (Falésias e Lagoa)
- **Trancoso** (Trevo da Independência e Quadrado Histórico)
- **Praia do Espelho / Curuípe** (Vila de Curuípe e piscinas naturais)
- **Caraíva** (Nova Caraíva, Travessia dos Canoeiros Pataxó e Vila de Areia)
- **Ponta do Corumbau** (Península de areia e Reserva Marinha)
- **Santa Cruz Cabrália** (BR-367 e Coroa Vermelha)
