# Infância do GPT 🎮

> **Nível 0 (Tutorial)** - Uma experiência de física interativa inspirada na estética de colagem e giz

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Matter.js](https://img.shields.io/badge/Matter.js-000000?style=for-the-badge&logo=matter.js&logoColor=white)](https://brm.io/matter-js/)

## 🎯 Sobre o Projeto

**Infância do GPT** é um jogo de física 2D que combina mecânicas simples com uma estética visual única inspirada em colagens e desenhos a giz. O objetivo é guiar uma bola laranja até um balde usando uma rampa, explorando os princípios básicos da física através de uma interface intuitiva e visualmente atrativa.

### ✨ Características

- **Física Realista**: Motor de física Matter.js para simulações precisas
- **Estética Única**: Visual inspirado em colagem com paleta de cores pastel
- **Interface Intuitiva**: Controles simples de arrastar e soltar
- **Sistema de Rotação**: Controles Q/E para ajustar ângulos com snap opcional
- **Feedback Visual**: Dicas contextuais e animações suaves
- **Responsivo**: Design adaptável para diferentes tamanhos de tela

## 🎮 Como Jogar

### Objetivo
Faça a **bola laranja** cair dentro do **balde** usando a **rampa** disponível.

### Controles
- **Arrastar**: Pegue a rampa da caixa de ferramentas e posicione-a no campo
- **Rotacionar**: Use `Q` e `E` para ajustar o ângulo da rampa
- **Snap**: Segure `Shift` + `Q`/`E` para rotação em incrementos de 15°
- **Play**: Inicia a simulação física
- **Reset**: Recarrega o nível

### Dicas
1. Posicione a rampa estrategicamente para guiar a bola
2. Use a rotação para ajustar o ângulo de lançamento
3. Experimente diferentes posições e ângulos
4. Observe como a física afeta o movimento da bola

## 🛠️ Tecnologias Utilizadas

- **HTML5 Canvas**: Renderização 2D personalizada
- **Matter.js**: Motor de física JavaScript
- **CSS3**: Estilização moderna com variáveis CSS
- **JavaScript ES6+**: Lógica do jogo e interações
- **Google Fonts**: Tipografia Lora para estética elegante

## 🎨 Paleta de Cores

```css
--paper: #f1e9d6      /* Papel base */
--turquoise: #20b2aa  /* Acentos */
--orange: #f3852e     /* Giz laranja */
--brown: #8a5a3b      /* Couro/marrom */
--ink: #2a2a2a        /* Texto */
```

## 🚀 Como Executar

1. **Clone o repositório**
   ```bash
   git clone https://github.com/linalopes/maquina-gepeto.git
   cd maquina-gepeto
   ```

2. **Abra o arquivo**
   ```bash
   open index.html
   ```
   Ou simplesmente abra `index.html` em qualquer navegador moderno.

3. **Divirta-se!**
   - Arraste a rampa para o campo
   - Ajuste o ângulo com Q/E
   - Clique em Play e observe a física em ação

## 📁 Estrutura do Projeto

```
maquina-gepeto/
├── index.html          # Arquivo principal do jogo
├── background.png      # Textura de fundo (papel amassado)
├── bucket.png          # Sprite do balde
├── diary_icon.png      # Ícone do menu
├── play_icon.png       # Ícone de play
├── shelf.png           # Textura da prateleira
└── README.md           # Este arquivo
```

## 🔧 Funcionalidades Técnicas

### Sistema de Física
- **Gravidade**: Simulação realista da gravidade
- **Colisões**: Detecção precisa de colisões entre objetos
- **Fricção**: Resistência ao movimento para realismo
- **Restituição**: Bounce realista da bola

### Sistema de Renderização
- **Canvas 2D**: Renderização customizada para controle total
- **Sprites**: Integração de imagens com física
- **Animações**: Loop de renderização suave a 60fps
- **Efeitos Visuais**: Texturas, sombras e gradientes

### Interface do Usuário
- **Drag & Drop**: Sistema intuitivo de arrastar e soltar
- **Feedback Visual**: Dicas contextuais e estados visuais
- **Controles de Teclado**: Atalhos para rotação
- **Responsividade**: Adaptação a diferentes tamanhos de tela

## 🎯 Roadmap

- [ ] **Níveis Adicionais**: Mais desafios com diferentes mecânicas
- [ ] **Sistema de Pontuação**: Ranking e tempo de conclusão
- [ ] **Efeitos Sonoros**: Audio feedback para ações
- [ ] **Modo Mobile**: Otimizações para dispositivos móveis
- [ ] **Editor de Níveis**: Ferramenta para criar níveis customizados

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tem ideias para melhorar o jogo:

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

- **Matter.js** - Motor de física incrível
- **Google Fonts** - Tipografia Lora
- **Comunidade Open Source** - Inspiração e recursos

---

<div align="center">
  <p><strong>Feito com ❤️ e muita física!</strong></p>
  <p>Se gostou do projeto, considere dar uma ⭐</p>
</div>
