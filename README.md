# Infância do GPT 🎮

> **Interface web interativa** inspirada em The Incredible Machine com estética de colagem e giz

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🎯 Sobre o Projeto

**Infância do GPT** é uma interface web interativa que combina a estética artesanal de colagem e giz com a mecânica de construção de máquinas do clássico jogo *The Incredible Machine*. O projeto permite aos usuários montar e experimentar com máquinas interativas através de uma interface intuitiva e visualmente atrativa.

### ✨ Características Visuais

- **Estética Única**: Design inspirado em colagem com paleta de cores pastel
- **Tipografia Elegante**: Fonte Lora para uma aparência sofisticada
- **Interface Intuitiva**: Layout limpo e organizado em formato paisagem
- **Responsividade**: Adaptação automática para diferentes tamanhos de tela
- **Animações Suaves**: Transições e efeitos visuais cuidadosamente elaborados

## 🎮 Estado Atual

O projeto já possui uma interface funcional com:

### **Cabeçalho**
- Título principal "The Machine's Gepeto"
- Design minimalista com linha de destaque laranja

### **Painel de Máquinas**
- Grid 2×3 com seis slots clicáveis para máquinas
- Botões numerados de 1 a 6
- Efeitos visuais de hover e foco
- Preparado para futuras implementações de máquinas

### **Barra Lateral**
- Três ícones interativos com modais informativos:
  - **Tutorial** 📖 - Guia de uso da interface
  - **Autores** 💡 - Informações sobre a equipe
  - **Livro** ✏️ - Documentação e referências

### **Sistema de Modais**
- Janelas grandes e informativas
- Fechamento por tecla Escape ou clique no fundo
- Acessibilidade completa com navegação por teclado

### **Responsividade**
- **Formato Paisagem**: Interface otimizada para telas horizontais
- **Formato Retrato**: Sobreposição educativa pedindo rotação do dispositivo
- **Animações**: Ícone de dispositivo girando para orientar o usuário

## 🚀 Próximos Passos

### **1. Tutorial da Interface**
- Desenvolver guia interativo mostrando como usar a toolbox
- Explicar sistema de interação e construção de máquinas
- Implementar tour guiado para novos usuários

### **2. Primeira Máquina: Rampa Musical**
- Implementar sistema onde bolinha descendo por rampas produz sons
- Integrar biblioteca de áudio para feedback sonoro
- Criar mecânica de diferentes tipos de rampa com sons únicos

### **3. Toolbox de Elementos Mecânicos**
Definir e implementar elementos interativos:
- **Rampa** - Superfícies inclinadas para movimento
- **Gangorra** - Alavancas balanceadas
- **Balança** - Sistema de pesos e contrapesos
- **Elástico** - Elementos com propriedades elásticas
- **Pinça** - Ferramentas de manipulação
- **Alavanca** - Mecanismos de força
- **Roda** - Elementos rotativos
- **Tubo** - Condutos para passagem de objetos
- **Pistão** - Mecanismos de pressão

### **4. Integração Planck.js**
- Substituir simulações estáticas por física realista
- Implementar colisões, gravidade e forças
- Criar sistema de simulação em tempo real

## 🛠️ Tecnologias Utilizadas

### **Atuais**
- **HTML5** - Estrutura semântica e acessível
- **CSS3** - Estilização moderna com Grid e Flexbox
- **JavaScript (Vanilla)** - Lógica de interação sem dependências
- **Google Fonts (Lora)** - Tipografia elegante

### **Futuras**
- **Planck.js** - Motor de física 2D para simulações realistas
- **Web Audio API** - Sistema de áudio para feedback sonoro
- **Canvas API** - Renderização avançada de elementos gráficos

## 🎨 Paleta de Cores

```css
--paper: #f1e9d6      /* Papel base */
--turquoise: #20b2aa  /* Acentos */
--orange: #f3852e     /* Giz laranja */
--brown: #8a5a3b      /* Couro/marrom */
--ink: #2a2a2a        /* Texto */
```

## 🚀 Como Executar

### **Pré-requisitos**
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexão com internet (para Google Fonts)

### **Instalação**
1. **Clone o repositório**
   ```bash
   git clone https://github.com/linalopes/maquina-gepeto.git
   cd maquina-gepeto
   ```

2. **Abra o arquivo**
   ```bash
   open index.html
   ```
   Ou simplesmente abra `index.html` em qualquer navegador.

3. **Divirta-se!**
   - Explore a interface
   - Teste os modais informativos
   - Experimente a responsividade

## 📁 Estrutura do Projeto

```
maquina-gepeto/
├── SVG/                # Ícones vetoriais
│   ├── circle1.svg     # Círculo variação 1
│   ├── circle2.svg     # Círculo variação 2
│   ├── circle3.svg     # Círculo variação 3
│   ├── diary.svg       # Ícone do tutorial
│   ├── lamp.svg        # Ícone dos autores
│   ├── pen.svg         # Ícone do livro
│   ├── Reference.svg   # Referência de interface
│   ├── square1.svg     # Quadrado variação 1
│   ├── square2.svg     # Quadrado variação 2
│   └── square3.svg     # Quadrado variação 3
├── version-matter-1/   # Versão com Matter.js
│   ├── index.html      # Interface do nível
│   ├── styles.css      # Estilos específicos
│   └── background.png  # Textura de fundo
├── index.html          # Interface principal
├── styles.css          # Estilos globais
└── README.md           # Este arquivo
```

## 🎯 Funcionalidades Técnicas

### **Sistema de Layout**
- **CSS Grid** para layout principal (duas colunas)
- **Flexbox** para alinhamento de componentes
- **Media Queries** para responsividade
- **CSS Variables** para consistência de cores

### **Interatividade**
- **Event Listeners** para todos os elementos clicáveis
- **Modal System** com gerenciamento de foco
- **Keyboard Navigation** para acessibilidade
- **Orientation Detection** para experiência mobile

### **Acessibilidade**
- **ARIA Labels** para leitores de tela
- **Focus Management** em modais
- **Keyboard Shortcuts** (Escape para fechar)
- **High Contrast** para melhor visibilidade

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tem ideias para melhorar o projeto:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Lina Lopes**
- GitHub: [@linalopes](https://github.com/linalopes)
- Projeto: [maquina-gepeto](https://github.com/linalopes/maquina-gepeto)

## 🙏 Agradecimentos

- **The Incredible Machine** - Inspiração para a mecânica de jogo
- **Google Fonts** - Tipografia Lora
- **Comunidade Open Source** - Recursos e inspiração

---

<div align="center">
  <p><strong>Feito com ❤️ e muita criatividade!</strong></p>
  <p>Se gostou do projeto, considere dar uma ⭐</p>
</div>
