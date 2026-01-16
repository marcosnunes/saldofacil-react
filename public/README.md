# Pasta Public - Favicon

## Como usar seu próprio favicon

Esta pasta é servida estaticamente pelo Vite. O arquivo `favicon.svg` é o ícone do app.

### Opções:

#### 1. **Usar um arquivo SVG** (Recomendado)
- Substitua o arquivo `favicon.svg` com seu próprio SVG
- SVGs escalam perfeitamente em todos os tamanhos
- Menor tamanho de arquivo

#### 2. **Usar um arquivo PNG/ICO**
- Coloque seu arquivo `favicon.ico` ou `favicon.png` aqui
- Atualize o `index.html` para:
  ```html
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <!-- ou -->
  <link rel="icon" href="/favicon.png" type="image/png" />
  ```

#### 3. **Usar múltiplas resoluções**
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="icon" sizes="192x192" href="/favicon-192.png" />
```

### Gerador de Favicon online:
Você pode usar ferramentas como:
- https://favicon.io
- https://convertio.co/favicon-converter/
- https://www.favicon-generator.com/

Basta converter seu arquivo e colocar na pasta `public/`.

## Estrutura esperada
```
public/
├── favicon.svg         (arquivo principal)
├── favicon.ico         (opcional, fallback)
└── apple-touch-icon.png (opcional, para iOS)
```
