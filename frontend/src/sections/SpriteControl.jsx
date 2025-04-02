// SpriteControl.jsx - Updated to handle sprite selection and addition
import { useState } from "react";
import BallIcon from "../assets/ball.svg";
import RocketIcon from "../assets/rocket.svg";
import CarIcon from "../assets/car.svg";
import CatSprite from "../assets/cat.svg";

function SpriteControl({ sprites, selectedSprite, onSpriteAdd, onSpriteSelect }) {
  const [showMenu, setShowMenu] = useState(false);

  const availableSprites = [
    { id: "sprite-ball", name: "Ball", src: BallIcon },
    { id: "sprite-cat", name: "Cat", src: CatSprite },
    { id: "sprite-rocket", name: "Rocket", src: RocketIcon },
    { id: "sprite-car", name: "Car", src: CarIcon },
  ];

  const addSprite = (sprite) => {
    // Generate a unique ID for the new sprite
    const newSprite = {
      ...sprite,
      id: `${sprite.id}-${Date.now()}`, // Ensure uniqueness
    };
    
    onSpriteAdd(newSprite);
    setShowMenu(false);
  };

  return (
    <div className="h-100 w-full bg-white border-gray-300 border-2 rounded-b-lg p-4">
      <button 
        onClick={() => setShowMenu(!showMenu)} 
        className="w-full h-8 bg-indigo-500 rounded-lg text-white text-2xl"
      >
        +
      </button>

      {showMenu && (
        <div className="w-full bg-gray-200 p-2 rounded-lg shadow-md flex gap-2 mt-2 justify-center">
          {availableSprites.map((sprite) => (
            <div
              key={sprite.id}
              className="h-12 w-12 cursor-pointer hover:scale-110 transition flex items-center justify-center bg-white rounded-md"
              onClick={() => addSprite(sprite)}
            >
              <img src={sprite.src} alt={sprite.name} className="h-10 w-10" />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-4 flex-wrap">
        {sprites.map((sprite) => (
          <div 
            key={sprite.id} 
            className={`h-18 w-18 flex items-center justify-center bg-gray-100 rounded-md ${
              selectedSprite?.id === sprite.id ? 'border-2 border-blue-500' : ''
            }`} 
            onClick={() => onSpriteSelect(sprite)}
          >
            <img src={sprite.src} alt={sprite.name} className="h-30 w-30" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpriteControl;