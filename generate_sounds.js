const fs = require('fs');
const path = require('path');

const sounds = [
    'click.mp3',
    'upgrade.mp3',
    'achievement.mp3',
    'influence.mp3',
    'control.mp3',
    'gameover.mp3',
    'start.mp3'
];

const soundsDir = path.join(__dirname, 'sounds');

// Create empty sound files
sounds.forEach(sound => {
    const filePath = path.join(soundsDir, sound);
    fs.writeFileSync(filePath, '');
    console.log(`Created placeholder sound file: ${sound}`);
}); 