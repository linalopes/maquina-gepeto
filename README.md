# Infância do GPT — Nível 0 (Tutorial)

A physics-based puzzle game built with HTML5 Canvas and Matter.js, featuring a charming collage aesthetic with chalk and paper textures.

## 🎮 Game Description

"Infância do GPT" (GPT's Childhood) is a physics puzzle game where players must guide a ball into a bucket using a ramp. The game features a nostalgic, hand-crafted aesthetic reminiscent of childhood art projects.

## 🎯 Objective

Make the **Ball** fall into the **Bucket** using the **Ramp** tool.

## 🎮 How to Play

1. **Drag** the Ramp from the toolbox to the playing field
2. **Rotate** the ramp using `Q`/`E` keys (hold `Shift` for 15° snap rotation)
3. Click **Play** to start the physics simulation
4. Use **Reset** to try again

## 🛠️ Controls

- **Mouse**: Drag ramp from toolbox to field
- **Q/E**: Rotate selected ramp (hold Shift for snap rotation)
- **Play**: Start physics simulation
- **Reset**: Restart the level

## 🎨 Features

- **Physics Engine**: Matter.js for realistic physics simulation
- **Custom Rendering**: Hand-drawn aesthetic with Canvas 2D
- **Collage Style**: Chalk, paper, and wood textures
- **Responsive Design**: Clean, modern interface
- **Portuguese Interface**: Full localization in Brazilian Portuguese

## 🎨 Visual Style

- **Colors**: Paper white, turquoise, orange chalk, brown leather
- **Typography**: Lora serif font
- **Textures**: Hand-drawn collage elements
- **Aesthetic**: Childhood art project nostalgia

## 🚀 Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Start playing!

## 📁 Project Structure

```
maquina-gepeto/
├── index.html          # Main game file
├── background.png      # Paper texture background
├── bucket.png          # Bucket sprite
├── diary_icon.png      # Menu icon
├── play_icon.png       # Play button icon
├── shelf.png           # Shelf sprite
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🛠️ Technical Details

- **Physics**: Matter.js 0.19.0
- **Rendering**: HTML5 Canvas 2D
- **Fonts**: Google Fonts (Lora)
- **Browser Support**: Modern browsers with Canvas and ES6 support

## 🎯 Game Mechanics

- **Physics Simulation**: Realistic ball physics with gravity, friction, and collision detection
- **Tool System**: Drag-and-drop ramp placement
- **Win Condition**: Ball must rest in bucket with low velocity
- **Timer**: Track completion time
- **Attempt Counter**: Count number of tries

## 📝 Development Notes

This is a single-file HTML game with embedded CSS and JavaScript. The physics simulation only runs when the "Play" button is pressed, allowing players to position elements before starting.

## 🎨 Art Credits

- Background texture: Hand-crafted paper texture
- Icons: Custom designed for the game
- Color palette: Inspired by childhood art supplies

---

*Built with ❤️ and a touch of nostalgia*
